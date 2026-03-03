#!/usr/bin/env node

/**
 * Deck Card Count Audit
 * Validates all decks in seed-official-decks.sql have exactly 50 cards each
 */

const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'supabase', 'seed-official-decks.sql');
const content = fs.readFileSync(seedPath, 'utf-8');

// Split by deck sections (-- ─── deck-XXX:)
const sections = content.split(/-- ─── deck-\d+:/);

console.log('\n================================');
console.log('  DECK CARD COUNT AUDIT');
console.log('================================\n');

let totalValid = 0;
let totalInvalid = 0;
const issues = [];

for (let i = 1; i < sections.length; i++) {
  const section = sections[i];
  
  // Get deck name from the INSERT statement
  const nameMatch = section.match(/INSERT INTO public\.decks[^;]*VALUES\s*\([^,]+,\s*NULL,\s*'([^']+)'/);
  if (!nameMatch) continue;
  
  const deckName = nameMatch[1];
  
  // Extract card entries for this deck
  // Match: (v_deck_id, 'CARD-ID', qty, bool)
  const cardMatches = section.match(/\(v_deck_id,\s*'([^']+)',\s*(\d+),\s*(?:true|false)\)/g);
  
  if (!cardMatches) {
    console.log(`✗ ${deckName}`);
    console.log(`  Error: No cards found\n`);
    totalInvalid++;
    issues.push(`${deckName}: Could not parse cards`);
    continue;
  }
  
  // Sum up card quantities
  let totalCards = 0;
  const cardList = [];
  
  for (const match of cardMatches) {
    const parsed = match.match(/\(v_deck_id,\s*'([^']+)',\s*(\d+)/);
    if (parsed) {
      const cardId = parsed[1];
      const qty = parseInt(parsed[2], 10);
      cardList.push({ id: cardId, qty });
      totalCards += qty;
    }
  }
  
  // Validate
  const isValid = totalCards === 50;
  const status = isValid ? '✓' : '✗';
  
  console.log(`${status} ${deckName}`);
  console.log(`  Cards: ${totalCards}/50`);
  
  if (!isValid) {
    totalInvalid++;
    issues.push(`${deckName}: ${totalCards} cards (should be 50)`);
    
    // Show card breakdown
    console.log(`  Card breakdown:`);
    cardList.forEach(card => {
      console.log(`    ${card.id} ×${card.qty}`);
    });
  } else {
    totalValid++;
  }
  
  console.log();
}

// Summary
console.log('================================');
console.log(`Valid decks:   ${totalValid}`);
console.log(`Invalid decks: ${totalInvalid}`);
console.log('================================\n');

if (totalInvalid > 0) {
  console.log('⚠ ISSUES TO FIX:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue}`);
  });
  console.log('\nRun: npm run fix-deck-sizes\n');
  process.exit(1);
} else {
  console.log('✓ All decks correctly sized at 50 cards each!\n');
  process.exit(0);
}
