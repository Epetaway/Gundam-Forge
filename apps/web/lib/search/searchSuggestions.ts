/**
 * Search Suggestions
 * 
 * Generates autocomplete suggestions for search input.
 * Groups suggestions by category: Effects, Clans, Cards
 */

import type { CardDefinition } from '@gundam-forge/shared';
import { 
  EFFECT_KEYWORDS, 
  EFFECT_CATEGORIES, 
  CATEGORY_LABELS,
  type EffectKeyword,
  type EffectCategory 
} from './effectKeywordDatabase';

export type SuggestionType = 'effect' | 'clan' | 'card';

export interface Suggestion {
  /** Suggestion type for grouping */
  type: SuggestionType;
  /** Display label */
  label: string;
  /** Value to insert into search */
  value: string;
  /** Optional category for effects */
  category?: EffectCategory;
  /** Optional preview count */
  count?: number;
  /** Optional card reference */
  card?: CardDefinition;
}

export interface SuggestionGroup {
  type: SuggestionType;
  label: string;
  suggestions: Suggestion[];
}

export interface SuggestionsOptions {
  /** Maximum suggestions per category */
  maxPerCategory?: number;
  /** Include card name suggestions */
  includeCards?: boolean;
  /** Include effect keyword suggestions */
  includeEffects?: boolean;
  /** Include clan suggestions */
  includeClans?: boolean;
}

/**
 * Generate search suggestions based on partial query
 */
export function generateSearchSuggestions(
  query: string,
  cards: CardDefinition[],
  options: SuggestionsOptions = {}
): SuggestionGroup[] {
  const {
    maxPerCategory = 5,
    includeCards = true,
    includeEffects = true,
    includeClans = true,
  } = options;
  
  const trimmedQuery = query.trim().toLowerCase();
  
  if (!trimmedQuery) {
    return [];
  }
  
  const groups: SuggestionGroup[] = [];
  
  // Effect keyword suggestions
  if (includeEffects) {
    const effectSuggestions = getEffectSuggestions(trimmedQuery, cards, maxPerCategory);
    if (effectSuggestions.length > 0) {
      groups.push({
        type: 'effect',
        label: 'Effect Keywords',
        suggestions: effectSuggestions,
      });
    }
  }
  
  // Clan suggestions
  if (includeClans) {
    const clanSuggestions = getClanSuggestions(trimmedQuery, cards, maxPerCategory);
    if (clanSuggestions.length > 0) {
      groups.push({
        type: 'clan',
        label: 'Clans',
        suggestions: clanSuggestions,
      });
    }
  }
  
  // Card name suggestions
  if (includeCards) {
    const cardSuggestions = getCardSuggestions(trimmedQuery, cards, maxPerCategory);
    if (cardSuggestions.length > 0) {
      groups.push({
        type: 'card',
        label: 'Cards',
        suggestions: cardSuggestions,
      });
    }
  }
  
  return groups;
}

/**
 * Get effect keyword suggestions matching query
 */
function getEffectSuggestions(
  query: string,
  cards: CardDefinition[],
  limit: number
): Suggestion[] {
  const matches: Array<{ effect: EffectKeyword; score: number }> = [];
  
  for (const effect of EFFECT_KEYWORDS) {
    let score = 0;
    
    // Check keyword match
    if (effect.keyword.toLowerCase().includes(query)) {
      score = 10;
      // Boost if starts with query
      if (effect.keyword.toLowerCase().startsWith(query)) {
        score = 20;
      }
    }
    
    // Check label match
    if (effect.label.toLowerCase().includes(query)) {
      score = Math.max(score, 8);
    }
    
    // Check aliases
    if (effect.aliases) {
      for (const alias of effect.aliases) {
        if (alias.toLowerCase().includes(query)) {
          score = Math.max(score, 6);
        }
      }
    }
    
    if (score > 0) {
      matches.push({ effect, score });
    }
  }
  
  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);
  
  // Convert to suggestions with card counts
  const suggestions: Suggestion[] = matches.slice(0, limit).map(({ effect }) => {
    const count = countCardsWithEffect(cards, effect.keyword);
    return {
      type: 'effect',
      label: effect.label,
      value: effect.keyword,
      category: effect.category,
      count,
    };
  });
  
  return suggestions;
}

