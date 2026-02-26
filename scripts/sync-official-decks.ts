#!/usr/bin/env tsx

/**
 * sync-official-decks.ts
 *
 * Scrapes all official GCG deck pages from gundam-gcg.com and regenerates:
 *   1. apps/web/lib/data/officialDecks.ts  (TypeScript static data)
 *   2. supabase/seed-official-decks.sql    (Supabase seed migration)
 *
 * Usage:
 *   npm run sync-decks
 *   GUNDAM_GCG_DECK_LIMIT=5 npm run sync-decks   # only first 5 decks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_BASE_URL = 'https://www.gundam-gcg.com';
const DECKS_INDEX_URL = `${DEFAULT_BASE_URL}/en/decks/`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Types ───

interface ScrapedCard {
  cardId: string;
  qty: number;
  isBoss: boolean;
}

interface ScrapedDeck {
  slug: string;
  name: string;
  description: string;
  colors: string[];
  sourceUrl: string;
  cards: ScrapedCard[];
}

// ─── Archetype Inference ───

const ARCHETYPE_RULES: Array<{ pattern: RegExp; archetype: string }> = [
  { pattern: /tekkadan/i, archetype: 'Tekkadan Aggro' },
  { pattern: /qubeley/i, archetype: 'Qubeley Control' },
  { pattern: /celestial being/i, archetype: 'Celestial Being' },
  { pattern: /neo zeon/i, archetype: 'Neo Zeon' },
  { pattern: /zeon/i, archetype: 'Neo Zeon' },
  { pattern: /aeug/i, archetype: 'AEUG' },
  { pattern: /titans/i, archetype: 'Titans' },
  { pattern: /jupitris/i, archetype: 'Jupitris' },
  { pattern: /zaft/i, archetype: 'ZAFT' },
  { pattern: /seed/i, archetype: 'SEED' },
  { pattern: /earth federation/i, archetype: 'Earth Federation' },
  { pattern: /earth alliance/i, archetype: 'SEED' },
  { pattern: /operation meteor/i, archetype: 'Operation Meteor' },
  { pattern: /gquuuuuux/i, archetype: 'Red Aggro' },
  { pattern: /hathaway/i, archetype: 'Red/Blue Control' },
  { pattern: /cyclops/i, archetype: 'Blue/Green Breach' },
  { pattern: /the-o/i, archetype: 'Purple Control' },
  { pattern: /freedom gundam/i, archetype: 'Blue/White Midrange' },
  { pattern: /age.*wing/i, archetype: 'Green/White Ramp' },
  { pattern: /dynames.*altron|altron.*dynames/i, archetype: 'Celestial Being' },
  { pattern: /triple ship/i, archetype: 'SEED' },
  { pattern: /xi gundam/i, archetype: 'Qubeley Control' },
];

const inferArchetype = (name: string, description: string, colors: string[]): string => {
  const text = `${name} ${description}`;

  for (const rule of ARCHETYPE_RULES) {
    if (rule.pattern.test(text)) return rule.archetype;
  }

  // Fallback: color-based archetype
  const sorted = [...colors].sort();
  const key = sorted.join('/');
  const colorArchetypes: Record<string, string> = {
    'Blue': 'Blue Tempo',
    'Red': 'Red Aggro',
    'Green': 'Green Ramp',
    'White': 'White Weenie',
    'Purple': 'Purple Control',
    'Blue/White': 'Blue/White Midrange',
    'Blue/Green': 'Blue/Green Breach',
    'Green/White': 'Green/White Ramp',
    'Red/White': 'SEED',
    'Red/Purple': 'Qubeley Control',
    'Green/Purple': 'Celestial Being',
    'Blue/Red': 'Red/Blue Control',
    'Purple/Blue': 'Purple Control',
  };
  return colorArchetypes[key] || `${key} Midrange`;
};

// ─── Color Normalization ───

const VALID_COLORS = new Set(['Blue', 'Red', 'Green', 'White', 'Purple']);

const normalizeColor = (raw: string): string | null => {
  const cleaned = raw.trim();
  // Handle "Yellow" -> "White" mapping (game uses both)
  if (/yellow/i.test(cleaned)) return 'White';
  for (const c of VALID_COLORS) {
    if (c.toLowerCase() === cleaned.toLowerCase()) return c;
  }
  return null;
};

// ─── Scraping ───

const discoverDeckUrls = async (indexHtml: string): Promise<string[]> => {
  const urls: string[] = [];
  // Match links like deck-001.php, deck-002.php, etc.
  const regex = /href="([^"]*deck-(\d{3})\.php[^"]*)"/gi;
  let match = regex.exec(indexHtml);
  while (match) {
    const href = match[1];
    const url = href.startsWith('http') ? href : new URL(href, DECKS_INDEX_URL).toString();
    if (!urls.includes(url)) {
      urls.push(url);
    }
    match = regex.exec(indexHtml);
  }
  // Sort by deck number
  urls.sort((a, b) => {
    const numA = parseInt(a.match(/deck-(\d+)/)?.[1] ?? '0', 10);
    const numB = parseInt(b.match(/deck-(\d+)/)?.[1] ?? '0', 10);
    return numA - numB;
  });
  return urls;
};

const scrapeDeckWithPlaywright = async (url: string): Promise<ScrapedDeck | null> => {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });

    const data = await page.evaluate(() => {
      // Extract deck name from the heading
      const nameEl = document.querySelector('h1, h2, .deckName, .deck-name, [class*="deckTitle"]');
      const name = nameEl?.textContent?.trim() || '';

      // Extract description
      const descEl = document.querySelector(
        '.deckDescription, .deck-description, .deckText, [class*="description"], [class*="strategy"], .deckDetail p, .detailBody p'
      );
      const description = descEl?.textContent?.trim() || '';

      // Extract card list from the deck page
      // GCG deck pages typically show card images with card IDs and quantities
      const cards: Array<{ cardId: string; qty: number }> = [];

      // Strategy 1: Look for elements with data attributes containing card info
      document.querySelectorAll('[data-card-id], [data-card-no], [data-cardno]').forEach((el) => {
        const cardId = (
          el.getAttribute('data-card-id') ||
          el.getAttribute('data-card-no') ||
          el.getAttribute('data-cardno') ||
          ''
        ).trim().toUpperCase();
        const qtyStr = el.getAttribute('data-qty') || el.getAttribute('data-quantity') || '1';
        const qty = parseInt(qtyStr, 10) || 1;
        if (cardId && /^[A-Z]{2,4}\d{0,2}-\d{3,4}$/.test(cardId)) {
          cards.push({ cardId, qty });
        }
      });

      // Strategy 2: Look for card list items with card number text and quantities
      if (cards.length === 0) {
        document.querySelectorAll('.cardItem, .deckCardItem, .card-item, [class*="cardList"] li, [class*="deckCard"]').forEach((el) => {
          const text = el.textContent || '';
          const idMatch = text.match(/([A-Z]{2,4}\d{0,2}-\d{3,4})/);
          const qtyMatch = text.match(/[x×]\s*(\d+)/i) || text.match(/(\d+)\s*[x×]/i);
          if (idMatch) {
            const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
            cards.push({ cardId: idMatch[1].toUpperCase(), qty: Math.min(qty, 4) });
          }
        });
      }

      // Strategy 3: Parse card images with alt text or title containing card IDs
      if (cards.length === 0) {
        document.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          const title = img.getAttribute('title') || '';
          const combined = `${src} ${alt} ${title}`;
          const idMatch = combined.match(/([A-Z]{2,4}\d{0,2}-\d{3,4})/);
          if (idMatch) {
            cards.push({ cardId: idMatch[1].toUpperCase(), qty: 1 });
          }
        });
      }

      // Strategy 4: Scrape from card grid images (GCG specific - cards shown as images in a grid)
      if (cards.length === 0) {
        document.querySelectorAll('.cardStr, .deckCardStr, a[href*="card"]').forEach((el) => {
          const href = el.getAttribute('href') || el.getAttribute('data-src') || '';
          const idMatch = href.match(/(?:detailSearch=|card_no=|cardNo=)([A-Z0-9-]+)/i);
          if (idMatch) {
            const cardId = idMatch[1].toUpperCase().split('_')[0]; // Remove _p1 variants
            if (/^[A-Z]{2,4}\d{0,2}-\d{3,4}$/.test(cardId)) {
              cards.push({ cardId, qty: 1 });
            }
          }
        });
      }

      // Extract colors from color indicators or badges
      const colorEls = document.querySelectorAll(
        '.deckColor, .color-badge, [class*="color"], [data-color]'
      );
      const colors: string[] = [];
      colorEls.forEach((el) => {
        const color = el.getAttribute('data-color') || el.textContent?.trim() || '';
        if (color && color.length < 20) colors.push(color);
      });

      return { name, description, cards, colors };
    });

    await browser.close();

    if (!data.name && data.cards.length === 0) {
      return null;
    }

    // Deduplicate and merge card quantities
    const cardMap = new Map<string, number>();
    for (const c of data.cards) {
      cardMap.set(c.cardId, (cardMap.get(c.cardId) || 0) + c.qty);
    }

    const slug = url.match(/deck-(\d+)/)?.[0] ?? 'deck-unknown';
    const normalizedColors = data.colors
      .map(normalizeColor)
      .filter((c): c is string => c !== null);
    const uniqueColors = [...new Set(normalizedColors)];

    const cards: ScrapedCard[] = Array.from(cardMap.entries()).map(([cardId, qty]) => ({
      cardId,
      qty: Math.min(qty, 4),
      isBoss: false, // Will be set from existing data or strategy text
    }));

    return {
      slug,
      name: data.name,
      description: data.description,
      colors: uniqueColors,
      sourceUrl: url,
      cards,
    };
  } catch (error) {
    console.warn(`  ⚠️  Playwright scrape failed for ${url}: ${error}`);
    return null;
  }
};

const scrapeDeckWithFetch = async (url: string): Promise<ScrapedDeck | null> => {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Gundam-Forge-Sync/1.0 (+https://github.com/Epetaway/Gundam-Forge)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!response.ok) return null;
    const html = await response.text();

    // Extract deck name from title or heading
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/si);
    const name = (h1Match?.[1] || titleMatch?.[1] || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract description from meta or paragraph
    const descMatch = html.match(
      /(?:description|strategy|deckText|detailBody)[^>]*>([\s\S]*?)<\//i
    );
    const description = (descMatch?.[1] || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract card IDs from the HTML
    const cardIdRegex = /([A-Z]{2,4}\d{0,2}-\d{3,4})/g;
    const cardMap = new Map<string, number>();
    let match = cardIdRegex.exec(html);
    while (match) {
      const cardId = match[1].toUpperCase();
      cardMap.set(cardId, (cardMap.get(cardId) || 0) + 1);
      match = cardIdRegex.exec(html);
    }

    // Extract colors from content
    const colorRegex = /(?:data-color|class)="[^"]*\b(blue|red|green|white|purple|yellow)\b[^"]*"/gi;
    const colors: string[] = [];
    match = colorRegex.exec(html);
    while (match) {
      const c = normalizeColor(match[1]);
      if (c && !colors.includes(c)) colors.push(c);
      match = colorRegex.exec(html);
    }

    const slug = url.match(/deck-(\d+)/)?.[0] ?? 'deck-unknown';
    const cards: ScrapedCard[] = Array.from(cardMap.entries()).map(([cardId, qty]) => ({
      cardId,
      qty: Math.min(qty, 4),
      isBoss: false,
    }));

    if (cards.length === 0) return null;

    return {
      slug,
      name: name || `Official Deck ${slug}`,
      description,
      colors,
      sourceUrl: url,
      cards,
    };
  } catch (error) {
    console.warn(`  ⚠️  Fetch scrape failed for ${url}: ${error}`);
    return null;
  }
};

// ─── Merge with Existing Data ───

interface ExistingDeck {
  slug: string;
  name: string;
  description: string;
  archetype: string;
  colors: string[];
  sourceUrl: string;
  cards: ScrapedCard[];
}

const loadExistingDecks = async (): Promise<Map<string, ExistingDeck>> => {
  const filePath = path.join(projectRoot, 'apps', 'web', 'lib', 'data', 'officialDecks.ts');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const map = new Map<string, ExistingDeck>();

    // Parse each deck block from the TS file
    const deckBlocks = content.split(/\/\/ ─── deck-\d+/).slice(1);
    for (const block of deckBlocks) {
      const slugMatch = block.match(/slug:\s*'(deck-\d+)'/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];

      const nameMatch = block.match(/name:\s*'([^']+)'|name:\s*"([^"]+)"/);
      const descMatch = block.match(/description:\s*\n?\s*['"`]([\s\S]*?)['"`],?\s*\n\s*archetype/);
      const archetypeMatch = block.match(/archetype:\s*'([^']+)'/);
      const colorsMatch = block.match(/colors:\s*\[(.*?)\]/);
      const sourceUrlMatch = block.match(/sourceUrl:\s*'([^']+)'/);

      const colors = colorsMatch
        ? colorsMatch[1].match(/'([^']+)'/g)?.map((c) => c.replace(/'/g, '')) || []
        : [];

      // Parse cards
      const cards: ScrapedCard[] = [];
      const cardRegex = /\{\s*cardId:\s*'([^']+)',\s*qty:\s*(\d+),\s*isBoss:\s*(true|false)\s*\}/g;
      let cardMatch = cardRegex.exec(block);
      while (cardMatch) {
        cards.push({
          cardId: cardMatch[1],
          qty: parseInt(cardMatch[2], 10),
          isBoss: cardMatch[3] === 'true',
        });
        cardMatch = cardRegex.exec(block);
      }

      map.set(slug, {
        slug,
        name: nameMatch?.[1] || nameMatch?.[2] || slug,
        description: descMatch?.[1]?.replace(/\\'/g, "'").replace(/\\"/g, '"') || '',
        archetype: archetypeMatch?.[1] || '',
        colors,
        sourceUrl: sourceUrlMatch?.[1] || '',
        cards,
      });
    }

    return map;
  } catch {
    return new Map();
  }
};

const mergeDecks = (
  existing: Map<string, ExistingDeck>,
  scraped: ScrapedDeck[]
): ExistingDeck[] => {
  const result: ExistingDeck[] = [];

  for (const deck of scraped) {
    const prev = existing.get(deck.slug);

    // Use scraped data, but preserve boss flags and archetype from existing
    const mergedCards = deck.cards.map((c) => {
      const prevCard = prev?.cards.find((p) => p.cardId === c.cardId);
      return {
        cardId: c.cardId,
        qty: c.qty,
        isBoss: prevCard?.isBoss ?? c.isBoss,
      };
    });

    const colors = deck.colors.length > 0 ? deck.colors : prev?.colors || [];
    const name = deck.name || prev?.name || deck.slug;
    const description = deck.description || prev?.description || '';
    const archetype =
      prev?.archetype || inferArchetype(name, description, colors);

    result.push({
      slug: deck.slug,
      name,
      description,
      archetype,
      colors,
      sourceUrl: deck.sourceUrl,
      cards: mergedCards,
    });
  }

  // Also include existing decks not found in scraped data (keep them)
  for (const [slug, prev] of existing) {
    if (!result.find((d) => d.slug === slug)) {
      console.log(`  ℹ️  Keeping existing deck not found on site: ${slug}`);
      result.push(prev);
    }
  }

  // Sort by slug number
  result.sort((a, b) => {
    const numA = parseInt(a.slug.replace('deck-', ''), 10);
    const numB = parseInt(b.slug.replace('deck-', ''), 10);
    return numA - numB;
  });

  return result;
};

// ─── Output Generators ───

const escapeTs = (str: string): string =>
  str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');

const escapeSql = (str: string): string =>
  str.replace(/'/g, "''");

const generateOfficialDecksTs = (decks: ExistingDeck[]): string => {
  let out = `/**
 * Official GCG prebuilt deck data scraped from https://www.gundam-gcg.com/en/decks/
 * Each deck includes card IDs, quantities, and boss/key cards identified from strategy text.
 *
 * Auto-generated by: npm run sync-decks
 * Last synced: ${new Date().toISOString().split('T')[0]}
 */

