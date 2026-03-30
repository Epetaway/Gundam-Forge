/**
 * Synergy Package Mapping and Scoring System
 * 
 * Maps deck intent packages to card keywords/triggers for accurate filtering and ranking
 * Provides deterministic synergy scoring based on exact keyword/trigger matches
 * 
 * Used by:
 * - CardSearchPanel for filtering and sorting
 * - API endpoints for server-side ranking
 * - Deck validation for synergy warnings
 */

import type { CardDefinition } from './types';
import { isExCard, isMainDeckCard } from './cardClassification';
import { getPackagesByIds, getMechanicsFromPackages } from './deckIntentPackages';

// ─── Simple LRU Cache ────────────────────────────────────────────────────────
// Caches synergy scoring results to avoid recomputing for the same parameters
class SynergyScoreCache {
  private cache = new Map<string, CardSynergyScore>();
  private readonly maxSize = 5000; // ~5000 card score computations per intent

  private buildKey(
    cardId: string,
    selectedPackages: string[],
    selectedClans: string[],
    selectedColors: string[],
    includeEX: boolean,
  ): string {
    // Cache key format: cardId:packages:clans:colors:includeEX
    // Uses sorted arrays for consistent keys
    const pkgs = [...selectedPackages].sort().join(',');
    const clans = [...selectedClans].sort().join(',');
    const colors = [...selectedColors].sort().join(',');
    return `${cardId}:${pkgs}:${clans}:${colors}:${includeEX}`;
  }

  get(
    cardId: string,
    selectedPackages: string[],
    selectedClans: string[],
    selectedColors: string[],
    includeEX: boolean,
  ): CardSynergyScore | null {
    const key = this.buildKey(cardId, selectedPackages, selectedClans, selectedColors, includeEX);
    return this.cache.get(key) ?? null;
  }

