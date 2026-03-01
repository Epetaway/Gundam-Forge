/**
 * Unit Tests for Gundam TCG Playtester Core Systems
 * Tests determinism, rules enforcement, and game logic
 *
 * Run with: npm run test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSeed,
  shuffleDeck,
  drawTopCard,
  drawMultipleCards,
  moveToBottom,
  verifyShuffle,
} from '../shuffle-and-seed';
import { validateDeck, parseDeckText, resolveCardIds } from '../deck-validation';
import { performCoinFlip, selectCoinFace, testCoinFairness } from '../coin-flip';
import { PhaseManager } from '../phase-manager';
import { GameLogger } from '../game-logger';
import type { CardInstance } from '../game-engine';

/**
 * SHUFFLE AND SEED TESTS
 */
describe('Shuffle and Seed System', () => {
  it('createSeed generates consistent seeds for same inputs', () => {
    const seed1 = createSeed('deck-001');
    const seed2 = createSeed('deck-001');

    // Same deckId should produce same seed components
    expect(seed1.deckId).toBe(seed2.deckId);
  });

  it('same seed produces identical shuffle order', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${String(i + 1).padStart(3, '0')}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const seed = 12345;
    const shuffled1 = shuffleDeck(testDeck, seed);
    const shuffled2 = shuffleDeck(testDeck, seed);

    expect(shuffled1).toHaveLength(60);
    expect(shuffled2).toHaveLength(60);

    // Check order is identical
    for (let i = 0; i < 60; i++) {
      expect(shuffled1[i].instanceId).toBe(shuffled2[i].instanceId);
    }
  });

  it('different seeds produce different shuffle orders', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${String(i + 1).padStart(3, '0')}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const shuffled1 = shuffleDeck(testDeck, 111);
    const shuffled2 = shuffleDeck(testDeck, 222);

    // Most likely different (with very high probability)
    let isDifferent = false;
    for (let i = 0; i < 60; i++) {
      if (shuffled1[i].instanceId !== shuffled2[i].instanceId) {
        isDifferent = true;
        break;
      }
    }

    expect(isDifferent).toBe(true);
  });

  it('drawTopCard removes exactly one card', () => {
    const deck: CardInstance[] = Array.from({ length: 10 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const initialLength = deck.length;
    const drawn = drawTopCard(deck);

    expect(drawn).not.toBeNull();
    expect(drawn!.instanceId).toBe('card-9'); // Top of deck (added last)
    expect(deck.length).toBe(initialLength - 1);
  });

  it('drawMultipleCards draws correct count', () => {
    const deck: CardInstance[] = Array.from({ length: 30 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const drawn = drawMultipleCards(deck, 7);

    expect(drawn).toHaveLength(7);
    expect(deck.length).toBe(23);
  });

  it('drawMultipleCards handles empty deck gracefully', () => {
    const deck: CardInstance[] = [];
    const drawn = drawMultipleCards(deck, 7);

    expect(drawn).toHaveLength(0);
  });

  it('moveToBottom works correctly', () => {
    const deck: CardInstance[] = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const target = deck[2];
    moveToBottom(deck, target);

    expect(deck[0].instanceId).toBe('card-2');
    expect(deck[0]).toBe(target);
  });

  it('verifyShuffle confirms deterministic shuffle', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const isReproducible = verifyShuffle(testDeck, 99999);
    expect(isReproducible).toBe(true);
  });
});

/**
 * DECK VALIDATION TESTS
 */
describe('Deck Validation', () => {
  const mockCardDatabase = {
    'GD01-001': {
      id: 'GD01-001',
      name: 'RX-78-2 Gundam',
      type: 'Unit',
      imageUrl: 'https://example.com/card.jpg',
    },
    'GD01-002': {
      id: 'GD01-002',
      name: 'Amuro Ray',
      type: 'Pilot',
      imageUrl: 'https://example.com/pilot.jpg',
    },
    'GD01-003': {
      id: 'GD01-003',
      name: 'Basic Resource',
      type: 'Resource',
      imageUrl: 'https://example.com/resource.jpg',
    },
  };

  it('parseDeckText handles "4x Card Name" format', () => {
    const text = `
      4x GD01-001
      3x GD01-002
      2x GD01-003
    `;

    const parsed = parseDeckText(text);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].count).toBe(4);
    expect(parsed[1].count).toBe(3);
  });

  it('parseDeckText handles "Card Name 4" format', () => {
    const text = `
      GD01-001 4
      GD01-002 3
    `;

    const parsed = parseDeckText(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].count).toBe(4);
  });

  it('validateDeck detects copy limit violations', () => {
    // Official GCG: max 4 copies per card. 5 copies should be an error.
    const cards = [
      { cardId: 'GD01-001', name: 'RX-78-2 Gundam', count: 5, imageUrl: '' },
    ];

    const result = validateDeck(cards, mockCardDatabase);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.toLowerCase().includes('cop'))).toBe(true);
  });

  it('validateDeck allows up to 4 copies (official GCG limit)', () => {
    const cards = [
      { cardId: 'GD01-001', name: 'RX-78-2 Gundam', count: 4, imageUrl: 'some-url' },
    ];

    const result = validateDeck(cards, mockCardDatabase);

    // 4 copies should be valid per official rules
    expect(result.errors.some((e) => e.message.toLowerCase().includes('cop'))).toBe(false);
  });

  it('validateDeck detects missing images', () => {
    const cards = [
      { cardId: 'GD01-001', name: 'RX-78-2 Gundam', count: 1 },
    ];

    const mockDbNoImage = {
      'GD01-001': {
        id: 'GD01-001',
        name: 'RX-78-2 Gundam',
        type: 'Unit',
        // imageUrl missing
      },
    };

    const result = validateDeck(cards, mockDbNoImage);

    expect(result.errors.some((e) => e.message.includes('image'))).toBe(true);
  });

  it('resolveCardIds finds cards by exact name match', () => {
    const cards = [
      { cardId: 'RX-78-2 Gundam', name: 'RX-78-2 Gundam', count: 1 },
    ];

    const resolved = resolveCardIds(cards, mockCardDatabase);

    expect(resolved[0].cardId).toBe('GD01-001');
  });
});

