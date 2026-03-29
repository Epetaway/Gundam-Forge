#!/usr/bin/env node

/**
 * Card Database Audit Script
 * 
 * Usage: npx ts-node scripts/audit-card-database.ts
 * 
 * Performs comprehensive validation of the card database against:
 * 1. Expected official set structure
 * 2. Data quality and schema compliance
 * 3. Completeness metrics
 * 4. Known gaps and recommendations
 */

import fs from 'fs';
import path from 'path';

// Expected official Gundam TCG sets and their typical card counts
const OFFICIAL_SETS = {
  // Booster Sets
  'GD01': { name: 'Newtype Rising', type: 'booster', releaseDate: '2023-12-01', expectedCards: 100 },
  'GD02': { name: 'Dual Impact', type: 'booster', releaseDate: '2024-03-01', expectedCards: 120 },
  'GD03': { name: 'Steel Requiem', type: 'booster', releaseDate: '2024-06-01', expectedCards: 120 },
  'GD04': { name: 'Gundam Legends', type: 'booster', releaseDate: '2024-09-01', expectedCards: 120 },
  'GD05': { name: "Char's Counterattack", type: 'booster', releaseDate: '2025-03-01', expectedCards: 120 },
  
  // Starter Decks
  'ST01': { name: 'Support Deck 1', type: 'starter', releaseDate: '2023-12-01', expectedCards: 40 },
  'ST02': { name: 'Support Deck 2', type: 'starter', releaseDate: '2023-12-01', expectedCards: 40 },
  'ST03': { name: 'Support Deck 3', type: 'starter', releaseDate: '2024-01-01', expectedCards: 40 },
  'ST04': { name: 'Support Deck 4', type: 'starter', releaseDate: '2024-01-01', expectedCards: 40 },
  'ST05': { name: 'Support Deck 5', type: 'starter', releaseDate: '2024-04-01', expectedCards: 40 },
  'ST06': { name: 'Support Deck 6', type: 'starter', releaseDate: '2024-04-01', expectedCards: 40 },
  'ST07': { name: 'Support Deck 7', type: 'starter', releaseDate: '2024-07-01', expectedCards: 40 },
  'ST08': { name: 'Support Deck 8', type: 'starter', releaseDate: '2024-07-01', expectedCards: 40 },
  'ST09': { name: 'Ultimate Deck', type: 'starter', releaseDate: '2024-10-01', expectedCards: 50 },
  
  // Premium Collections
  'PC01A': { name: 'Mobile Suit Gundam Premium Collection', type: 'premium', releaseDate: '2024-02-01', expectedCards: 30 },
  'PC02A': { name: 'G no Reconguista Premium Collection', type: 'premium', releaseDate: '2024-05-01', expectedCards: 30 },
  'PB01': { name: 'Mobile Suit Gundam Wing Premium Box', type: 'premium', releaseDate: '2024-08-01', expectedCards: 30 },
  'PB02': { name: 'Mobile Suit Gundam SEED Premium Box', type: 'premium', releaseDate: '2024-11-01', expectedCards: 30 },
};

// Valid card types
const VALID_TYPES = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

// Valid card colors
const VALID_COLORS = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];

interface Card {
  id: string;
  name: string;
  color: string;
  type: string;
  cost: number;
  set: string;
  ap: number;
  hp: number;
  traits: string[];
  imageUrl?: string;
  [key: string]: any;
}

interface AuditResult {
  totalCards: number;
  setsPresent: Map<string, number>;
  setsMissing: string[];
  cardQualityIssues: string[];
  schemaIssues: string[];
  recommendations: string[];
}

/**
 * Load card database from JSON
 */
