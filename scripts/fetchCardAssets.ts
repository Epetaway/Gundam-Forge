#!/usr/bin/env tsx
/**
 * fetchCardAssets.ts
 *
 * Downloads card art from exburst.dev with concurrent fetching.
 * Probes multiple formats (webp/png/jpg/jpeg), then picks the best quality/size candidate.
 * Skips cards that already have a local file on disk.
 * Updates cards.json imageUrl to the exact local path after a successful download.
 *
 * Usage:
 *   npm run fetch-assets
 *
 * Environment variables:
 *   CONCURRENCY           - Parallel download limit (default: 10)
 *   CARD_IMAGE_MIN_BYTES
 *   CARD_IMAGE_TARGET_MAX_BYTES
 *   CARD_IMAGE_HARD_MAX_BYTES
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
const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
const MIN_IMAGE_BYTES = Number(process.env.CARD_IMAGE_MIN_BYTES ?? 10_000);
const TARGET_IMAGE_MAX_BYTES = Number(process.env.CARD_IMAGE_TARGET_MAX_BYTES ?? 450_000);
const HARD_IMAGE_MAX_BYTES = Number(process.env.CARD_IMAGE_HARD_MAX_BYTES ?? 1_200_000);

type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

interface ImageCandidate {
  url: string;
  ext: ImageExtension;
  bytes: number;
  buffer: Buffer;
}

/** Canonical exburst image URL for a card ID */
function exburstUrl(cardId: string, ext: ImageExtension): string {
  return `${EXBURST_BASE}/${cardId}.${ext}`;
}

function scoreCandidate(candidate: ImageCandidate): number {
  if (candidate.bytes < MIN_IMAGE_BYTES || candidate.bytes > HARD_IMAGE_MAX_BYTES) return Number.NEGATIVE_INFINITY;

  // Quality proxy: larger files generally preserve more detail up to a target budget.
  const qualityScore = Math.min(candidate.bytes, TARGET_IMAGE_MAX_BYTES) / TARGET_IMAGE_MAX_BYTES;
  const oversizePenalty =
    candidate.bytes > TARGET_IMAGE_MAX_BYTES
      ? ((candidate.bytes - TARGET_IMAGE_MAX_BYTES) / TARGET_IMAGE_MAX_BYTES) * 0.35
      : 0;
  const formatBonus = candidate.ext === 'webp' ? 0.08 : candidate.ext === 'png' ? 0.03 : 0;

  return qualityScore - oversizePenalty + formatBonus;
}

async function fetchCandidate(url: string, ext: ImageExtension): Promise<ImageCandidate | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('image')) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < MIN_IMAGE_BYTES || buf.byteLength > HARD_IMAGE_MAX_BYTES) return null;

    return {
      url,
      ext,
      bytes: buf.byteLength,
      buffer: buf,
    };
  } catch {
    return null;
  }
}

async function findLocalImage(cardArtDir: string, cardId: string): Promise<string | null> {
  for (const ext of IMAGE_EXTENSIONS) {
    const fullPath = path.join(cardArtDir, `${cardId}.${ext}`);
    try {
      await fs.access(fullPath);
      return `/card_art/${cardId}.${ext}`;
    } catch {
      // continue
    }
  }
  return null;
}

async function removeOtherVariants(cardArtDir: string, cardId: string, keepExt: ImageExtension): Promise<void> {
  await Promise.all(
    IMAGE_EXTENSIONS
      .filter((ext) => ext !== keepExt)
      .map(async (ext) => {
        const fullPath = path.join(cardArtDir, `${cardId}.${ext}`);
        try {
          await fs.unlink(fullPath);
        } catch {
          // ignore missing files
        }
      }),
  );
}

async function downloadBestImage(cardId: string): Promise<ImageCandidate | null> {
  const candidates: ImageCandidate[] = [];

  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = await fetchCandidate(exburstUrl(cardId, ext), ext);
    if (candidate) candidates.push(candidate);
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const best = candidates[0];
  if (scoreCandidate(best) === Number.NEGATIVE_INFINITY) return null;

  return best;
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

  const cardsPath = path.join(projectRoot, 'apps', 'web', 'lib', 'data', 'cards.json');
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
  const downloadedByFormat: Record<ImageExtension, number> = {
    webp: 0,
    png: 0,
    jpg: 0,
    jpeg: 0,
  };

  const imageTasks = cards.map((card, i) => async () => {
    const tag = `[${String(i + 1).padStart(String(cards.length).length, ' ')}/${cards.length}]`;

    const existingLocalPath = await findLocalImage(cardArtDir, card.id);
    if (existingLocalPath) {
      if (card.imageUrl !== existingLocalPath) card.imageUrl = existingLocalPath;
      skipped++;
      console.log(`${tag} SKIP  ${card.id} (${existingLocalPath.split('.').pop()})`);
      return;
    }

    const best = await downloadBestImage(card.id);
    if (best) {
      const dest = path.join(cardArtDir, `${card.id}.${best.ext}`);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, best.buffer);
      await removeOtherVariants(cardArtDir, card.id, best.ext);

      const localPath = `/card_art/${card.id}.${best.ext}`;
      card.imageUrl = localPath;
      downloaded++;
      downloadedByFormat[best.ext] += 1;
      console.log(`${tag} OK    ${card.id} (${best.ext}, ${(best.bytes / 1024).toFixed(1)}KB)`);
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
  if (downloaded > 0) {
    const byFormat = IMAGE_EXTENSIONS
      .map((ext) => `${ext}:${downloadedByFormat[ext]}`)
      .join('  ');
    console.log(`  Formats    ${byFormat}`);
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