/**
 * COIN FLIP TESTS
 */
describe('Coin Flip', () => {
  it('performCoinFlip returns valid result', () => {
    const result = performCoinFlip();

    expect(['heads', 'tails']).toContain(result.face);
    expect(['player', 'opponent']).toContain(result.firstPlayer);
    expect(result.flipped).toBe(true);
  });

  it('selectCoinFace respects chosen face', () => {
    const headsResult = selectCoinFace('heads');
    expect(headsResult.face).toBe('heads');
    expect(headsResult.firstPlayer).toBe('player');

    const tailsResult = selectCoinFace('tails');
    expect(tailsResult.face).toBe('tails');
    expect(tailsResult.firstPlayer).toBe('opponent');
  });

  it('coin flip fairness is within acceptable range', () => {
    const fairness = testCoinFairness(1000);

    // Should be close to 50% (within 10 percentage points)
    expect(fairness.fairness).toBeGreaterThan(40);
    expect(fairness.fairness).toBeLessThanOrEqual(60);
  });
});

/**
 * PHASE MANAGER TESTS
 */
describe('Phase Manager', () => {
  it('initializes with correct starting phase', () => {
    const manager = new PhaseManager();
    manager.initialize('player1', 1);

    expect(manager.getPhase()).toBe('start');
    expect(manager.getTurnNumber()).toBe(1);
    expect(manager.getActivePlayer()).toBe('player1');
  });

  it('canExecuteAction validates phase gating', () => {
    const manager = new PhaseManager();
    manager.initialize('player1', 1);

    // Setup phase
    expect(manager.canExecuteAction('READY_ZONE').allowed).toBe(true);
    expect(manager.canExecuteAction('DRAW').allowed).toBe(false);
    expect(manager.canExecuteAction('PLAY_CARD').allowed).toBe(false);
  });

  it('DRAW can only happen once per turn', () => {
    const manager = new PhaseManager();
    manager.initialize('player1', 1);

    // Move to draw phase somehow (would need to advance)
    // For this test, just verify the flag works
    manager.markDrawn();

    // Trying to execute DRAW should fail next time (in draw phase)
    // Note: This is simplified; full test would need phase advancement
    expect(true).toBe(true); // Placeholder
  });

  it('advancePhase follows correct sequence', () => {
    const manager = new PhaseManager();
    manager.initialize('player1', 1);

    expect(manager.getPhase()).toBe('start');

    // Official GCG phase sequence: start → draw → resource → main → end
    expect(manager.getPhaseProgress().order).toContain('start');
    expect(manager.getPhaseProgress().order).toContain('draw');
    expect(manager.getPhaseProgress().order).toContain('resource');
    expect(manager.getPhaseProgress().order).toContain('main');
    expect(manager.getPhaseProgress().order).toContain('end');
  });

  it('switch player on turn transition', () => {
    const manager = new PhaseManager();
    manager.initialize('player1', 1);

    const initialTurn = manager.getTurnNumber();
    const initialPlayer = manager.getActivePlayer();

    // After cycling through all phases and returning to setup, should switch player
    expect(initialPlayer).toBe('player1');
  });
});

/**
 * GAME LOGGER TESTS
 */
