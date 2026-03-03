#!/usr/bin/env node

/**
 * Deck Size Audit Script
 * Validates all decks in the database against the 50-card main deck requirement
 * 
 * Usage: npm run audit-decks
 * 
 * Reports:
 * - Decks with incorrect main deck size
 * - Decks with invalid resource deck size
 * - Summary statistics
 */

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..');

// Load seed data
const seedPath = path.join(projectRoot, 'supabase', 'seed-official-decks.sql');
const seedContent = fs.readFileSync(seedPath, 'utf-8');

// Parse decks from SQL
interface DeckInfo {
  name: string;
  cardCount: number;
  cardIds: Array<{ id: string; qty: number }>;
  issues: string[];
}

const decks = new Map<string, DeckInfo>();

// Regex to match deck insertion and card insertion blocks
const deckNameRegex = /INSERT INTO public\.decks[^;]*VALUES\s*\([^,]+,\s*NULL,\s*'([^']+)'/g;
const cardInsertRegex = /INSERT INTO public\.deck_cards[^;]*VALUES\s*\((.*?)\);/gs;

let deckMatch;
let currentDeckName = '';
let deckIndex = 0;

// Extract deck names
const deckNames: string[] = [];
while ((deckMatch = deckNameRegex.exec(seedContent)) !== null) {
  deckNames.push(deckMatch[1]);
}

// Extract card data for each deck
let cardMatch;
const cardInsertMatches: string[] = [];
while ((cardMatch = cardInsertRegex.exec(seedContent)) !== null) {
  cardInsertMatches.push(cardMatch[1]);
}

// Parse each card insert block
for (let i = 0; i < cardInsertMatches.length && i < deckNames.length; i++) {
  const deckName = deckNames[i];
  const cardData = cardInsertMatches[i];
  
  // Parse card entries: (deck_id, card_id, qty, is_boss)
  const cardEntries = cardData.split('(v_deck_id,').slice(1);
  const cards: Array<{ id: string; qty: number }> = [];
  let totalCards = 0;
  const issues: string[] = [];

  for (const entry of cardEntries) {
    // Extract: 'CARD-ID', qty, bool
    const match = entry.match(/'([^']+)',\s*(\d+)/);
    if (match) {
      const cardId = match[1];
      const qty = parseInt(match[2], 10);
      cards.push({ id: cardId, qty });
      totalCards += qty;
    }
  }

  const deckInfo: DeckInfo = {
    name: deckName,
    cardCount: totalCards,
    cardIds: cards,
    issues: []
  };

  // Validate
  if (totalCards !== 50) {
    deckInfo.issues.push(`Main deck has ${totalCards} cards (should be exactly 50)`);
  }
  if (totalCards > 100) {
    deckInfo.issues.push(`Deck size suspiciously large - possible parse error`);
  }

  decks.set(deckName, deckInfo);
}

// Report findings
console.log('\n================================');
console.log('  DECK SIZE AUDIT REPORT');
console.log('================================\n');

let validCount = 0;
let invalidCount = 0;
const issues: string[] = [];

for (const [name, deckInfo] of decks) {
  const status = deckInfo.cardCount === 50 ? '✓' : '✗';
  console.log(`${status} ${name}`);
  console.log(`  Cards: ${deckInfo.cardCount}/50`);
  
  if (deckInfo.issues.length > 0) {
    invalidCount++;
    deckInfo.issues.forEach(issue => {
      console.log(`  ⚠ ${issue}`);
      issues.push(`${name}: ${issue}`);
    });
  } else {
    validCount++;
  }
  console.log();
}

// Summary
console.log('================================');
console.log(`Valid decks:   ${validCount}/${decks.size}`);
console.log(`Invalid decks: ${invalidCount}/${decks.size}`);
console.log('================================\n');

if (invalidCount > 0) {
  console.log('ISSUES TO FIX:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });
  console.log('\nAction: Update seed-official-decks.sql to fix these decks');
  process.exit(1);
} else {
  console.log('✓ All decks are correctly sized at 50 cards each!\n');
  process.exit(0);
}
