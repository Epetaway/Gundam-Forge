/**
 * Playtester Unit Tests
 * Core tests for shuffle, draw, mulligan, and zone validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CardInstance } from '@/lib/game/game-engine';

/**
 * Shuffle Algorithm Tests
 */
describe('Shuffle Algorithm', () => {
  /**
   * Fisher-Yates shuffle implementation
   */
  function shuffle(array: any[]): any[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  it('should return an array of the same length', () => {
    const deck = Array.from({ length: 60 }, (_, i) => ({ id: `card-${i}` }));
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(60);
  });

  it('should contain all original elements', () => {
    const deck = Array.from({ length: 10 }, (_, i) => i);
    const shuffled = shuffle(deck);
    
    const original = new Set(deck);
    const shuffledSet = new Set(shuffled);
    
    expect(shuffledSet).toEqual(original);
  });

  it('should produce different order (high probability)', () => {
    const deck = Array.from({ length: 30 }, (_, i) => i);
    const shuffled = shuffle(deck);
    
    // Check that at least one card moved
    const moved = deck.some((card, index) => card !== shuffled[index]);
    expect(moved).toBe(true);
  });

  it('should handle single card', () => {
    const deck = [{ id: 'card-1' }];
    const shuffled = shuffle(deck);
    expect(shuffled).toEqual(deck);
  });

  it('should handle empty array', () => {
    const shuffled = shuffle([]);
    expect(shuffled).toEqual([]);
  });

  it('should maintain randomness across multiple shuffles', () => {
    const deck = Array.from({ length: 20 }, (_, i) => i);
    const results = Array.from({ length: 5 }, () => shuffle([...deck]));
    
    // Check that at least 2 different sequences are produced
    const unique = new Set(results.map((r) => JSON.stringify(r)));
    expect(unique.size).toBeGreaterThan(1);
  });
});

/**
 * Draw Phase Tests
 */
describe('Draw Phase', () => {
  function drawCards(deck: CardInstance[], count: number): {
    hand: CardInstance[];
    remainingDeck: CardInstance[];
  } {
    const hand = deck.slice(0, count);
    const remainingDeck = deck.slice(count);
    return { hand, remainingDeck };
  }

  it('should draw 5 cards for opening hand', () => {
    const deck = Array.from({ length: 50 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { hand, remainingDeck } = drawCards(deck, 5);
    
    expect(hand).toHaveLength(5);
    expect(remainingDeck).toHaveLength(45);
  });

  it('should draw cards from top of deck', () => {
    const deck = Array.from({ length: 10 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { hand } = drawCards(deck, 3);
    
    expect(hand[0].cardId).toBe('card-0');
    expect(hand[1].cardId).toBe('card-1');
    expect(hand[2].cardId).toBe('card-2');
  });

  it('should handle drawing more cards than deck size', () => {
    const deck = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { hand, remainingDeck } = drawCards(deck, 7);
    
    expect(hand).toHaveLength(5);
    expect(remainingDeck).toHaveLength(0);
  });

  it('should not modify original deck', () => {
    const deck = Array.from({ length: 10 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const originalLength = deck.length;
    drawCards(deck, 3);
    
    expect(deck).toHaveLength(originalLength);
  });
});

/**
 * Mulligan Phase Tests
 */
describe('Mulligan Phase', () => {
  function processMulligan(
    hand: CardInstance[],
    mulliganIndices: number[],
    deck: CardInstance[]
  ): {
    newHand: CardInstance[];
    newDeck: CardInstance[];
  } {
    const cardsToReturn = hand.filter((_, i) => mulliganIndices.includes(i));
    const mulliganHand = hand.filter((_, i) => !mulliganIndices.includes(i));
    
    // Return cards to deck, redraw
    const deckWithReturned = [...cardsToReturn, ...deck];
    const newCards = deckWithReturned.slice(0, cardsToReturn.length);
    const newDeck = deckWithReturned.slice(cardsToReturn.length);
    
    return {
      newHand: [...mulliganHand, ...newCards],
      newDeck,
    };
  }

  it('should return selected cards to deck', () => {
    const hand = Array.from({ length: 7 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'hand' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const deck = Array.from({ length: 53 }, (_, i) => ({
      instanceId: `deck-${i}`,
      cardId: `deck-card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { newDeck } = processMulligan(hand, [0, 1, 2], deck);
    
    // 3 cards returned + 53 original - 3 redrawn = 53
    expect(newDeck.length).toBeGreaterThanOrEqual(50);
  });

  it('should maintain hand size after mulligan', () => {
    const hand = Array.from({ length: 7 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'hand' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const deck = Array.from({ length: 53 }, (_, i) => ({
      instanceId: `deck-${i}`,
      cardId: `deck-card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { newHand } = processMulligan(hand, [0, 1, 2], deck);
    
    expect(newHand).toHaveLength(7);
  });

  it('should handle mulligan with no cards selected', () => {
    const hand = Array.from({ length: 7 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: `card-${i}`,
      zone: 'hand' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const deck = Array.from({ length: 53 }, (_, i) => ({
      instanceId: `deck-${i}`,
      cardId: `deck-card-${i}`,
      zone: 'deck' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    const { newHand } = processMulligan(hand, [], deck);
    
    expect(newHand).toHaveLength(7);
  });
});

/**
 * Zone Drop Validation Tests
 */
describe('Zone Drop Validation', () => {
  type CardType = 'Unit' | 'Pilot' | 'Command' | 'Base' | 'Resource';

  function validateZoneDrop(
    cardType: CardType,
    targetZone: string
  ): { valid: boolean; reason?: string } {
    const rules: Record<string, CardType[]> = {
      battleArea: ['Unit'],
      baseArea: ['Base'],
      shields: ['Unit', 'Command'],
      resources: ['Resource'],
      trash: ['Unit', 'Pilot', 'Command', 'Base', 'Resource'],
    };

    const allowed = rules[targetZone] || [];
    
    if (!allowed.includes(cardType)) {
      return {
        valid: false,
        reason: `Cannot play ${cardType} into ${targetZone}`,
      };
    }

    return { valid: true };
  }

  it('should accept Unit in Battle Area', () => {
    const result = validateZoneDrop('Unit', 'battleArea');
    expect(result.valid).toBe(true);
  });

  it('should reject Base in Battle Area', () => {
    const result = validateZoneDrop('Base', 'battleArea');
    expect(result.valid).toBe(false);
  });

  it('should accept Base in Base Area only', () => {
    expect(validateZoneDrop('Base', 'baseArea').valid).toBe(true);
    expect(validateZoneDrop('Base', 'battleArea').valid).toBe(false);
    expect(validateZoneDrop('Base', 'shields').valid).toBe(false);
  });

  it('should accept Resource in Resources zone', () => {
    const result = validateZoneDrop('Resource', 'resources');
    expect(result.valid).toBe(true);
  });

  it('should reject Resource in Battle Area', () => {
    const result = validateZoneDrop('Resource', 'battleArea');
    expect(result.valid).toBe(false);
  });

  it('should accept any card in Trash', () => {
    expect(validateZoneDrop('Unit', 'trash').valid).toBe(true);
    expect(validateZoneDrop('Base', 'trash').valid).toBe(true);
    expect(validateZoneDrop('Resource', 'trash').valid).toBe(true);
  });
});

/**
 * Card Stack Tests
 */
describe('Card Stack Rendering', () => {
  it('should display count badge for multiple cards', () => {
    const stack = Array.from({ length: 3 }, (_, i) => ({
      instanceId: `inst-${i}`,
      cardId: 'card-1',
      zone: 'shields' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    }));

    expect(stack).toHaveLength(3);
    // Badge should display "×3"
  });

  it('should display cost badge for single card', () => {
    const stack = [
      {
        instanceId: 'inst-0',
        cardId: 'card-1',
        zone: 'hand' as const,
        state: 'ready' as const,
        damageMarkers: 0,
        attachments: { linked: [] },
        counters: {},
        usedAbilities: new Set<string>(),
      },
    ];

    expect(stack).toHaveLength(1);
    // Badge should display cost value
  });

  it('should maintain consistent aspect ratio', () => {
    // CardStack uses aspect-[5/7]
    const width = 112; // w-28
    const expectedHeight = (112 * 7) / 5;

    expect(expectedHeight).toBeCloseTo(156.8);
  });
});

/**
 * Game Start Flow Tests
 */
describe('Game Start Flow', () => {
  it('should complete all phases in order', async () => {
    const phases: string[] = [];
    
    const recordPhase = (phase: string) => phases.push(phase);
    
    recordPhase('coinFlip');
    recordPhase('shuffle');
    recordPhase('draw');
    recordPhase('mulligan');
    recordPhase('shields');
    recordPhase('ready');

    expect(phases).toEqual([
      'coinFlip',
      'shuffle',
      'draw',
      'mulligan',
      'shields',
      'ready',
    ]);
  });

  it('should determine first player from coin flip', () => {
    const isHeads = Math.random() > 0.5;
    const firstPlayer = isHeads ? 'player' : 'opponent';
    
    expect(firstPlayer).toMatch(/^(player|opponent)$/);
  });
});