export interface OfficialDeckCard {
  cardId: string;
  qty: number;
  isBoss: boolean;
}

export interface OfficialDeck {
  slug: string;
  name: string;
  description: string;
  archetype: string;
  colors: string[];
  sourceUrl: string;
  cards: OfficialDeckCard[];
}

export const OFFICIAL_DECKS: OfficialDeck[] = [\n`;

  for (const deck of decks) {
    out += `  // ─── ${deck.slug} ───\n`;
    out += `  {\n`;
    out += `    slug: '${escapeTs(deck.slug)}',\n`;
    out += `    name: '${escapeTs(deck.name)}',\n`;
    out += `    description:\n`;
    out += `      '${escapeTs(deck.description)}',\n`;
    out += `    archetype: '${escapeTs(deck.archetype)}',\n`;
    out += `    colors: [${deck.colors.map((c) => `'${c}'`).join(', ')}],\n`;
    out += `    sourceUrl: '${escapeTs(deck.sourceUrl)}',\n`;
    out += `    cards: [\n`;
    for (const card of deck.cards) {
      out += `      { cardId: '${card.cardId}', qty: ${card.qty}, isBoss: ${card.isBoss} },\n`;
    }
    out += `    ],\n`;
    out += `  },\n\n`;
  }

  out += `];\n`;
  return out;
};

