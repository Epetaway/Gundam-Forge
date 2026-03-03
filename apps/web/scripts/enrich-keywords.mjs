/**
 * enrich-keywords.mjs
 *
 * Parses card text to populate the `keywords`, `triggers`, and `pairQualifiers`
 * fields in cards.json. Run whenever card data changes:
 *
 *   node apps/web/scripts/enrich-keywords.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = join(__dirname, '../lib/data/cards.json');

// ── Keyword extraction ────────────────────────────────────────────────────────
// Angle-bracket keywords: <Keyword> or <Keyword N>
// Only count as DECLARED if NOT preceded by conditional verbs (gains/has/gets/etc.)
const SKIP_BEFORE = new Set(['gains', 'gain', 'has', 'gets', 'get', 'grant', 'grants', 'with', 'without', 'having', 'receive', 'receives']);

function extractKeywords(text) {
  if (!text) return [];
  const found = [];
  const regex = /<([A-Za-z][A-Za-z\-]*(?:\s+\d+)?)>/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const before = text.slice(0, m.index).trimEnd();
    const lastWord = before.split(/[\s(]/).pop()?.toLowerCase() ?? '';
    if (SKIP_BEFORE.has(lastWord)) continue;

    const raw = m[1].trim();
    const kw = normalizeKeyword(raw);
    if (kw && !found.includes(kw)) found.push(kw);
  }
  return found;
}

function normalizeKeyword(raw) {
  const lower = raw.toLowerCase();
  // Bare (no value) → treat as value 1
  if (lower === 'repair') return 'repair 1';
  if (lower === 'support') return 'support 1';
  if (lower === 'breach') return 'breach 1';
  // Known keywords
  const BASE_KEYWORDS = ['blocker', 'high-maneuver', 'first-strike', 'suppression', 'rush'];
  if (BASE_KEYWORDS.includes(lower)) return lower;
  // Keywords with numeric value: "repair 1", "support 3", "breach 4"
  const withVal = /^(repair|support|breach)\s+(\d+)$/.exec(lower);
  if (withVal) return `${withVal[1]} ${withVal[2]}`;
  return null; // ignore unknown / parenthetical text
}

// ── Trigger extraction ────────────────────────────────────────────────────────
// Full-width bracket triggers: 【Trigger】 or 【Trigger･Qualifier】
const TRIGGER_MAP = {
  'burst': 'burst',
  'when paired': 'when-paired',
  'during pair': 'during-pair',
  'when linked': 'when-linked',
  'during link': 'during-link',
  'deploy': 'deploy',
  'destroyed': 'destroyed',
  'attack': 'attack',
  'activate': 'activate',
  'action': 'action',
  'pilot': 'pilot',
  'main': 'main',
};

function extractTriggers(text) {
  if (!text) return [];
  const found = [];
  const regex = /【([^】]+)】/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1].trim();
    // Base = part before ･
    const base = raw.split('･')[0].trim().toLowerCase();
    const mapped = TRIGGER_MAP[base];
    if (mapped && !found.includes(mapped)) found.push(mapped);
  }
  return found;
}

// ── Pair qualifier extraction ─────────────────────────────────────────────────
// From 【When Paired･(ZAFT) Pilot】 → "(ZAFT)"
// From 【During Pair･Red Pilot】 → "Red"
// From 【When Paired･Lv.4 or Higher Pilot】 → "Lv.4+"
// From 【When Paired】 (no qualifier) → nothing added
function extractPairQualifiers(text) {
  if (!text) return [];
  const found = [];
  const regex = /【(?:When Paired|During Pair)･([^】]+)】/g;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[1].trim();
    // Remove trailing " Pilot" or " Unit"
    const cleaned = raw.replace(/\s+(Pilot|Unit)$/i, '').trim();
    const qual = normalizeQualifier(cleaned);
    if (qual && !found.includes(qual)) found.push(qual);
  }
  return found;
}

function normalizeQualifier(raw) {
  if (!raw) return null;
  // Level qualifier: "Lv.3 or Lower" → "Lv.3-", "Lv.4 or Higher" → "Lv.4+"
  const lvMatch = /Lv\.(\d+)\s+or\s+(Higher|Lower)/i.exec(raw);
  if (lvMatch) return `Lv.${lvMatch[1]}${lvMatch[2].toLowerCase() === 'higher' ? '+' : '-'}`;
  // Color qualifier: "Red", "Blue", etc.
  const COLORS = ['Red', 'Blue', 'Green', 'White', 'Purple', 'Colorless'];
  if (COLORS.includes(raw)) return raw;
  // Clan/trait in parentheses: "(ZAFT)" "(Coordinator)" "(Cyber-Newtype)/(Newtype)"
  if (raw.startsWith('(')) return raw;
  return raw; // keep as-is for anything else
}

// ── Main enrichment ───────────────────────────────────────────────────────────
const cards = JSON.parse(readFileSync(CARDS_PATH, 'utf-8'));

let changed = 0;
const enriched = cards.map((card) => {
  const keywords = extractKeywords(card.text);
  const triggers = extractTriggers(card.text);
  const pairQualifiers = extractPairQualifiers(card.text);

  const prev = JSON.stringify({ keywords: card.keywords, triggers: card.triggers, pairQualifiers: card.pairQualifiers });
  const next = JSON.stringify({
    keywords: keywords.length ? keywords : undefined,
    triggers: triggers.length ? triggers : undefined,
    pairQualifiers: pairQualifiers.length ? pairQualifiers : undefined,
  });

  if (prev !== next) changed++;

  const out = { ...card };
  // Set or clear fields
  if (keywords.length) out.keywords = keywords; else delete out.keywords;
  if (triggers.length) out.triggers = triggers; else delete out.triggers;
  if (pairQualifiers.length) out.pairQualifiers = pairQualifiers; else delete out.pairQualifiers;
  return out;
});

writeFileSync(CARDS_PATH, JSON.stringify(enriched, null, 2) + '\n');

// ── Stats ─────────────────────────────────────────────────────────────────────
const withKeywords = enriched.filter((c) => c.keywords?.length).length;
const withTriggers = enriched.filter((c) => c.triggers?.length).length;
const withPairQual = enriched.filter((c) => c.pairQualifiers?.length).length;
const keywordCounts = {};
const triggerCounts = {};
enriched.forEach((c) => {
  c.keywords?.forEach((k) => { keywordCounts[k] = (keywordCounts[k] ?? 0) + 1; });
  c.triggers?.forEach((t) => { triggerCounts[t] = (triggerCounts[t] ?? 0) + 1; });
});

console.log(`✓ Enriched ${changed} cards (${enriched.length} total)`);
console.log(`  ${withKeywords} cards with keywords, ${withTriggers} with triggers, ${withPairQual} with pairQualifiers`);
console.log('\nKeyword distribution:');
Object.entries(keywordCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
console.log('\nTrigger distribution:');
Object.entries(triggerCounts).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
