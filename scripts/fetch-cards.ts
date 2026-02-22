#!/usr/bin/env node

/**
 * ETL Pipeline: Fetch & Transform Official Gundam TCG Cards
 *
 * This script orchestrates the Extract-Transform-Load process:
 * 1. Extract: Fetch card data from official sources (via API or scraping)
 * 2. Transform: Normalize, deduplicate, enrich with metadata
 * 3. Load: Validate and merge into canonical database
 *
 * Official Sources (Priority Order):
 * 1. Bandai Official API (if available)
 * 2. Official PDF set checklists (Puppeteer scrape)
 * 3. Authorized Bandai app data (community-sourced)
 *
 * Usage:
 *   npx ts-node scripts/fetch-cards.ts --source=bandai --set=UC-1
 *   npx ts-node scripts/fetch-cards.ts --source=all (full sync)
 *   npx ts-node scripts/fetch-cards.ts --incremental (changed cards only)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface CardSource {
  name: string;
  type: 'api' | 'scrape' | 'manual';
  reliability: 'official' | 'licensed' | 'community';
  url: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  rateLimitPerSec?: number;
}

interface ETLOptions {
  source?: string;
  set?: string;
  incremental?: boolean;
  dryRun?: boolean;
}

const CARD_SOURCES: Record<string, CardSource> = {
  'bandai-official': {
    name: 'Bandai Official Website',
    type: 'api',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/api/cards',
    frequency: 'weekly',
    rateLimitPerSec: 1
  },
  'bandai-set-release': {
    name: 'Bandai Set Release PDFs',
    type: 'scrape',
    reliability: 'official',
    url: 'https://bandai.official/gundam-tcg/sets',
    frequency: 'monthly',
    rateLimitPerSec: 0.5
  },
  'authorized-app': {
    name: 'Authorized Bandai Companion App',
    type: 'api',
    reliability: 'licensed',
    url: 'https://gundam-tcg-app.official/api/v1/cards',
    frequency: 'weekly'
  },
  'community-wiki': {
    name: 'Community TCG Wiki',
    type: 'scrape',
    reliability: 'community',
    url: 'https://gundam-tcg-wiki.community/cards',
    frequency: 'daily'
  }
};

/**
 * Placeholder: Mock fetch implementation
 * In production, replace with actual fetch logic for each source
 */
const fetchFromSource = async (source: CardSource, setCode?: string): Promise<unknown[]> => {
  console.log(`📡 Fetching from: ${source.name}`);
  console.log(`   Type: ${source.type}, Reliability: ${source.reliability}`);

  if (source.type === 'api') {
    // Placeholder: Would use axios/node-fetch
    console.log(`   → Would call API: ${source.url}?set=${setCode || 'all'}`);
  } else if (source.type === 'scrape') {
    // Placeholder: Would use Puppeteer or Cheerio
    console.log(`   → Would scrape: ${source.url}`);
  }

  // For now, return empty array (in production, fetch real data)
  return [];
};