const generateSeedSql = (decks: ExistingDeck[]): string => {
  let sql = `-- ============================================================
-- Seed Official GCG Decks
-- Uses uuid_generate_v5 for deterministic, idempotent IDs
-- Re-runnable: ON CONFLICT DO UPDATE
--
-- Auto-generated by: npm run sync-decks
-- Last synced: ${new Date().toISOString().split('T')[0]}
-- ============================================================

-- Fixed namespace UUID for official decks
-- Generated from: uuid_generate_v5(uuid_ns_url(), 'gundam-forge-official-decks')
DO $$
DECLARE
  ns uuid := '6ba7b811-9dad-11d1-80b4-00c04fd430c8'; -- UUID_NS_URL
  base_url text := 'https://gundam-forge.app/official-decks/';
  v_deck_id uuid;
BEGIN
`;

  for (const deck of decks) {
    sql += `\n  -- ─── ${deck.slug}: ${deck.name} ───\n`;
    sql += `  v_deck_id := uuid_generate_v5(ns, base_url || '${deck.slug}');\n`;
    sql += `  INSERT INTO public.decks (id, user_id, name, description, is_public, colors, archetype, source, source_url)\n`;
    sql += `  VALUES (v_deck_id, NULL, '${escapeSql(deck.name)}',\n`;
    sql += `    '${escapeSql(deck.description)}',\n`;
    sql += `    true, ARRAY[${deck.colors.map((c) => `'${c}'`).join(',')}], '${escapeSql(deck.archetype)}', 'official', '${escapeSql(deck.sourceUrl)}')\n`;
    sql += `  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, colors = EXCLUDED.colors, archetype = EXCLUDED.archetype, source_url = EXCLUDED.source_url;\n`;
    sql += `\n`;
    sql += `  DELETE FROM public.deck_cards WHERE deck_id = v_deck_id;\n`;
    sql += `  INSERT INTO public.deck_cards (deck_id, card_id, qty, is_boss) VALUES\n`;

    const cardLines: string[] = [];
    for (const card of deck.cards) {
      cardLines.push(`    (v_deck_id, '${card.cardId}', ${card.qty}, ${card.isBoss})`);
    }
    sql += cardLines.join(',\n') + ';\n';
  }

  sql += `\nEND $$;\n`;
  return sql;
};

