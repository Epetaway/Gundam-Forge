/**
 * Effect Keyword Extraction
 * 
 * Extracts effect keywords from card text using the effect keyword database.
 * Used during card catalog enrichment at module load.
 */

import { EFFECT_KEYWORDS, type EffectKeyword } from './effectKeywordDatabase';
import type { CardDefinition } from '@gundam-forge/shared';

/**
 * Extract effect keywords from card text
 * Returns an array of unique keyword strings that match patterns
 */
export function extractEffectKeywords(cardText: string): string[] {
  if (!cardText) return [];
  
  const extractedKeywords = new Set<string>();
  
  // Test each effect keyword pattern against the card text
  for (const effectKeyword of EFFECT_KEYWORDS) {
    const hasMatch = effectKeyword.patterns.some(pattern => pattern.test(cardText));
    
    if (hasMatch) {
      extractedKeywords.add(effectKeyword.keyword);
    }
  }
  
  return Array.from(extractedKeywords).sort();
}

/**
 * Extract effect keywords with their full metadata
 * Useful for debugging or advanced filtering
 */
export function extractEffectKeywordDetails(cardText: string): EffectKeyword[] {
  if (!cardText) return [];
  
  const matchedEffects: EffectKeyword[] = [];
  
  for (const effectKeyword of EFFECT_KEYWORDS) {
    const hasMatch = effectKeyword.patterns.some(pattern => pattern.test(cardText));
    
    if (hasMatch) {
      matchedEffects.push(effectKeyword);
    }
  }
  
  return matchedEffects;
}

/**
 * Enrich a single card with effect keywords
 * Mutates the card object by adding effectKeywords field
 */
export function enrichCardWithEffectKeywords(card: CardDefinition): void {
  const text = card.text ?? '';
  
  // Only enrich if not already enriched
  if (!(card as any).effectKeywords) {
    (card as any).effectKeywords = extractEffectKeywords(text);
  }
}

/**
 * Check if a card has a specific effect keyword
 */
export function cardHasEffect(card: CardDefinition, effectKeyword: string): boolean {
  const effectKeywords = (card as any).effectKeywords as string[] | undefined;
  return effectKeywords?.includes(effectKeyword) ?? false;
}

/**
 * Check if a card has any of the specified effect keywords (OR logic)
 */
export function cardHasAnyEffect(card: CardDefinition, effectKeywords: string[]): boolean {
  const cardEffects = (card as any).effectKeywords as string[] | undefined;
  if (!cardEffects || cardEffects.length === 0) return false;
  return effectKeywords.some(keyword => cardEffects.includes(keyword));
}

/**
 * Check if a card has all of the specified effect keywords (AND logic)
 */
export function cardHasAllEffects(card: CardDefinition, effectKeywords: string[]): boolean {
  const cardEffects = (card as any).effectKeywords as string[] | undefined;
  if (!cardEffects || cardEffects.length === 0) return false;
  return effectKeywords.every(keyword => cardEffects.includes(keyword));
}
