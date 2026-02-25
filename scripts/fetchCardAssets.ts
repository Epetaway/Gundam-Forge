#!/usr/bin/env tsx
/**
 * fetchCardAssets.ts
 *
 * Downloads card art from exburst.dev with concurrent fetching.
 * Skips cards that already have a local file on disk.
 * Updates cards.json imageUrl to the local path after a successful download.
 *
 * Usage:
 *   npm run fetch-assets
 *
 * Environment variables:
 *   CONCURRENCY           - Parallel download limit (default: 10)
 *   USE_MOCK_PRICES       - Use mock prices, skip live fetch (default: true)
 *   TCGPLAYER_PUBLIC_KEY, TCGPLAYER_PRIVATE_KEY
 *   CARDMARKET_API_KEY
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  PriceAPIManager,
  MockPriceSource,
  CardmarketPriceSource,
  TCGPlayerPriceSource,
} from '../packages/shared/src/price-api';
import type { CardDefinition } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const EXBURST_BASE = 'https://exburst.dev/gundam/cards/sd';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10);

/** Canonical exburst image URL for a card ID */
function exburstUrl(cardId: string): string {
  return `${EXBURST_BASE}/${cardId}.webp`;
}

/** Download a URL to disk. Returns true on success (file written, >5 KB). */
async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;

    const buf = await res.arrayBuffer();
    if (buf.byteLength < 5_000) return false; // Likely an error page or placeholder

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, Buffer.from(buf));
    return true;
  } catch {
    return false;
  }
}

/**
 * Run async task factories with at most `limit` running concurrently.
 * Preserves insertion order in the returned results array.
 */
async function runConcurrent<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

function setupPriceManager(): PriceAPIManager {
  const manager = new PriceAPIManager();

  if (process.env.USE_MOCK_PRICES !== 'false') {
    manager.addSource(new MockPriceSource());
    return manager;
  }

  if (process.env.TCGPLAYER_PUBLIC_KEY && process.env.TCGPLAYER_PRIVATE_KEY) {
    manager.addSource(
      new TCGPlayerPriceSource(
        process.env.TCGPLAYER_PUBLIC_KEY,
        process.env.TCGPLAYER_PRIVATE_KEY,
      ),
    );
  }

  if (process.env.CARDMARKET_API_KEY) {
    manager.addSource(new CardmarketPriceSource(process.env.CARDMARKET_API_KEY));
  }

  // Always have a mock fallback so the script never crashes on missing keys
  manager.addSource(new MockPriceSource());
  return manager;
}

async function main() {
  console.log('Gundam Forge — Card Asset Fetcher');
  console.log(`Source     : ${EXBURST_BASE}`);
  console.log(`Concurrency: ${CONCURRENCY}\n`);

  const cardsPath = path.join(projectRoot, 'apps', 'web', 'src', 'data', 'cards.json');
  const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');

  let cards: CardDefinition[];
  try {
    cards = JSON.parse(await fs.readFile(cardsPath, 'utf-8'));
    console.log(`Loaded ${cards.length} cards from cards.json\n`);
  } catch (err) {
    console.error(`Failed to load cards.json: ${err}`);
    process.exit(1);
  }

  // ── Image downloads ────────────────────────────────────────────────────────
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const imageTasks = cards.map((card, i) => async () => {
    const dest = path.join(cardArtDir, `${card.id}.webp`);
    const localPath = `/card_art/${card.id}.webp`;
    const tag = `[${String(i + 1).padStart(String(cards.length).length, ' ')}/${cards.length}]`;

    // Skip if the file already exists on disk
    try {
      await fs.access(dest);
      if (card.imageUrl !== localPath) card.imageUrl = localPath;
      skipped++;
      console.log(`${tag} SKIP  ${card.id}`);
      return;
    } catch {
      // File not found — download it
    }

    const ok = await downloadImage(exburstUrl(card.id), dest);
    if (ok) {
      card.imageUrl = localPath;
      downloaded++;
      console.log(`${tag} OK    ${card.id}`);
    } else {
      failed++;
      console.log(`${tag} FAIL  ${card.id}`);
    }
  });

  console.log('Downloading images...\n');
  await runConcurrent(imageTasks, CONCURRENCY);

  // ── Price fetch (sequential — rate-limit friendly) ─────────────────────────
  const useMockPrices = process.env.USE_MOCK_PRICES !== 'false';
  if (useMockPrices) {
    console.log('\nSkipping price fetch (USE_MOCK_PRICES=true)');
  } else {
    console.log('\nFetching prices (sequential)...\n');
    const priceManager = setupPriceManager();
    for (const card of cards) {
      try {
        const price = await priceManager.fetchPrice(card.name, card.set);
        if (price) card.price = price;
      } catch {
        // Non-fatal — keep existing price data
      }
    }
  }

  // ── Write updated cards.json ───────────────────────────────────────────────
  console.log('\nWriting cards.json...');
  try {
    await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2) + '\n');
    console.log('Written.\n');
  } catch (err) {
    console.error(`Failed to write cards.json: ${err}`);
    process.exit(1);
  }

  console.log('Summary:');
  console.log(`  Total      ${cards.length}`);
  console.log(`  Downloaded ${downloaded}`);
  console.log(`  Skipped    ${skipped}`);
  console.log(`  Failed     ${failed}`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
