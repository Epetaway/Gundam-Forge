#!/usr/bin/env tsx
/**
 * fetchCardAssets.ts - Enhanced version
 * 
 * Fetches card art from ExBurst API and pricing from TCG marketplaces
 * 
 * Usage:
 *   npm run fetch-assets
 * 
 * Environment variables:
 *   USE_MOCK_PRICES - Use mock prices (default: true)
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
import type { CardDefinition, CardPrice } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * ExBurst card database lookup
 */
async function searchExBurstCard(cardName: string): Promise<string | null> {
  try {
    // Try searching ExBurst for the card
    const searchUrl = 'https://exburst.dev/gundam/cardlist';
    console.log(`    Searching ExBurst for "${cardName}"...`);
    
    // Note: ExBurst uses client-side rendering, so we can't directly query it
    // Instead, try common image URL patterns
    return null;
  } catch (error) {
    console.warn(`    ExBurst search error: ${error}`);
    return null;
  }
}

/**
 * Try multiple image URL patterns for ExBurst
 */
async function tryExBurstUrls(cardId: string): Promise<string | null> {
  const patterns = [
    `https://exburst.dev/gundam/cards/sd/${cardId}.webp`,
    // Some newer cards have timestamps
    `https://exburst.dev/gundam/cards/sd/${cardId}_*.webp`, // This won't work without actual timestamp
  ];

  for (const pattern of patterns) {
    if (pattern.includes('*')) continue; // Skip patterns with wildcards

    try {
      const response = await fetch(pattern);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        // Check if response is likely valid (>5KB)
        if (buffer.byteLength > 5000) {
          return pattern;
        }
      }
    } catch (error) {
      // Continue to next pattern
    }
  }

  return null;
}

/**
 * Download and save image (preserving quality)
 */
async function downloadImage(
  imageUrl: string,
  outputPath: string,
  cardId: string
): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`    ✗ Download failed (${response.status})`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    
    // Check file size - if too small, likely an error
    if (buffer.byteLength < 5000) {
      console.warn(`    ✗ File too small (${(buffer.byteLength / 1024).toFixed(1)}KB) - skipping`);
      return false;
    }

    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(buffer));
    
    // Get content type for quality info
    const contentType = response.headers.get('content-type') || 'unknown';
    const sizeKB = (buffer.byteLength / 1024).toFixed(1);
    console.log(
      `    ✓ Downloaded (${sizeKB}KB, ${contentType})`
    );
    return true;
  } catch (error) {
    console.warn(`    Error: ${error}`);
    return false;
  }
}

/**
 * Setup price manager
 */
function setupPriceManager(): PriceAPIManager {
  const manager = new PriceAPIManager();

  if (process.env.USE_MOCK_PRICES !== 'false') {
    console.log('  Using mock price source\n');
    manager.addSource(new MockPriceSource());
    return manager;
  }

  if (process.env.TCGPLAYER_PUBLIC_KEY && process.env.TCGPLAYER_PRIVATE_KEY) {
    manager.addSource(
      new TCGPlayerPriceSource(
        process.env.TCGPLAYER_PUBLIC_KEY,
        process.env.TCGPLAYER_PRIVATE_KEY
      )
    );
  }

  if (process.env.CARDMARKET_API_KEY) {
    manager.addSource(new CardmarketPriceSource(process.env.CARDMARKET_API_KEY));
  }

  manager.addSource(new MockPriceSource());
  return manager;
}

/**
 * Main fetch operation
 */
async function main() {
  console.log('🎨 Gundam Forge - ExBurst Card Fetcher\n');
  console.log('=====================================\n');

  const cardsPath = path.join(projectRoot, 'apps', 'web', 'src', 'data', 'cards.json');
  let cards: CardDefinition[];

  try {
    const cardsData = await fs.readFile(cardsPath, 'utf-8');
    cards = JSON.parse(cardsData);
    console.log(`✓ Loaded ${cards.length} cards from ${cardsPath}\n`);
  } catch (error) {
    console.error(`✗ Failed to load cards: ${error}`);
    process.exit(1);
  }

  const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');
  const priceManager = setupPriceManager();

  let cardsWithImages = 0;
  let cardsWithPrices = 0;

  // Process each card
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const progress = `[${i + 1}/${cards.length}]`;

    console.log(`${progress} ${card.id} - ${card.name}`);

    // Try to get image from official gundam-gcg.com first (highest quality)
    let imageUrl: string | null = null;
    let source = 'ExBurst';
    
    // Check if we have an official imageUrl already (from sync-official-cards)
    if (card.imageUrl && card.imageUrl.includes('gundam-gcg.com')) {
      imageUrl = card.imageUrl;
      source = 'Official (gundam-gcg.com)';
    }
    
    // Fallback to ExBurst if no official image
    if (!imageUrl) {
      imageUrl = await tryExBurstUrls(card.id);
      source = 'ExBurst';
    }
    
    try {
      if (imageUrl) {
        console.log(`  Downloading image from ${source}...`);
        const extension = imageUrl.includes('.webp') ? 'webp' : imageUrl.split('.').pop() || 'webp';
        const outputPath = path.join(cardArtDir, `${card.id}.${extension}`);

        const downloaded = await downloadImage(imageUrl, outputPath, card.id);
        if (downloaded) {
          card.imageUrl = `/card_art/${card.id}.${extension}`;
          cardsWithImages++;
        }
      } else {
        console.log(`  ℹ Image not found (using placeholder)`);
      }
    } catch (error) {
      console.warn(`  Error fetching image: ${error}`);
    }

    // Fetch price
    try {
      console.log(`  Fetching price...`);
      const price = await priceManager.fetchPrice(card.name, card.set);
      if (price) {
        card.price = price;
        cardsWithPrices++;
        console.log(
          `    ✓ $${price.market ? price.market.toFixed(2) : 'N/A'} (mid: $${price.mid ? price.mid.toFixed(2) : 'N/A'})`
        );
      }
    } catch (error) {
      console.warn(`  Error fetching price: ${error}`);
    }

    console.log();
  }

  // Write updated cards back
  console.log('Writing updated cards.json...');
  try {
    await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2) + '\n');
    console.log('✓ Successfully wrote cards.json\n');
  } catch (error) {
    console.error(`✗ Failed to write cards: ${error}`);
    process.exit(1);
  }

  // Summary
  console.log('📊 Fetch Summary:');
  console.log(`  Total cards: ${cards.length}`);
  console.log(`  Cards with images: ${cardsWithImages}/${cards.length}`);
  console.log(`  Cards with prices: ${cardsWithPrices}/${cards.length}`);
  console.log(
    `\nℹ Cards without images will use placeholderArt URLs as fallback.\n`
  );
  console.log('✅ Done!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
