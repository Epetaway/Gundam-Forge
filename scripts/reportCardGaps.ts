/**
 * Card Data Gap Analysis Report
 * 
 * Audits the current card catalog and reports:
 * - Missing required fields
 * - Missing image assets
 * - Untagged mechanics in card text
 * - Zone legality issues
 * - Series/era coverage
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CardDefinition } from '../packages/shared/src/types';

const CATALOG_PATH = path.join(__dirname, '../apps/web/lib/data/cards.catalog.json');
const IMAGE_DIR = path.join(__dirname, '../apps/web/public/card_art');

interface GapReport {
  totalCards: number;
  missingFields: {
    id: string[];
    name: string[];
    color: string[];
    type: string[];
    imageUrl: string[];
    text: string[];
  };
  missingImages: string[];
  zoneIssues: {
    cardId: string;
    type: string;
    issue: string;
  }[];
  untaggedMechanics: {
    cardId: string;
    name: string;
    detectedKeywords: string[];
    text: string;
  }[];
  seriesCoverage: {
    cardsWithTraits: number;
    uniqueSeries: string[];
    cardsWithoutSeries: number;
  };
  fieldCoverage: {
    field: string;
    present: number;
    percentage: number;
  }[];
}

// Keyword patterns to detect in card text
const KEYWORD_PATTERNS = {
  repair: /\bRepair\s+\d+\b/gi,
  breach: /\bBreach\b/gi,
  support: /\bSupport\s+\d+\b/gi,
  blocker: /\bBlocker\b/gi,
  first_strike: /\bFirst Strike\b/gi,
  high_maneuver: /\bHigh-Maneuver\b/gi,
  suppression: /\bSuppression\b/gi,
  burst: /\bBurst\b/gi,
  deploy: /\bDeploy\b/gi,
  attack_trigger: /\bAttack\b.*\b(Draw|Search|Look|Get|Choose)/gi,
  destroyed: /\b(When|If)\s+(this|.*)\s+(is\s+)?destroyed\b/gi,
  activate_main: /\bActivate:Main\b/gi,
  activate_action: /\bActivate:Action\b/gi,
  when_paired: /\b(When Paired|【When Paired)/gi,
  during_pair: /\b(During Pair|【During Pair)/gi,
  when_linked: /\b(When Linked|【When Linked)/gi,
  during_link: /\b(During Link|【During Link)/gi,
  limited: /\b(Limited|once per turn)\b/gi,
};

function loadCards(): CardDefinition[] {
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function detectKeywords(text: string): string[] {
  if (!text) return [];
  
  const found: string[] = [];
  for (const [keyword, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(keyword);
    }
  }
  return found;
}

function extractSeriesFromTraits(traits: string[]): string | null {
  if (!traits || traits.length === 0) return null;
  
  // Common series patterns
  const seriesPatterns = [
    'Mobile Suit Gundam',
    'Gundam Wing',
    'Gundam 00',
    'Gundam SEED',
    'Gundam Unicorn',
    'Gundam IBO',
    'Gundam Hathaway',
    'Gundam UC',
    'Turn A Gundam',
    'Gundam AGE',
    'Gundam X',
    'Gundam ZZ',
    'Gundam 0083',
    'Gundam 0080',
    'Gundam Thunderbolt',
  ];
  
  for (const trait of traits) {
    for (const series of seriesPatterns) {
      if (trait.includes(series)) {
        return series;
      }
    }
  }
  
  return null;
}

function isExCard(card: CardDefinition): boolean {
  const name = card.name?.toLowerCase() || '';
  const type = card.type?.toLowerCase() || '';
  const traits = (card as any).traits || [];
  
  return (
    name.includes('ex base') ||
    name.includes('ex resource') ||
    type === 'base' ||
    traits.includes('EX')
  );
}

function generateReport(): GapReport {
  const cards = loadCards();
  
  const report: GapReport = {
    totalCards: cards.length,
    missingFields: {
      id: [],
      name: [],
      color: [],
      type: [],
      imageUrl: [],
      text: [],
    },
    missingImages: [],
    zoneIssues: [],
    untaggedMechanics: [],
    seriesCoverage: {
      cardsWithTraits: 0,
      uniqueSeries: [],
      cardsWithoutSeries: 0,
    },
    fieldCoverage: [],
  };
  
  const seriesSet = new Set<string>();
  let cardsWithKeywords = 0;
  let cardsWithTriggers = 0;
  let cardsWithText = 0;
  
  for (const card of cards) {
    // Check required fields
    if (!card.id) report.missingFields.id.push('unknown');
    if (!card.name) report.missingFields.name.push(card.id);
    if (!card.color) report.missingFields.color.push(card.id);
    if (!card.type) report.missingFields.type.push(card.id);
    if (!card.imageUrl) report.missingFields.imageUrl.push(card.id);
    
    // Check image files
    if (card.imageUrl) {
      const imagePath = card.imageUrl.replace('/card_art/', '');
      const fullPath = path.join(IMAGE_DIR, imagePath);
      if (!fs.existsSync(fullPath)) {
        report.missingImages.push(card.id);
      }
    }
    
    // Check zone issues
    if (!card.type) {
      report.zoneIssues.push({
        cardId: card.id,
        type: card.type || 'unknown',
        issue: 'Missing type - cannot determine zone legality',
      });
    }
    
    // Detect untagged mechanics
    const cardAny = card as any;
    const text = card.text || '';
    if (text) {
      cardsWithText++;
      const detectedKeywords = detectKeywords(text);
      const existingKeywords = cardAny.keywords || [];
      const existingTriggers = cardAny.triggers || [];
      
      if (existingKeywords.length > 0) cardsWithKeywords++;
      if (existingTriggers.length > 0) cardsWithTriggers++;
      
      if (detectedKeywords.length > 0 && existingKeywords.length === 0 && existingTriggers.length === 0) {
        report.untaggedMechanics.push({
          cardId: card.id,
          name: card.name,
          detectedKeywords,
          text: text.substring(0, 100),
        });
      }
    }
    
    // Check series coverage
    const traits = cardAny.traits || [];
    if (traits.length > 0) {
      report.seriesCoverage.cardsWithTraits++;
      const series = extractSeriesFromTraits(traits);
      if (series) {
        seriesSet.add(series);
      } else {
        report.seriesCoverage.cardsWithoutSeries++;
      }
    } else {
      report.seriesCoverage.cardsWithoutSeries++;
    }
  }
  
  report.seriesCoverage.uniqueSeries = Array.from(seriesSet).sort();
  
  // Field coverage statistics
  report.fieldCoverage = [
    {
      field: 'id',
      present: cards.length - report.missingFields.id.length,
      percentage: ((cards.length - report.missingFields.id.length) / cards.length) * 100,
    },
    {
      field: 'name',
      present: cards.length - report.missingFields.name.length,
      percentage: ((cards.length - report.missingFields.name.length) / cards.length) * 100,
    },
    {
      field: 'color',
      present: cards.length - report.missingFields.color.length,
      percentage: ((cards.length - report.missingFields.color.length) / cards.length) * 100,
    },
    {
      field: 'type',
      present: cards.length - report.missingFields.type.length,
      percentage: ((cards.length - report.missingFields.type.length) / cards.length) * 100,
    },
    {
      field: 'imageUrl',
      present: cards.length - report.missingFields.imageUrl.length,
      percentage: ((cards.length - report.missingFields.imageUrl.length) / cards.length) * 100,
    },
    {
      field: 'text',
      present: cardsWithText,
      percentage: (cardsWithText / cards.length) * 100,
    },
    {
      field: 'keywords (tagged)',
      present: cardsWithKeywords,
      percentage: (cardsWithKeywords / cards.length) * 100,
    },
    {
      field: 'triggers (tagged)',
      present: cardsWithTriggers,
      percentage: (cardsWithTriggers / cards.length) * 100,
    },
  ];
  
  return report;
}

function printReport(report: GapReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('GUNDAM FORGE CARD DATA GAP ANALYSIS');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Total Cards: ${report.totalCards}\n`);
  
  // Field Coverage
  console.log('FIELD COVERAGE:');
  console.log('-'.repeat(80));
  for (const field of report.fieldCoverage) {
    const bar = '█'.repeat(Math.floor(field.percentage / 2));
    console.log(`${field.field.padEnd(25)} ${field.present.toString().padStart(4)} / ${report.totalCards} (${field.percentage.toFixed(1)}%) ${bar}`);
  }
  console.log('');
  
  // Missing Fields
  console.log('MISSING REQUIRED FIELDS:');
  console.log('-'.repeat(80));
  for (const [field, ids] of Object.entries(report.missingFields)) {
    if (ids.length > 0) {
      console.log(`${field}: ${ids.length} cards`);
      if (ids.length <= 10) {
        console.log(`  ${ids.join(', ')}`);
      } else {
        console.log(`  ${ids.slice(0, 10).join(', ')}... (${ids.length - 10} more)`);
      }
    }
  }
  console.log('');
  
  // Missing Images
  if (report.missingImages.length > 0) {
    console.log(`MISSING IMAGE FILES: ${report.missingImages.length} cards`);
    console.log('-'.repeat(80));
    if (report.missingImages.length <= 20) {
      console.log(report.missingImages.join(', '));
    } else {
      console.log(report.missingImages.slice(0, 20).join(', ') + `... (${report.missingImages.length - 20} more)`);
    }
    console.log('');
  }
  
  // Untagged Mechanics
  console.log(`UNTAGGED MECHANICS: ${report.untaggedMechanics.length} cards with detected keywords but no tags`);
  console.log('-'.repeat(80));
  if (report.untaggedMechanics.length > 0) {
    const sample = report.untaggedMechanics.slice(0, 10);
    for (const card of sample) {
      console.log(`${card.cardId} - ${card.name}`);
      console.log(`  Detected: ${card.detectedKeywords.join(', ')}`);
      console.log(`  Text: ${card.text}...`);
      console.log('');
    }
    if (report.untaggedMechanics.length > 10) {
      console.log(`... and ${report.untaggedMechanics.length - 10} more cards`);
    }
  }
  console.log('');
  
  // Series Coverage
  console.log('SERIES/ERA COVERAGE:');
  console.log('-'.repeat(80));
  console.log(`Cards with traits: ${report.seriesCoverage.cardsWithTraits}`);
  console.log(`Cards without identifiable series: ${report.seriesCoverage.cardsWithoutSeries}`);
  console.log(`Unique series detected: ${report.seriesCoverage.uniqueSeries.length}`);
  console.log(`\nSeries list:`);
  for (const series of report.seriesCoverage.uniqueSeries) {
    console.log(`  - ${series}`);
  }
  console.log('');
  
  // Zone Issues
  if (report.zoneIssues.length > 0) {
    console.log(`ZONE LEGALITY ISSUES: ${report.zoneIssues.length} cards`);
    console.log('-'.repeat(80));
    for (const issue of report.zoneIssues.slice(0, 10)) {
      console.log(`${issue.cardId} (${issue.type}): ${issue.issue}`);
    }
    if (report.zoneIssues.length > 10) {
      console.log(`... and ${report.zoneIssues.length - 10} more`);
    }
    console.log('');
  }
  
  // Summary
  console.log('SUMMARY OF REQUIRED ACTIONS:');
  console.log('-'.repeat(80));
  console.log(`✓ All cards have: id (${report.fieldCoverage[0].percentage.toFixed(1)}%), name (${report.fieldCoverage[1].percentage.toFixed(1)}%), imageUrl (${report.fieldCoverage[4].percentage.toFixed(1)}%)`);
  console.log(`⚠ Need to add: keywords/triggers tags to ${report.untaggedMechanics.length} cards with detected mechanics`);
  console.log(`⚠ Need to derive: series/era tags from traits for better filtering`);
  console.log(`⚠ Need to implement: zone legality flags (isMainDeck, isResource, isEx)`);
  console.log(`⚠ Need to add: normalizedName field for import matching`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Run scripts/enrichCards.ts to add missing metadata');
  console.log('2. Manually review untagged mechanics for accuracy');
  console.log('3. Add series mapping for trait-based filtering');
  console.log('4. Update API endpoints to use enriched data');
  console.log('');
}

// Run the report
try {
  const report = generateReport();
  printReport(report);
  
  // Write JSON output for CI
  const outputPath = path.join(__dirname, '../.gap-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Full report saved to: ${outputPath}\n`);
  
  // Exit with error if critical fields are missing
  const criticalMissing = 
    report.missingFields.id.length +
    report.missingFields.name.length +
    report.missingFields.color.length +
    report.missingFields.type.length;
    
  if (criticalMissing > 0) {
    console.error(`❌ FAILED: ${criticalMissing} cards missing critical fields`);
    process.exit(1);
  }
  
  console.log('✓ All critical fields present in all cards');
  process.exit(0);
} catch (error) {
  console.error('Error generating report:', error);
  process.exit(1);
}
