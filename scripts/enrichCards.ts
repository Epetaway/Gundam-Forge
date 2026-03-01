/**
 * Card Data Enrichment Pipeline
 * 
 * Normalizes and enriches card data with:
 * - normalizedName for reliable matching
 * - keywords array extracted from card text
 * - triggers array extracted from card text
 * - series tags derived from traits
 * - zone legality flags (isMainDeck, isResource, isExCard)
 * - imageUrl validation
 * 
 * Output: enriched cards.catalog.json with additional metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CardDefinition } from '../packages/shared/src/types';

const CATALOG_PATH = path.join(__dirname, '../apps/web/lib/data/cards.catalog.json');
const OUTPUT_PATH = path.join(__dirname, '../apps/web/lib/data/cards.catalog.json');
const BACKUP_PATH = path.join(__dirname, '../apps/web/lib/data/cards.catalog.backup.json');

// Extended card type with enrichment fields
interface EnrichedCard extends CardDefinition {
  normalizedName: string;
  keywords?: string[];
  triggers?: string[];
  clans?: string[];
  isMainDeck?: boolean;
  isResource?: boolean;
  isExCard?: boolean;
}

// Keyword detection patterns
const KEYWORD_PATTERNS: Record<string, RegExp> = {
  repair: /\bRepair\s+\d+\b/gi,
  breach: /\bBreach\b/gi,
  support: /\bSupport\s+\d+\b/gi,
  blocker: /\bBlocker\b/gi,
  first_strike: /\bFirst Strike\b/gi,
  high_maneuver: /\bHigh-Maneuver\b/gi,
  suppression: /\bSuppression\b/gi,
};

// Trigger detection patterns
const TRIGGER_PATTERNS: Record<string, RegExp> = {
  burst: /\bBurst\b/gi,
  deploy: /\bDeploy\b/gi,
  attack_trigger: /【Attack】/gi,
  destroyed: /\b(When|If)\s+(this|.*)\s+(is\s+)?destroyed\b/gi,
  activate_main: /\bActivate:Main\b/gi,
  activate_action: /\bActivate:Action\b/gi,
  when_paired: /【When Paired/gi,
  during_pair: /【During Pair/gi,
  when_linked: /【When Linked/gi,
  during_link: /【During Link/gi,
  limited: /\b(Limited|once per turn)\b/gi,
};

// Clan/Faction extraction from traits
// These are the parenthesized faction names in card traits
const PRIMARY_CLANS = [
  'Earth Federation',
  'Zeon',
  'Neo Zeon',
  'AEUG',
  'Titans',
  'CB', // Celestial Being (Gundam 00)
  'Gjallarhorn', // IBO
  'Tekkadan', // IBO
  'Earth Alliance', // SEED
  'ZAFT', // SEED
  'Orb', // SEED
  'OZ', // Wing
  'Operation Meteor', // Wing
  'Mafty', // Hathaway
  'G Team', // G Gundam
  'Civilian',
  'Vagan', // AGE
  'UE', // AGE
  'Academy', // Witch from Mercury
  'Vanadis Institute', // Witch from Mercury
  'New UNE', // After War X
  'Old UNE', // After War X
  'Vulture', // After War X
  'SRA', // After War X
  'Triple Ship Alliance',
  'Teiwaz', // IBO
  'Maganac Corps', // Wing
  'Superpower Bloc', // 00
  'Side 6',
  'Clan',
];

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Collapse whitespace
    .trim();
}

function detectKeywords(text: string): string[] {
  if (!text) return [];
  
  const found: string[] = [];
  for (const [keyword, pattern] of Object.entries(KEYWORD_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(keyword);
    }
  }
  return Array.from(new Set(found)); // Deduplicate
}

function detectTriggers(text: string): string[] {
  if (!text) return [];
  
  const found: string[] = [];
  for (const [trigger, pattern] of Object.entries(TRIGGER_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(trigger);
    }
  }
  return Array.from(new Set(found)); // Deduplicate
}

function extractClans(traits: string[]): string[] {
  if (!traits || traits.length === 0) return [];
  
  const clansFound = new Set<string>();
  
  // Extract clans from parenthesized faction names in traits
  for (const trait of traits) {
    // Match parenthesized content like "(Earth Federation)" or "(CB)"
    const matches = trait.match(/\(([^)]+)\)/g);
    if (matches) {
      for (const match of matches) {
        // Remove parentheses
        const clanName = match.replace(/[()]/g, '').trim();
        
        // Check if this is a primary clan (not a subtype like "Newtype", "Warship", etc.)
        if (PRIMARY_CLANS.includes(clanName)) {
          clansFound.add(clanName);
        }
      }
    }
  }
  
  return Array.from(clansFound);
}

function determineZoneLegality(card: any): { isMainDeck: boolean; isResource: boolean; isExCard: boolean } {
  const name = card.name?.toLowerCase() || '';
  const type = card.type?.toLowerCase() || '';
  const traits = card.traits || [];
  
  // EX cards
  const isExCard = (
    name.includes('ex base') ||
    name.includes('ex resource') ||
    traits.includes('EX') ||
    card.id?.startsWith('EXB') ||
    card.id?.startsWith('EXBP') ||
    card.id?.startsWith('EXR')
  );
  
  // Resource cards (can go in resource zone)
  const isResource = (
    type === 'resource' ||
    type === 'command' ||
    isExCard
  );
  
  // Main deck cards (units, pilots, commands)
  const isMainDeck = (
    (type === 'unit' || type === 'pilot' || type === 'command') &&
    !isExCard
  );
  
  return { isMainDeck, isResource, isExCard };
}

function enrichCard(card: CardDefinition): EnrichedCard {
  const cardAny = card as any;
  
  // Generate normalized name
  const normalizedName = normalizeName(card.name);
  
  // Extract keywords from text
  const keywords = detectKeywords(card.text || '');
  
  // Extract triggers from text
  const triggers = detectTriggers(card.text || '');
  
  // Extract clans from traits
  const traits = cardAny.traits || [];
  const clans = extractClans(traits);
  
  // Determine zone legality
  const { isMainDeck, isResource, isExCard } = determineZoneLegality(cardAny);
  
  return {
    ...card,
    normalizedName,
    keywords: keywords.length > 0 ? keywords : undefined,
    triggers: triggers.length > 0 ? triggers : undefined,
    clans: clans.length > 0 ? clans : undefined,
    isMainDeck,
    isResource,
    isExCard,
  };
}

function enrichDatabase(): void {
  console.log('Loading cards from catalog...');
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  const cards: CardDefinition[] = JSON.parse(raw);
  
  console.log(`Processing ${cards.length} cards...`);
  
  // Create backup
  fs.writeFileSync(BACKUP_PATH, raw);
  console.log(`Backup created at: ${BACKUP_PATH}`);
  
  // Enrich all cards
  const enrichedCards = cards.map(enrichCard);
  
  // Calculate statistics
  const stats = {
    total: enrichedCards.length,
    withKeywords: enrichedCards.filter(c => c.keywords && c.keywords.length > 0).length,
    withTriggers: enrichedCards.filter(c => c.triggers && c.triggers.length > 0).length,
    withClans: enrichedCards.filter(c => c.clans && c.clans.length > 0).length,
    mainDeckCards: enrichedCards.filter(c => c.isMainDeck).length,
    resourceCards: enrichedCards.filter(c => c.isResource).length,
    exCards: enrichedCards.filter(c => c.isExCard).length,
  };
  
  console.log('\nEnrichment Statistics:');
  console.log('='.repeat(80));
  console.log(`Total cards:           ${stats.total}`);
  console.log(`With keywords:         ${stats.withKeywords} (${((stats.withKeywords / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With triggers:         ${stats.withTriggers} (${((stats.withTriggers / stats.total) * 100).toFixed(1)}%)`);
  console.log(`With clan tags:        ${stats.withClans} (${((stats.withClans / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Main deck cards:       ${stats.mainDeckCards} (${((stats.mainDeckCards / stats.total) * 100).toFixed(1)}%)`);
  console.log(`Resource zone cards:   ${stats.resourceCards} (${((stats.resourceCards / stats.total) * 100).toFixed(1)}%)`);
  console.log(`EX cards:              ${stats.exCards} (${((stats.exCards / stats.total) * 100).toFixed(1)}%)`);
  console.log('');
  
  // Sample enriched cards
  console.log('Sample enriched cards:');
  console.log('='.repeat(80));
  const samples = enrichedCards
    .filter(c => c.keywords && c.keywords.length > 0)
    .slice(0, 5);
  
  for (const card of samples) {
    console.log(`${card.id} - ${card.name}`);
    console.log(`  Normalized: ${card.normalizedName}`);
    if (card.keywords) console.log(`  Keywords: ${card.keywords.join(', ')}`);
    if (card.triggers) console.log(`  Triggers: ${card.triggers.join(', ')}`);
    if (card.clans) console.log(`  Clans: ${card.clans.join(', ')}`);
    console.log(`  Zones: ${[
      card.isMainDeck ? 'main' : null,
      card.isResource ? 'resource' : null,
      card.isExCard ? 'EX' : null,
    ].filter(Boolean).join(', ')}`);
    console.log('');
  }
  
  // Write enriched data
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enrichedCards, null, 2));
  console.log(`Enriched catalog saved to: ${OUTPUT_PATH}`);
  console.log('');
  console.log('✓ Enrichment complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Review enriched data for accuracy');
  console.log('2. Update CardDefinition type to include new fields');
  console.log('3. Update API endpoints to use enriched fields');
  console.log('4. Test filtering and synergy scoring');
  console.log('');
}

// Run enrichment
try {
  enrichDatabase();
  process.exit(0);
} catch (error) {
  console.error('Error during enrichment:', error);
  process.exit(1);
}