// ─── Main ───

const main = async () => {
  const deckLimit = Number(process.env.GUNDAM_GCG_DECK_LIMIT || '0');
  const usePlaywright = process.env.GUNDAM_GCG_USE_PLAYWRIGHT !== 'false';
  const outputTsPath = path.join(projectRoot, 'apps', 'web', 'lib', 'data', 'officialDecks.ts');
  const outputSqlPath = path.join(projectRoot, 'supabase', 'seed-official-decks.sql');

  console.log('🔄 Syncing official decks from gundam-gcg.com');
  console.log(`  Index: ${DECKS_INDEX_URL}`);
  console.log(`  Playwright: ${usePlaywright ? 'enabled' : 'disabled'}`);

  // Step 1: Discover deck URLs
  console.log('\n📋 Discovering deck pages...');
  let deckUrls: string[] = [];

  try {
    const response = await fetch(DECKS_INDEX_URL, {
      headers: {
        'User-Agent': 'Gundam-Forge-Sync/1.0 (+https://github.com/Epetaway/Gundam-Forge)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (response.ok) {
      const indexHtml = await response.text();
      deckUrls = await discoverDeckUrls(indexHtml);
    }
  } catch (error) {
    console.warn(`  ⚠️  Failed to fetch index: ${error}`);
  }

  // If we couldn't discover from the index, try Playwright
  if (deckUrls.length === 0 && usePlaywright) {
    console.log('  Trying Playwright for index page...');
    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(DECKS_INDEX_URL, { waitUntil: 'networkidle', timeout: 45000 });
      const html = await page.content();
      deckUrls = await discoverDeckUrls(html);
      await browser.close();
    } catch (error) {
      console.warn(`  ⚠️  Playwright index scrape failed: ${error}`);
    }
  }

  // Fallback: generate URLs from known pattern (deck-001 through deck-050)
  if (deckUrls.length === 0) {
    console.log('  Using fallback URL pattern (deck-001 to deck-050)...');
    for (let i = 1; i <= 50; i++) {
      deckUrls.push(`${DEFAULT_BASE_URL}/en/decks/deck-${String(i).padStart(3, '0')}.php`);
    }
  }

  if (deckLimit > 0) {
    deckUrls = deckUrls.slice(0, deckLimit);
  }

  console.log(`  Found ${deckUrls.length} deck URL(s) to check\n`);

  // Step 2: Load existing data for merging
  const existingDecks = await loadExistingDecks();
  console.log(`  Loaded ${existingDecks.size} existing deck(s) for merge\n`);

  // Step 3: Scrape each deck page
  const scrapedDecks: ScrapedDeck[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const url of deckUrls) {
    const slug = url.match(/deck-\d+/)?.[0] ?? 'unknown';
    process.stdout.write(`  Scraping ${slug}... `);

    let deck: ScrapedDeck | null = null;

    if (usePlaywright) {
      deck = await scrapeDeckWithPlaywright(url);
    }

    if (!deck) {
      deck = await scrapeDeckWithFetch(url);
    }

    if (deck && deck.cards.length > 0) {
      scrapedDecks.push(deck);
      successCount++;
      console.log(`✅ ${deck.name} (${deck.cards.length} cards)`);
    } else if (deck) {
      // Page exists but no cards extracted — check if it's a real page
      const existing = existingDecks.get(slug);
      if (existing && existing.cards.length > 0) {
        console.log(`⚠️  No cards scraped, using existing data for ${slug}`);
        scrapedDecks.push({
          slug: existing.slug,
          name: existing.name,
          description: existing.description,
          colors: existing.colors,
          sourceUrl: existing.sourceUrl,
          cards: existing.cards,
        });
        successCount++;
      } else {
        failCount++;
        console.log(`⚠️  No cards found`);
      }
    } else {
      // Page doesn't exist (404 or error) — stop if we've been getting failures
      const existing = existingDecks.get(slug);
      if (existing && existing.cards.length > 0) {
        scrapedDecks.push({
          slug: existing.slug,
          name: existing.name,
          description: existing.description,
          colors: existing.colors,
          sourceUrl: existing.sourceUrl,
          cards: existing.cards,
        });
        successCount++;
        console.log(`ℹ️  Page unavailable, using existing data`);
      } else {
        failCount++;
        console.log(`❌ Not found or empty`);
        // After 3 consecutive 404s with no existing data, stop probing
        if (failCount >= 3 && scrapedDecks.length > 0) {
          console.log(`  Stopping after ${failCount} consecutive failures`);
          break;
        }
      }
    }

    await sleep(300);
  }

  if (scrapedDecks.length === 0) {
    console.error('\n❌ No decks scraped. Using existing data as-is.');
    return;
  }

  // Step 4: Merge and generate output
  console.log(`\n📦 Merging ${scrapedDecks.length} scraped deck(s) with ${existingDecks.size} existing...`);
  const merged = mergeDecks(existingDecks, scrapedDecks);

  console.log(`\n📝 Writing output files...`);

  // Write officialDecks.ts
  const tsContent = generateOfficialDecksTs(merged);
  await fs.writeFile(outputTsPath, tsContent);
  console.log(`  ✅ ${outputTsPath.replace(projectRoot + '/', '')}`);

  // Write seed SQL
  const sqlContent = generateSeedSql(merged);
  await fs.writeFile(outputSqlPath, sqlContent);
  console.log(`  ✅ ${outputSqlPath.replace(projectRoot + '/', '')}`);

  // Summary
  const totalCards = merged.reduce((sum, d) => sum + d.cards.length, 0);
  const totalBoss = merged.reduce((sum, d) => sum + d.cards.filter((c) => c.isBoss).length, 0);
  console.log(`\n✅ Sync complete!`);
  console.log(`  Decks: ${merged.length}`);
  console.log(`  Total card entries: ${totalCards}`);
  console.log(`  Boss cards: ${totalBoss}`);
  console.log(`  Archetypes: ${new Set(merged.map((d) => d.archetype)).size}`);
};

main().catch((error) => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});