  set(
    cardId: string,
    selectedPackages: string[],
    selectedClans: string[],
    selectedColors: string[],
    includeEX: boolean,
    score: CardSynergyScore,
  ): void {
    if (this.cache.size >= this.maxSize) {
      // Simple eviction: remove first entry when full
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    const key = this.buildKey(cardId, selectedPackages, selectedClans, selectedColors, includeEX);
    this.cache.set(key, score);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const synergyScoreCache = new SynergyScoreCache();

/**
 * Clear the synergy score cache when deck intent changes
 */
export function clearSynergyScoreCache(): void {
  synergyScoreCache.clear();
}

/**
 * Synergy weights for scoring
 * Higher weights = stronger match
 */
export const SYNERGY_WEIGHTS = {
  KEYWORD_PRIMARY: 20,    // Direct keyword match (e.g., "repair" for Hangar Attrition)
  TRIGGER_PRIMARY: 15,    // Direct trigger match (e.g., "when_paired" for Ace Sync)
  KEYWORD_SECONDARY: 10,  // Related keyword (e.g., "blocker" for defensive strategies)
  TRIGGER_SECONDARY: 8,   // Related trigger
  CLAN_MATCH: 10,         // Clan/faction match (bonus — raised since clan is explicit user intent)
  COLOR_MATCH: 3,         // Color match (bonus)
  COLOR_MISMATCH: -10,    // Color incompatibility (penalty)
  EX_MISMATCH: -50,       // EX card when includeEX=false (hard penalty)
};

/**
 * Package-to-keywords mapping with priority weights
 * Primary keywords are the core mechanics; secondary are supporting mechanics
 */
export const PACKAGE_KEYWORD_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  'hangar-attrition': {
    primary: ['repair', 'blocker'],
    secondary: [],
  },
  'shield-pressure': {
    primary: ['breach', 'suppression'],
    secondary: [],
  },
  'buff-chain-support': {
    primary: ['support'],
    secondary: [],
  },
  'ace-sync': {
    primary: [],
    secondary: [],
  },
  'tempo-deploy': {
    primary: [],
    secondary: [],
  },
  'attack-value-engine': {
    primary: [],
    secondary: [],
  },
  'action-step-tricks': {
    primary: [],
    secondary: [],
  },
  'evasion-and-preempt': {
    primary: ['high_maneuver', 'first_strike'],
    secondary: [],
  },
};

/**
 * Package-to-triggers mapping with priority weights
 */
export const PACKAGE_TRIGGER_MAP: Record<string, { primary: string[]; secondary: string[] }> = {
  'hangar-attrition': {
    primary: ['burst'],
    secondary: [],
  },
  'shield-pressure': {
    primary: [],
    secondary: ['destroyed'],
  },
  'buff-chain-support': {
    primary: ['activate_main'],
    secondary: [],
  },
  'ace-sync': {
    primary: ['when_paired', 'during_pair', 'when_linked', 'during_link'],
    secondary: [],
  },
  'tempo-deploy': {
    primary: ['deploy'],
    secondary: [],
  },
  'attack-value-engine': {
    primary: ['attack_trigger'],
    secondary: [],
  },
  'action-step-tricks': {
    primary: ['activate_action'],
    secondary: [],
  },
  'evasion-and-preempt': {
    primary: [],
    secondary: [],
  },
};

export interface SynergyReason {
  code: string;
  description: string;
  weight: number;
}

export interface CardSynergyScore {
  cardId: string;
  totalScore: number;
  reasons: SynergyReason[];
}

/**
 * Calculate synergy score for a single card given selected packages and deck intent
 * Results are cached to avoid recomputation for the same parameters
 */
export function calculateCardSynergy(
  card: CardDefinition,
  selectedPackages: string[],
  selectedClans: string[] = [],
  selectedColors: string[] = [],
  includeEX: boolean = false,
): CardSynergyScore {
  // Check cache first
  const cached = synergyScoreCache.get(
    card.id,
    selectedPackages,
    selectedClans,
    selectedColors,
    includeEX,
  );
  if (cached) return cached;

  const reasons: SynergyReason[] = [];
  let totalScore = 0;

  // Hard penalty for EX cards when not included
  if (!includeEX && card.isExCard) {
    reasons.push({
      code: 'EX_CARD_EXCLUDED',
      description: 'EX card excluded from main deck',
      weight: SYNERGY_WEIGHTS.EX_MISMATCH,
    });
    totalScore += SYNERGY_WEIGHTS.EX_MISMATCH;
    const result = { cardId: card.id, totalScore, reasons };
    synergyScoreCache.set(
      card.id,
      selectedPackages,
      selectedClans,
      selectedColors,
      includeEX,
      result,
    );
    return result;
  }

  // Check color matches (non-Colorless only)
  const cardColor = card.color;
  if (selectedColors.length > 0 && cardColor !== 'Colorless') {
    if (selectedColors.includes(cardColor)) {
      reasons.push({
        code: 'COLOR_MATCH',
        description: `${cardColor} color matches deck`,
        weight: SYNERGY_WEIGHTS.COLOR_MATCH,
      });
      totalScore += SYNERGY_WEIGHTS.COLOR_MATCH;
    } else {
      reasons.push({
        code: 'COLOR_MISMATCH',
        description: `${cardColor} not in selected colors`,
        weight: SYNERGY_WEIGHTS.COLOR_MISMATCH,
      });
      totalScore += SYNERGY_WEIGHTS.COLOR_MISMATCH;
    }
  }

  // Check clan matches (card.clans populated by enrichCard() in cards.ts)
  if (selectedClans.length > 0 && card.clans && card.clans.length > 0) {
    const matchedClan = card.clans.find((c) => selectedClans.includes(c));
    if (matchedClan) {
      reasons.push({
        code: 'CLAN_MATCH',
        description: `${matchedClan} faction`,
        weight: SYNERGY_WEIGHTS.CLAN_MATCH,
      });
      totalScore += SYNERGY_WEIGHTS.CLAN_MATCH;
    }
  }

  // Check keyword and trigger matches for each selected package
  const cardKeywords = card.keywords || [];
  const cardTriggers = card.triggers || [];

  for (const packageId of selectedPackages) {
    const keywordMapping = PACKAGE_KEYWORD_MAP[packageId];
    const triggerMapping = PACKAGE_TRIGGER_MAP[packageId];

    if (keywordMapping) {
      for (const keyword of keywordMapping.primary) {
        if (cardKeywords.includes(keyword)) {
          reasons.push({
            code: `KEYWORD_${keyword.toUpperCase()}`,
            description: `Has ${keyword} keyword`,
            weight: SYNERGY_WEIGHTS.KEYWORD_PRIMARY,
          });
          totalScore += SYNERGY_WEIGHTS.KEYWORD_PRIMARY;
        }
      }
      for (const keyword of keywordMapping.secondary) {
        if (cardKeywords.includes(keyword)) {
          reasons.push({
            code: `KEYWORD_SEC_${keyword.toUpperCase()}`,
            description: `Has supporting ${keyword} keyword`,
            weight: SYNERGY_WEIGHTS.KEYWORD_SECONDARY,
          });
          totalScore += SYNERGY_WEIGHTS.KEYWORD_SECONDARY;
        }
      }
    }

    if (triggerMapping) {
      for (const trigger of triggerMapping.primary) {
        if (cardTriggers.includes(trigger)) {
          reasons.push({
            code: `TRIGGER_${trigger.toUpperCase()}`,
            description: `Has ${trigger.replace(/_/g, ' ')} trigger`,
            weight: SYNERGY_WEIGHTS.TRIGGER_PRIMARY,
          });
          totalScore += SYNERGY_WEIGHTS.TRIGGER_PRIMARY;
        }
      }
      for (const trigger of triggerMapping.secondary) {
        if (cardTriggers.includes(trigger)) {
          reasons.push({
            code: `TRIGGER_SEC_${trigger.toUpperCase()}`,
            description: `Has supporting ${trigger.replace(/_/g, ' ')} trigger`,
            weight: SYNERGY_WEIGHTS.TRIGGER_SECONDARY,
          });
          totalScore += SYNERGY_WEIGHTS.TRIGGER_SECONDARY;
        }
      }
    }
  }

  // Cross-package bonus: card supports 2+ selected packages simultaneously
  if (selectedPackages.length >= 2) {
    const matchedPackageCount = selectedPackages.filter((pkg) => {
      const kw = PACKAGE_KEYWORD_MAP[pkg];
      const tr = PACKAGE_TRIGGER_MAP[pkg];
      const allKw = [...(kw?.primary ?? []), ...(kw?.secondary ?? [])];
      const allTr = [...(tr?.primary ?? []), ...(tr?.secondary ?? [])];
      return allKw.some((k) => cardKeywords.includes(k)) || allTr.some((t) => cardTriggers.includes(t));
    }).length;
    if (matchedPackageCount >= 2) {
      reasons.push({
        code: 'CROSS_PACKAGE',
        description: 'Supports multiple strategies',
        weight: 8,
      });
      totalScore += 8;
    }
  }

  const result = {
    cardId: card.id,
    totalScore,
    reasons,
  };

  // Cache the result before returning
  synergyScoreCache.set(
    card.id,
    selectedPackages,
    selectedClans,
    selectedColors,
    includeEX,
    result,
  );

  return result;
}

/**
 * Sort cards by synergy score (descending)
 * Returns sorted array with scores and reasons attached
 */
export function sortCardsBySynergy(
  cards: CardDefinition[],
  selectedPackages: string[],
  selectedClans: string[] = [],
  selectedColors: string[] = [],
  includeEX: boolean = false,
): Array<CardDefinition & { synergyScore: number; synergyReasons: SynergyReason[] }> {
  const scoredCards = cards.map((card) => {
    const synergy = calculateCardSynergy(card, selectedPackages, selectedClans, selectedColors, includeEX);
    return {
      ...card,
      synergyScore: synergy.totalScore,
      synergyReasons: synergy.reasons,
    };
  });

  // Sort by score descending, then by name alphabetically
  return scoredCards.sort((a, b) => {
    if (b.synergyScore !== a.synergyScore) {
      return b.synergyScore - a.synergyScore;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Filter cards based on deck intent (zone, colors, series)
 * Returns only cards that are legal for the deck
 */
export function filterCardsByIntent(
  cards: CardDefinition[],
  selectedColors: string[] = [],
  selectedClans?: string[],
  includeEX: boolean = false,
  onlyMainDeck: boolean = true,
): CardDefinition[] {
  return cards.filter((card) => {
    // Zone filtering — delegate to shared classification utilities
    if (!includeEX && isExCard(card)) return false;
    if (onlyMainDeck && !isMainDeckCard(card)) return false;

    // Color filtering (allow Colorless + selected colors)
    if (selectedColors.length > 0) {
      const allowedColors = new Set([...selectedColors, 'Colorless']);
      if (!allowedColors.has(card.color)) return false;
    }

    // Clan filtering (graceful: if card has no clan tags, include it)
    if (selectedClans && selectedClans.length > 0 && card.clans && card.clans.length > 0) {
      const hasMatchingClan = card.clans.some((c) => selectedClans.includes(c));
      if (!hasMatchingClan) return false;
    }

    return true;
  });
}

/**
 * Get top N cards by synergy for a given intent
 * Combines filtering and scoring in one operation
 */
export function getTopCardsBySynergy(
  cards: CardDefinition[],
  selectedPackages: string[],
  selectedClans: string[] = [],
  selectedColors: string[] = [],
  includeEX: boolean = false,
  limit: number = 50,
): Array<CardDefinition & { synergyScore: number; synergyReasons: SynergyReason[] }> {
  // First filter
  const filtered = filterCardsByIntent(cards, selectedColors, selectedClans, includeEX, true);

  // Then score and sort
  const sorted = sortCardsBySynergy(filtered, selectedPackages, selectedClans, selectedColors, includeEX);

  // Return top N
  return sorted.slice(0, limit);
}