interface RawCard {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Transform & normalize card data from various sources
 */
const normalizeCard = (raw: RawCard, sourceKey: string): Record<string, unknown> => {
  const source = CARD_SOURCES[sourceKey] || CARD_SOURCES['community-wiki'];

  return {
    id: raw.id || 'UNKNOWN',
    name: raw.name || 'Unnamed',
    source: sourceKey,
    sourceUrl: CARD_SOURCES[sourceKey]?.url,
    lastUpdated: new Date().toISOString()
    // Additional normalization would happen here
  };
};

/**
 * Deduplicate cards by ID, keeping the highest-reliability source
 */
const deduplicateCards = (
  cards: Array<{ id: string; source: string; [key: string]: unknown }>
): Array<{ id: string; source: string; [key: string]: unknown }> => {
  const byId = new Map<string, typeof cards[0]>();
  const sourceReliability: Record<string, number> = {
    'bandai-official': 100,
    'bandai-set-release': 95,
    'authorized-app': 80,
    'community-wiki': 40
  };

  for (const card of cards) {
    const existing = byId.get(card.id);
    if (!existing) {
      byId.set(card.id, card);
    } else {
      const newReliability = sourceReliability[card.source] || 0;
      const existingReliability = sourceReliability[existing.source] || 0;
      if (newReliability > existingReliability) {
        byId.set(card.id, card);
      }
    }
  }

  return Array.from(byId.values());
};

/**
 * Compute checksums for change detection
 */
const computeChecksum = (data: Record<string, unknown>): string => {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

/**
 * Main ETL orchestrator
 */
const runETL = async (options: ETLOptions): Promise<void> => {
  console.log('🚀 Starting ETL Pipeline');
  console.log('━'.repeat(70));

  const sourceKeys = options.source ? [options.source] : Object.keys(CARD_SOURCES);
  const filters: Record<string, unknown> = {};

  if (options.set) {
    filters.setCode = options.set;
  }

  const allCards: unknown[] = [];

  // Extract phase
  console.log('\n📥 EXTRACT PHASE');
  console.log('─'.repeat(70));
  for (const sourceKey of sourceKeys) {
    const source = CARD_SOURCES[sourceKey];
    if (!source) {
      console.warn(`⚠️  Unknown source: ${sourceKey}`);
      continue;
    }

    const cards = await fetchFromSource(source, options.set);
    console.log(`✓ Fetched ${cards.length} card(s)`);
    allCards.push(...cards);

    // Respect rate limits
    if (source.rateLimitPerSec) {
      const delay = (1000 / source.rateLimitPerSec) * cards.length;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Transform phase
  console.log('\n🔄 TRANSFORM PHASE');
  console.log('─'.repeat(70));
  const normalized: Array<{ id: string; source: string; [key: string]: unknown }> = [];

  for (const card of allCards) {
    if (typeof card !== 'object' || card === null) continue;
    const raw = card as RawCard;
    const transformed = normalizeCard(raw, options.source || 'community-wiki');
    if (typeof transformed === 'object' && transformed !== null && 'id' in transformed) {
      normalized.push(transformed as any);
    }
  }

  console.log(`✓ Normalized ${normalized.length} card(s)`);

  const deduplicated = deduplicateCards(normalized);
  console.log(`✓ Deduplicated to ${deduplicated.length} unique card(s)`);

  // Load phase
  console.log('\n📤 LOAD PHASE');
  console.log('─'.repeat(70));

  if (options.dryRun) {
    console.log('🏝️  DRY RUN: Would have loaded the following:');
    console.log(`   - ${deduplicated.length} cards`);
    console.log(`   - Sample IDs: ${deduplicated.slice(0, 5).map((c) => c.id).join(', ')}`);
  } else {
    const outputPath = path.resolve(process.cwd(), 'seed/fetched_cards.json');
    fs.writeFileSync(outputPath, JSON.stringify(deduplicated, null, 2));
    console.log(`✓ Saved to: ${outputPath}`);
  }

  // Generate changelog
  console.log('\n📋 CHANGELOG');
  console.log('─'.repeat(70));
  console.log(`Added/Updated: ${deduplicated.length} cards`);
  console.log(`From sources: ${sourceKeys.join(', ')}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  console.log('\n✅ ETL Pipeline Complete');
  console.log('━'.repeat(70));
};

const parseArgs = (): ETLOptions => {
  const args = process.argv.slice(2);
  return {
    source: args
      .find((arg) => arg.startsWith('--source='))
      ?.split('=')[1],
    set: args.find((arg) => arg.startsWith('--set='))?.split('=')[1],
    incremental: args.includes('--incremental'),
    dryRun: args.includes('--dry-run')
  };
};

const main = async () => {
  const options = parseArgs();

  console.log('📊 Available Sources:');
  for (const [key, source] of Object.entries(CARD_SOURCES)) {
    console.log(
      `  ${key.padEnd(20)} | ${source.name.padEnd(40)} | ${source.reliability.padEnd(10)} | ${source.frequency}`
    );
  }
  console.log();

  try {
    await runETL(options);
  } catch (e) {
    console.error('❌ ETL Error:', e);
    process.exit(1);
  }
};

main();
