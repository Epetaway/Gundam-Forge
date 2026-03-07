/**
 * Advanced Card Filter
 * 
 * Multi-field card filtering with relevance scoring.
 * Searches across: Name > Clans > Effect Keywords > Card Text > Traits
 * 
 * Supports parsed search queries with AND/OR/negation logic.
 */

import type { CardDefinition } from '@gundam-forge/shared';
import { parseSearchQuery, termMatchesText, type ParsedQuery, type SearchClause } from './searchParser';

export interface FilterOptions {
  /** Search query (will be parsed) */
  query?: string;
  /** Pre-parsed query (takes precedence over query) */
  parsedQuery?: ParsedQuery;
  /** Effect keywords to filter by (AND logic) */
  effectKeywords?: string[];
  /** Clans to filter by (OR logic) */
  clans?: string[];
  /** Existing keyword filters (blocker, repair, etc.) */
  keywords?: string[];
  /** Existing trigger filters (burst, deploy, etc.) */
  triggers?: string[];
  /** Color filter */
  color?: string;
  /** Type filter */
  type?: string;
  /** Set filter */
  set?: string;
}

export interface ScoredCard {
  card: CardDefinition;
  score: number;
  matchedFields: string[];
}

/**
 * Filter cards with advanced search and relevance scoring
 */
export function filterCardsAdvanced(
  cards: CardDefinition[],
  options: FilterOptions = {}
): ScoredCard[] {
  const parsedQuery = options.parsedQuery ?? (options.query ? parseSearchQuery(options.query) : null);
  
  const results: ScoredCard[] = [];
  
  for (const card of cards) {
    // Apply basic filters first (fast rejection)
    if (!passesBasicFilters(card, options)) {
      continue;
    }
    
    // Apply search query with scoring
    const searchResult = searchCard(card, parsedQuery, options);
    
    if (searchResult.matches) {
      results.push({
        card,
        score: searchResult.score,
        matchedFields: searchResult.matchedFields,
      });
    }
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);
  
  return results;
}

/**
 * Check if card passes basic non-text filters
 */
function passesBasicFilters(card: CardDefinition, options: FilterOptions): boolean {
  // Color filter
  if (options.color && options.color !== 'All' && card.color !== options.color) {
    return false;
  }
  
  // Type filter
  if (options.type && options.type !== 'All' && card.type !== options.type) {
    return false;
  }
  
  // Set filter
  if (options.set && options.set !== 'All' && card.set !== options.set) {
    return false;
  }
  
  // Keyword filter (AND logic - card must have ALL selected keywords)
  if (options.keywords && options.keywords.length > 0) {
    const cardKeywords = card.keywords ?? [];
    const hasAllKeywords = options.keywords.every(kw => cardKeywords.includes(kw));
    if (!hasAllKeywords) {
      return false;
    }
  }
  
  // Trigger filter (AND logic - card must have ALL selected triggers)
  if (options.triggers && options.triggers.length > 0) {
    const cardTriggers = card.triggers ?? [];
    const hasAllTriggers = options.triggers.every(tr => cardTriggers.includes(tr));
    if (!hasAllTriggers) {
      return false;
    }
  }
  
  // Clan filter (OR logic - card must have ANY selected clan)
  if (options.clans && options.clans.length > 0) {
    const cardClans = card.clans ?? [];
    const hasAnyClan = options.clans.some(clan => 
      cardClans.some(cc => cc.toLowerCase() === clan.toLowerCase())
    );
    if (!hasAnyClan) {
      return false;
    }
  }
  
  // Effect keyword filter (AND logic - card must have ALL selected effect keywords)
  if (options.effectKeywords && options.effectKeywords.length > 0) {
    const cardEffects = (card as any).effectKeywords as string[] | undefined;
    if (!cardEffects || cardEffects.length === 0) {
      return false;
    }
    const hasAllEffects = options.effectKeywords.every(ek => cardEffects.includes(ek));
    if (!hasAllEffects) {
      return false;
    }
  }
  
  return true;
}

interface SearchResult {
  matches: boolean;
  score: number;
  matchedFields: string[];
}

/**
 * Search card with parsed query and calculate relevance score
 */
function searchCard(
  card: CardDefinition,
  parsedQuery: ParsedQuery | null,
  options: FilterOptions
): SearchResult {
  // No query = match all (if passed basic filters)
  if (!parsedQuery || parsedQuery.isEmpty) {
    return { matches: true, score: 0, matchedFields: [] };
  }
  
  // Build searchable text fields with weights
  const searchableFields = [
    { name: 'name', text: card.name, weight: 10 },
    { name: 'clans', text: (card.clans ?? []).join(' '), weight: 8 },
    { name: 'effectKeywords', text: ((card as any).effectKeywords as string[] ?? []).join(' '), weight: 6 },
    { name: 'text', text: card.text ?? '', weight: 4 },
    { name: 'traits', text: (card.traits ?? []).join(' '), weight: 2 },
    { name: 'id', text: card.id, weight: 1 },
  ];
  
  // Evaluate each clause (clauses are OR'd together)
  let overallMatches = false;
  let maxScore = 0;
  const matchedFields = new Set<string>();
  
  for (const clause of parsedQuery.clauses) {
    const clauseResult = evaluateClause(clause, searchableFields);
    
    if (clauseResult.matches) {
      overallMatches = true;
      maxScore = Math.max(maxScore, clauseResult.score);
      clauseResult.matchedFields.forEach(f => matchedFields.add(f));
    }
  }
  
  return {
    matches: overallMatches,
    score: maxScore,
    matchedFields: Array.from(matchedFields),
  };
}

interface SearchableField {
  name: string;
  text: string;
  weight: number;
}

/**
 * Evaluate a single search clause (terms are AND'd together)
 */
function evaluateClause(
  clause: SearchClause,
  fields: SearchableField[]
): SearchResult {
  let score = 0;
  const matchedFields = new Set<string>();
  
  // All terms in a clause must match (AND logic)
  for (const term of clause.terms) {
    let termMatched = false;
    let termScore = 0;
    
    // Check each field for this term
    for (const field of fields) {
      const fieldMatches = termMatchesText(term, field.text);
      
      if (term.negated) {
        // Negated term: if found, clause fails
        if (fieldMatches) {
          return { matches: false, score: 0, matchedFields: [] };
        }
      } else {
        // Positive term: add to score if found
        if (fieldMatches) {
          termMatched = true;
          termScore = Math.max(termScore, field.weight);
          matchedFields.add(field.name);
        }
      }
    }
    
    // If positive term didn't match any field, clause fails
    if (!term.negated && !termMatched) {
      return { matches: false, score: 0, matchedFields: [] };
    }
    
    score += termScore;
  }
  
  return {
    matches: true,
    score,
    matchedFields: Array.from(matchedFields),
  };
}

/**
 * Simple filter (no scoring) - returns just the cards
 */
export function filterCards(cards: CardDefinition[], options: FilterOptions = {}): CardDefinition[] {
  return filterCardsAdvanced(cards, options).map(result => result.card);
}

/**
 * Get search suggestions for autocomplete
 * Returns top N matching cards based on partial query
 */
export function getSearchPreview(
  cards: CardDefinition[],
  query: string,
  limit: number = 5
): CardDefinition[] {
  if (!query.trim()) return [];
  
  const results = filterCardsAdvanced(cards, { query });
  return results.slice(0, limit).map(r => r.card);
}
