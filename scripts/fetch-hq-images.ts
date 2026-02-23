#!/usr/bin/env tsx
/**
 * fetch-hq-images.ts - Fast high-quality image fetcher
 * 
 * Fetches card art directly from gundam-gcg.com in high quality
 * without needing the full card sync
 * 
 * Usage:
 *   npm run fetch-hq-images
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CardDefinition } from '../packages/shared/src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Construct likely image URLs for gundam-gcg.com
 * Based on the pattern we discovered: /en/images/cards/card/{cardId}.webp
 */
function getOfficialImageUrls(cardId: string): string[] {
  const baseUrl = 'https://www.gundam-gcg.com/en/images/cards/card';
  
  return [
    // Standard format
    `${baseUrl}/${cardId}.webp`,
    `${baseUrl}/${cardId}_p1.webp`,
    `${baseUrl}/${cardId}_p2.webp`,
    `${baseUrl}/${cardId}_p3.webp`,
    `${baseUrl}/${cardId}_p4.webp`,
    `${baseUrl}/${cardId}_p5.webp`,
  ];
}

/**
 * Try to fetch a card image, checking multiple URL patterns
 */
async function fetchImageUrl(cardId: string): Promise<string | null> {
  const urls = getOfficialImageUrls(cardId);
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Gundam-Forge/1.0)',
        }
      });
      
      if (response.ok && response.headers.get('content-type')?.includes('image')) {
        const buffer = await response.arrayBuffer();
        // Valid image should be at least 10KB
        if (buffer.byteLength > 10000) {
          return url;
        }
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  
  return null;
}

/**
 * Download image with retry logic
 */
async function downloadImage(
  imageUrl: string,
  outputPath: string,
  maxRetries = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(imageUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Gundam-Forge/1.0)',
        }
      });
      
      if (!response.ok) {
        if (attempt === maxRetries - 1) {
          console.warn(`    ✗ Download failed (HTTP ${response.status})`);
        }
        continue;
      }

      const buffer = await response.arrayBuffer();
      
      if (buffer.byteLength < 10000) {
        if (attempt === maxRetries - 1) {
          console.warn(`    ✗ File too small (${(buffer.byteLength / 1024).toFixed(1)}KB)`);
        }
        continue;
      }

      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(outputPath, Buffer.from(buffer));
      
      const sizeKB = (buffer.byteLength / 1024).toFixed(1);
      const contentType = response.headers.get('content-type') || 'webp';
      console.log(`    ✓ Downloaded HQ image (${sizeKB}KB, ${contentType})`);
      return true;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.warn(`    ✗ Download error: ${error}`);
      }
    }
  }
  
  return false;
}

/**
 * Main
 */
async function main() {
  console.log('🎴 High-Quality Card Image Fetcher\n');
  
  const cardsPath = path.join(projectRoot, 'apps', 'web', 'src', 'data', 'cards.json');
  let cards: CardDefinition[];

  try {
    const cardsData = await fs.readFile(cardsPath, 'utf-8');
    cards = JSON.parse(cardsData);
    console.log(`✓ Loaded ${cards.length} cards\n`);
  } catch (error) {
    console.error(`✗ Failed to load cards: ${error}`);
    process.exit(1);
  }

  const cardArtDir = path.join(projectRoot, 'apps', 'web', 'public', 'card_art');
  let upgraded = 0;
  let skipped = 0;

  // Process each card
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const progress = `[${i + 1}/${cards.length}]`;
    
    // Skip cards that already have high-quality source URLs
    if (card.imageUrl?.includes('gundam-gcg.com')) {
      skipped++;
      continue;
    }

    console.log(`${progress} ${card.id} - ${card.name}`);

    try {
      const imageUrl = await fetchImageUrl(card.id);
      if (imageUrl) {
        console.log(`  Found HQ image on official site`);
        const extension = 'webp';
        const outputPath = path.join(cardArtDir, `${card.id}.${extension}`);

        const downloaded = await downloadImage(imageUrl, outputPath);
        if (downloaded) {
          card.imageUrl = imageUrl; // Store the official URL
          upgraded++;
        }
      } else {
        console.log(`  ℹ No HQ image found on official site`);
      }
    } catch (error) {
      console.warn(`  Error: ${error}`);
    }
  }

  // Write updated cards.json
  try {
    await fs.writeFile(cardsPath, JSON.stringify(cards, null, 2));
    console.log('\n✓ Updated cards.json');
  } catch (error) {
    console.error(`\n✗ Failed to write cards.json: ${error}`);
    process.exit(1);
  }

  console.log(`\n📊 HQ Image Fetch Summary:`);
  console.log(`  Total cards: ${cards.length}`);
  console.log(`  Upgraded to HQ: ${upgraded}`);
  console.log(`  Already have official URLs: ${skipped}`);
  console.log(`\n✅ Done!`);
}

main().catch(console.error);
