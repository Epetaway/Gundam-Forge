import type { CardDefinition } from '@gundam-forge/shared';

export interface SynergyMatch {
  cardId: string;
  synergyType: 'pair' | 'link' | 'keyword-combo' | 'trait-synergy';
  strength: number; // 0-100
  reason: string;
}

/**
 * Find cards that synergize with the given deck composition
 */
export function findSynergies(
  targetCard: CardDefinition,
  deckCards: CardDefinition[],
): SynergyMatch[] {
  const synergies: SynergyMatch[] = [];

  deckCards.forEach((deckCard) => {
    // Link condition matching (Pilot ↔ Unit)
    if (targetCard.type === 'Pilot' && deckCard.type === 'Unit' && deckCard.linkCondition) {
      if (matchesLinkCondition(targetCard, deckCard.linkCondition)) {
        synergies.push({
          cardId: deckCard.id,
          synergyType: 'link',
          strength: 90,
          reason: `Pairs with ${deckCard.name}`,
        });
      }
    } else if (targetCard.type === 'Unit' && deckCard.type === 'Pilot' && targetCard.linkCondition) {
      if (matchesLinkCondition(deckCard, targetCard.linkCondition)) {
        synergies.push({
          cardId: deckCard.id,
          synergyType: 'link',
          strength: 90,
          reason: `Links to ${deckCard.name}`,
        });
      }
    }

    // Pair qualifier matching (Unit with "When Paired" ← Pilot)
    if (targetCard.type === 'Unit' && deckCard.type === 'Pilot' && targetCard.pairQualifiers) {
      if (matchesPairQualifier(deckCard, targetCard.pairQualifiers)) {
        synergies.push({
          cardId: deckCard.id,
          synergyType: 'pair',
          strength: 85,
          reason: `Activates when paired with ${deckCard.name}`,
        });
      }
    }

    // Keyword synergies (e.g., Support + attackers, Blocker + Repair)
    const kwSynergy = findKeywordSynergy(targetCard, deckCard);
    if (kwSynergy) synergies.push({ cardId: deckCard.id, ...kwSynergy });

    // Trait synergies (shared faction tags)
    const traitSyn = findTraitSynergy(targetCard, deckCard);
    if (traitSyn) synergies.push({ cardId: deckCard.id, ...traitSyn });
  });

  return synergies.sort((a, b) => b.strength - a.strength);
}

function matchesLinkCondition(pilot: CardDefinition, linkCond: string): boolean {
  // Exact name: "[Amuro Ray]"
  if (linkCond.includes(pilot.name)) return true;

  // Trait requirement: "(White Base Team) Trait"
  const traitMatch = linkCond.match(/\(([^)]+)\)\s+Trait/i);
  if (traitMatch) {
    const requiredTrait = traitMatch[1];
    return pilot.traits?.some((t) => t.includes(requiredTrait)) ?? false;
  }

  return false;
}

function matchesPairQualifier(pilot: CardDefinition, qualifiers: string[]): boolean {
  return qualifiers.some((qual) => {
    // Level: "Lv.4+" or "Lv.3-"
    if (qual.startsWith('Lv.')) {
      const lv = pilot.level ?? 0;
      if (qual.endsWith('+')) return lv >= parseInt(qual.slice(3), 10);
      if (qual.endsWith('-')) return lv <= parseInt(qual.slice(3), 10);
    }
    // Color: "Red", "Blue", etc.
    if (pilot.color === qual) return true;
    // Trait: "(ZAFT)", "(Newtype)", etc.
    if (qual.startsWith('(')) {
      const trait = qual.slice(1, -1);
      return pilot.traits?.some((t) => t.includes(trait)) ?? false;
    }
    return false;
  });
}

function findKeywordSynergy(
  card: CardDefinition,
  deckCard: CardDefinition,
): Omit<SynergyMatch, 'cardId'> | null {
  const keywords = card.keywords ?? [];
  const deckKeywords = deckCard.keywords ?? [];

  // Support + high AP units
  if (keywords.some((k) => k.startsWith('support')) && (deckCard.ap ?? 0) >= 4) {
    return {
      synergyType: 'keyword-combo',
      strength: 60,
      reason: 'Support boosts high-AP attacker',
    };
  }

  // Blocker + Repair (defensive combo)
  if (keywords.includes('blocker') && deckKeywords.some((k) => k.startsWith('repair'))) {
    return {
      synergyType: 'keyword-combo',
      strength: 55,
      reason: 'Blocker + Repair = sustained defense',
    };
  }

  // Breach + First Strike (offensive combo)
  if (
    keywords.some((k) => k.startsWith('breach')) &&
    deckKeywords.includes('first-strike')
  ) {
    return {
      synergyType: 'keyword-combo',
      strength: 58,
      reason: 'First Strike + Breach = shield breakthrough',
    };
  }

  // High-Maneuver + burst damage
  if (keywords.includes('high-maneuver') && (card.ap ?? 0) >= 4) {
    return {
      synergyType: 'keyword-combo',
      strength: 50,
      reason: 'Unblockable high AP damage',
    };
  }

  return null;
}

function findTraitSynergy(
  card: CardDefinition,
  deckCard: CardDefinition,
): Omit<SynergyMatch, 'cardId'> | null {
  const cardTraits = card.traits?.flatMap((t) => t.match(/\([^)]+\)/g) || []) ?? [];
  const deckTraits = deckCard.traits?.flatMap((t) => t.match(/\([^)]+\)/g) || []) ?? [];

  // Find shared faction traits
  const sharedTraits = cardTraits.filter((t) => deckTraits.includes(t));
  if (sharedTraits.length > 0) {
    return {
      synergyType: 'trait-synergy',
      strength: 40,
      reason: `Shares ${sharedTraits[0].slice(1, -1)} trait`,
    };
  }

  return null;
}

/**
 * Extract base keyword name from keywords like "repair 1" → "repair"
 */
export function getBaseKeyword(keyword: string): string {
  return keyword.toLowerCase().split(' ')[0];
}

/**
 * Check if card has a specific keyword (ignoring numeric values)
 */
export function hasKeyword(card: CardDefinition, keyword: string): boolean {
  const baseKeyword = keyword.toLowerCase();
  return (card.keywords ?? []).some((k) => getBaseKeyword(k) === baseKeyword);
}

/**
 * Get all unique base keywords from a list of cards
 */
export function getUniqueKeywords(cards: CardDefinition[]): string[] {
  const keywordSet = new Set<string>();
  cards.forEach((card) => {
    (card.keywords ?? []).forEach((k) => {
      keywordSet.add(getBaseKeyword(k));
    });
  });
  return Array.from(keywordSet).sort();
}