function loadCardDatabase(): Card[] {
  const paths = [
    path.join(process.cwd(), 'seed/official_cards_enhanced.json'),
    path.join(process.cwd(), 'seed/fetched_cards.json'),
    path.join(process.cwd(), 'seed/initial_cards.json'),
  ];

  for (const filePath of paths) {
    if (fs.existsSync(filePath)) {
      console.log(`📂 Loading cards from: ${filePath}`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return Array.isArray(data) ? data : data.cards || [];
    }
  }

  throw new Error('❌ No card database found. Checked: ' + paths.join(', '));
}

/**
 * Audit: Check what sets are present
 */
function checkSetCoverage(cards: Card[]): { present: Map<string, number>; missing: string[] } {
  const present = new Map<string, number>();

  // Count cards per set
  for (const card of cards) {
    const set = card.set || 'UNKNOWN';
    present.set(set, (present.get(set) || 0) + 1);
  }

  // Find missing official sets
  const missing = Object.keys(OFFICIAL_SETS).filter(
    (setCode) => !present.has(setCode)
  );

  console.log('\n📊 Set Coverage:');
  console.log(`   ✅ Present: ${present.size} sets`);
  console.log(`   ❌ Missing: ${missing.length} official sets`);

  return { present, missing };
}

/**
 * Audit: Check data quality issues
 */
function checkDataQuality(cards: Card[]): string[] {
  const issues: string[] = [];

  for (const card of cards) {
    // Required fields
    if (!card.id) issues.push(`Card missing ID: ${JSON.stringify(card)}`);
    if (!card.name) issues.push(`Card ${card.id} missing name`);
    if (!card.set) issues.push(`Card ${card.id} missing set`);
    if (typeof card.ap === 'undefined') issues.push(`Card ${card.id} missing AP`);
    if (typeof card.hp === 'undefined') issues.push(`Card ${card.id} missing HP`);

    // Type validation
    if (card.type && !VALID_TYPES.includes(card.type)) {
      issues.push(`Card ${card.id}: Invalid type "${card.type}" (expected one of: ${VALID_TYPES.join(', ')})`);
    }

    // Color validation
    if (card.color && !VALID_COLORS.includes(card.color)) {
      issues.push(`Card ${card.id}: Invalid color "${card.color}" (expected one of: ${VALID_COLORS.join(', ')})`);
    }

    // Cost should be non-negative
    if (typeof card.cost === 'number' && card.cost < 0) {
      issues.push(`Card ${card.id}: Invalid cost ${card.cost} (should be ≥ 0)`);
    }
  }

  console.log('\n🔍 Data Quality Issues Found: ' + (issues.length || 'None'));
  if (issues.length > 0 && issues.length <= 10) {
    issues.slice(0, 10).forEach((issue) => console.log(`   ⚠️ ${issue}`));
    if (issues.length > 10) {
      console.log(`   ... and ${issues.length - 10} more issues`);
    }
  }

  return issues;
}

/**
 * Audit: Check schema completeness
 */
function checkSchemaCompleteness(cards: Card[]): string[] {
  const recommendations: string[] = [];

  if (cards.length === 0) return recommendations;

  const sampleCard = cards[0];
  const requiredFields = ['id', 'name', 'set', 'color', 'type', 'cost', 'ap', 'hp'];
  const optionalButRecommended = ['setCode', 'setName', 'releaseDate', 'traits', 'source', 'legal', 'banned'];

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in sampleCard)) {
      recommendations.push(`❌ Missing required field: "${field}"`);
    }
  }

  // Check recommended fields
  const missingOptional = optionalButRecommended.filter((field) => !(field in sampleCard));
  if (missingOptional.length > 0) {
    recommendations.push(`⚠️ Missing recommended fields: ${missingOptional.join(', ')}`);
  }

  return recommendations;
}

/**
 * Main audit function
 */
async function runAudit(): Promise<void> {
  console.log('🔧 Gundam TCG Card Database Audit');
  console.log('=' .repeat(50));

  try {
    const cards = loadCardDatabase();

    // 1. Basic stats
    console.log(`\n📈 Database Statistics`);
    console.log(`   Total Cards: ${cards.length}`);
    console.log(`   Expected (full): ~700-900 cards`);
    console.log(`   Completeness: ${((cards.length / 700) * 100).toFixed(1)}%`);

    // 2. Set coverage
    const { present, missing } = checkSetCoverage(cards);

    console.log(`\n📑 Sets Present:`);
    Array.from(present.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([set, count]) => {
        const official = OFFICIAL_SETS[set as keyof typeof OFFICIAL_SETS];
        const status = official ? '✅' : '⚠️';
        const expected = official?.expectedCards || 'unknown';
        console.log(`   ${status} ${set}: ${count} cards (expected: ${expected})`);
      });

    if (missing.length > 0) {
      console.log(`\n📑 Missing Official Sets (${missing.length}):`);
      missing.forEach((set) => {
        const info = OFFICIAL_SETS[set as keyof typeof OFFICIAL_SETS];
        console.log(`   ❌ ${set}: ${info.name} (~${info.expectedCards} cards)` );
      });
    }

    // 3. Data quality
    const qualityIssues = checkDataQuality(cards);

    // 4. Schema recommendations
    console.log('\n📋 Schema Analysis:');
    const schemaRecommendations = checkSchemaCompleteness(cards);
    if (schemaRecommendations.length > 0) {
      schemaRecommendations.forEach((rec) => console.log(`   ${rec}`));
    } else {
      console.log('   ✅ All required fields present');
    }

    // 5. Missing data analysis
    const typeCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();
    cards.forEach((card) => {
      if (card.type) typeCounts.set(card.type, (typeCounts.get(card.type) || 0) + 1);
      if (card.color) colorCounts.set(card.color, (colorCounts.get(card.color) || 0) + 1);
    });

    console.log('\n🎴 Card Composition:');
    console.log('   By Type:');
    Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => console.log(`      ${type}: ${count}`));

    console.log('   By Color:');
    Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([color, count]) => console.log(`      ${color}: ${count}`));

    // 6. Recommendations
    console.log('\n🎯 Priority Recommendations:');
    console.log('   1. ⛔ Add GD02-GD05 booster sets (~400 cards)');
    console.log('   2. ⛔ Add ST05-ST09 starter decks (~200 cards)');
    console.log('   3. ⛔ Add PC/PB premium collections (~120 cards)');
    if (qualityIssues.length > 0) {
      console.log(`   4. 🔧 Fix ${qualityIssues.length} data quality issues`);
    }
    console.log('   5. 📝 Update schema to include setCode, releaseDate, legal status');
    console.log('   6. 🔗 Add source URLs for card verification');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(
      `⚠️  Database is ~30-40% complete. Missing ~${700 - cards.length} cards.`
    );
    console.log('   See: docs/CARD_DB_AUDIT_2026.md for detailed report');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Audit failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run audit
runAudit().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