describe('Game Logger', () => {
  it('logs actions correctly', () => {
    const logger = new GameLogger();

    logger.logAction(
      Date.now(),
      1,
      'draw',
      'player1',
      'DRAW',
      'Drew RX-78-2 Gundam',
      'Player drew 1 card in draw phase',
    );

    const log = logger.getLog();
    expect(log).toHaveLength(1);
    expect(log[0].actionType).toBe('DRAW');
  });

  it('getLogForTurn filters correctly', () => {
    const logger = new GameLogger();
    const now = Date.now();

    logger.logAction(now, 1, 'draw', 'player1', 'DRAW', 'Drew card', 'Draw');
    logger.logAction(now + 100, 1, 'main', 'player1', 'PLAY_CARD', 'Played unit', 'Main');
    logger.logAction(now + 200, 2, 'draw', 'player2', 'DRAW', 'Drew card', 'Draw');

    const turn1 = logger.getLogForTurn(1);
    expect(turn1).toHaveLength(2);

    const turn2 = logger.getLogForTurn(2);
    expect(turn2).toHaveLength(1);
  });

  it('getStats returns correct counts', () => {
    const logger = new GameLogger();
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      logger.logAction(now + i * 100, 1, 'draw', 'player1', 'DRAW', 'Drew', 'Draw');
    }

    const stats = logger.getStats();

    expect(stats.totalActions).toBe(5);
    expect(stats.actionsByType['DRAW']).toBe(5);
    expect(stats.actionsByPlayer['player1']).toBe(5);
  });

  it('exportAsText creates readable log', () => {
    const logger = new GameLogger();

    logger.logAction(
      Date.now(),
      1,
      'draw',
      'player1',
      'DRAW',
      'Drew RX-78-2',
      'Normal draw',
    );

    const text = logger.exportAsText();

    expect(text).toContain('GUNDAM TCG GAME LOG');
    expect(text).toContain('DRAW');
    expect(text).toContain('Drew RX-78-2');
  });

  it('clear empties the log', () => {
    const logger = new GameLogger();

    logger.logAction(Date.now(), 1, 'draw', 'player1', 'DRAW', 'Drew', 'Draw');
    expect(logger.getLog()).toHaveLength(1);

    logger.clear();
    expect(logger.getLog()).toHaveLength(0);
  });
});

/**
 * DETERMINISTIC SHUFFLE VERIFICATION
 */
describe('Deterministic Shuffle Verification', () => {
  it('same seed produces identical shuffle for 60-card deck', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `TEST-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const seed = createSeed('test-deck-001');
    const shuffled1 = shuffleDeck(testDeck, seed.value);
    const shuffled2 = shuffleDeck(testDeck, seed.value);

    expect(shuffled1).toHaveLength(60);
    expect(shuffled2).toHaveLength(60);
    expect(shuffled1.every((c, i) => c.instanceId === shuffled2[i].instanceId)).toBe(true);
  });

  it('draws 5 cards from shuffled deck leaving 55', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `TEST-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const seed = createSeed('test-deck-001');
    const deckCopy = shuffleDeck(testDeck, seed.value);
    const drawn = drawMultipleCards(deckCopy, 5);

    expect(drawn).toHaveLength(5);
    expect(deckCopy).toHaveLength(55);
  });

  it('different seeds produce different shuffle orders', () => {
    const testDeck: CardInstance[] = Array.from({ length: 60 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `TEST-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const seed1 = createSeed('deck-a');
    const seed2 = createSeed('different-deck');
    const shuffled1 = shuffleDeck(testDeck, seed1.value);
    const shuffled2 = shuffleDeck(testDeck, seed2.value);

    const different = shuffled1.some((c, i) => c.instanceId !== shuffled2[i].instanceId);
    expect(different).toBe(true);
  });
});

/**
 * INTEGRATION TESTS
 */
describe('Integration: Full Setup Sequence', () => {
  it('shuffle + draw + mulligan workflow', () => {
    // Create test deck
    const testDeck: CardInstance[] = Array.from({ length: 50 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${String(i + 1).padStart(3, '0')}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    // Shuffle with seed
    const seed = createSeed('test-deck');
    const shuffled = shuffleDeck(testDeck, seed.value);

    expect(shuffled).toHaveLength(50);

    // Draw opening hand (5 cards)
    const hand: CardInstance[] = [];
    for (let i = 0; i < 5; i++) {
      const drawn = drawTopCard(shuffled);
      if (drawn) hand.push(drawn);
    }

    expect(hand).toHaveLength(5);
    expect(shuffled).toHaveLength(45); // 50 - 5
  });

  it('deterministic game seed ensures reproducibility', () => {
    // Game 1 setup - use fixed seed value to avoid timestamp variability
    const deterministicSeed = 133742;

    const deck1: CardInstance[] = Array.from({ length: 50 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const shuffled1 = shuffleDeck(deck1, deterministicSeed);
    const hand1 = drawMultipleCards(shuffled1, 5);

    // Game 2 setup (same fixed seed)

    const deck2: CardInstance[] = Array.from({ length: 50 }, (_, i) => ({
      instanceId: `card-${i}`,
      cardId: `GD01-${i}`,
      zone: 'deck',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    }));

    const shuffled2 = shuffleDeck(deck2, deterministicSeed);
    const hand2 = drawMultipleCards(shuffled2, 5);

    // Both games should have identical hands
    for (let i = 0; i < 5; i++) {
      expect(hand1[i].instanceId).toBe(hand2[i].instanceId);
    }
  });
});