/**
 * Get clan suggestions matching query
 */
function getClanSuggestions(
  query: string,
  cards: CardDefinition[],
  limit: number
): Suggestion[] {
  // Extract all unique clans from cards
  const clanCounts = new Map<string, number>();
  
  for (const card of cards) {
    if (card.clans) {
      for (const clan of card.clans) {
        clanCounts.set(clan, (clanCounts.get(clan) ?? 0) + 1);
      }
    }
  }
  
  // Filter clans matching query
  const matches: Array<{ clan: string; count: number; score: number }> = [];
  
  for (const [clan, count] of clanCounts.entries()) {
    const lowerClan = clan.toLowerCase();
    
    if (lowerClan.includes(query)) {
      let score = 10;
      // Boost if starts with query
      if (lowerClan.startsWith(query)) {
        score = 20;
      }
      // Boost popular clans slightly
      score += Math.log(count);
      
      matches.push({ clan, count, score });
    }
  }
  
  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);
  
  const suggestions: Suggestion[] = matches.slice(0, limit).map(({ clan, count }) => ({
    type: 'clan',
    label: clan,
    value: clan,
    count,
  }));
  
  return suggestions;
}

/**
 * Get card name suggestions matching query
 */
function getCardSuggestions(
  query: string,
  cards: CardDefinition[],
  limit: number
): Suggestion[] {
  const matches: Array<{ card: CardDefinition; score: number }> = [];
  
  for (const card of cards) {
    const lowerName = card.name.toLowerCase();
    const lowerId = card.id.toLowerCase();
    
    let score = 0;
    
    // Check name match
    if (lowerName.includes(query)) {
      score = 10;
      // Boost if starts with query
      if (lowerName.startsWith(query)) {
        score = 20;
      }
    }
    
    // Check ID match (lower priority)
    if (lowerId.includes(query)) {
      score = Math.max(score, 5);
    }
    
    if (score > 0) {
      matches.push({ card, score });
    }
  }
  
  // Sort by score (descending)
  matches.sort((a, b) => b.score - a.score);
  
  const suggestions: Suggestion[] = matches.slice(0, limit).map(({ card }) => ({
    type: 'card',
    label: card.name,
    value: card.name,
    card,
  }));
  
  return suggestions;
}

/**
 * Count cards with a specific effect keyword
 */
function countCardsWithEffect(cards: CardDefinition[], effectKeyword: string): number {
  let count = 0;
  
  for (const card of cards) {
    const effects = (card as any).effectKeywords as string[] | undefined;
    if (effects?.includes(effectKeyword)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Get popular effects (most common across all cards)
 */
export function getPopularEffects(cards: CardDefinition[], limit: number = 10): Suggestion[] {
  const effectCounts = new Map<string, number>();
  
  for (const card of cards) {
    const effects = (card as any).effectKeywords as string[] | undefined;
    if (effects) {
      for (const effect of effects) {
        effectCounts.set(effect, (effectCounts.get(effect) ?? 0) + 1);
      }
    }
  }
  
  const sorted = Array.from(effectCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return sorted.map(([keyword, count]) => {
    const effectData = EFFECT_KEYWORDS.find(e => e.keyword === keyword);
    return {
      type: 'effect' as SuggestionType,
      label: effectData?.label ?? keyword,
      value: keyword,
      category: effectData?.category,
      count,
    };
  });
}

/**
 * Get popular clans (most common across all cards)
 */
export function getPopularClans(cards: CardDefinition[], limit: number = 10): Suggestion[] {
  const clanCounts = new Map<string, number>();
  
  for (const card of cards) {
    if (card.clans) {
      for (const clan of card.clans) {
        clanCounts.set(clan, (clanCounts.get(clan) ?? 0) + 1);
      }
    }
  }
  
  const sorted = Array.from(clanCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return sorted.map(([clan, count]) => ({
    type: 'clan' as SuggestionType,
    label: clan,
    value: clan,
    count,
  }));
}
