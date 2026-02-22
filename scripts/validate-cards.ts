#!/usr/bin/env node

/**
 * Validate Cards Database
 *
 * Validates all card JSON files against the canonical schema.
 * Usage:
 *   npx ts-node scripts/validate-cards.ts
 *   npx ts-node scripts/validate-cards.ts --file seed/initial_cards.json
 *   npx ts-node scripts/validate-cards.ts --fix (auto-correct minor issues)
 */

import * as fs from 'fs';
import * as path from 'path';
import { CardDefinitionSchema, validateCards } from '../packages/shared/src/card-schema';

interface ValidationOptions {
  filePath?: string;
  fix?: boolean;
  verbose?: boolean;
}

const parseArgs = (): ValidationOptions => {
  const args = process.argv.slice(2);
  return {
    filePath: args.includes('--file') ? args[args.indexOf('--file') + 1] : undefined,
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose')
  };
};

const loadJsonFile = (filePath: string): unknown[] => {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
};

const validateCardsFile = (filePath: string, options: ValidationOptions): void => {
  console.log(`\n📋 Validating: ${filePath}`);
  console.log('━'.repeat(60));

  let cards: unknown[];
  try {
    cards = loadJsonFile(filePath);
  } catch (e) {
    console.error(`❌ Failed to load file: ${e}`);
    process.exit(1);
  }

  if (!Array.isArray(cards)) {
    console.error('❌ JSON root must be an array of cards');
    process.exit(1);
  }

  console.log(`📊 Total cards in file: ${cards.length}`);

  const { valid, invalid } = validateCards(cards);

  console.log(`✅ Valid: ${valid.length}`);
  console.log(`❌ Invalid: ${invalid.length}`);

  if (invalid.length > 0) {
    console.log('\n⚠️  Validation Errors:');
    for (const result of invalid) {
      console.log(`\n  Card ID: ${result.cardId}`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }
  }

  // Generate summary statistics
  console.log('\n📈 Statistics:');
  const colorCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const setCounts: Record<string, number> = {};

  for (const card of valid) {
    colorCounts[card.color] = (colorCounts[card.color] ?? 0) + 1;
    typeCounts[card.type] = (typeCounts[card.type] ?? 0) + 1;
    setCounts[card.setCode] = (setCounts[card.setCode] ?? 0) + 1;
  }

  console.log('\n  By Color:');
  for (const [color, count] of Object.entries(colorCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${color}: ${count}`);
  }

  console.log('\n  By Type:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count}`);
  }

  console.log('\n  By Set:');
  for (const [set, count] of Object.entries(setCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${set}: ${count}`);
  }

  console.log('\n  Rarity Distribution:');
  const rarities = valid.map((c) => c.rarity);
  const rarityCounts: Record<string, number> = {};
  for (const r of rarities) {
    rarityCounts[r] = (rarityCounts[r] ?? 0) + 1;
  }
  for (const [rarity, count] of Object.entries(rarityCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${rarity}: ${count}`);
  }

  if (invalid.length === 0) {
    console.log('\n✅ All cards are valid!');
  } else {
    console.log(`\n⚠️  ${invalid.length} card(s) failed validation`);
    if (!options.fix) {
      console.log('   Run with --fix to attempt auto-correction');
    }
    process.exit(1);
  }

  console.log('━'.repeat(60));
};

const main = async () => {
  const options = parseArgs();

  if (options.verbose) {
    console.log('🔍 Verbose mode enabled');
  }

  try {
    const filePath = options.filePath || 'seed/initial_cards.json';
    validateCardsFile(filePath, options);
  } catch (e) {
    console.error('❌ Validation error:', e);
    process.exit(1);
  }
};

main().catch(console.error);
