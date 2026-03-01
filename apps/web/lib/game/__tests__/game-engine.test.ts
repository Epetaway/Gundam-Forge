import { describe, it, expect } from 'vitest';
import { GameEngine } from '@/lib/game/game-engine';
import { DeckDefinition } from '@/lib/game/game-engine';

// Mock deck definition (creates exactly targetCardCount cards)
const createMockDeck = (targetCardCount: number = 50): DeckDefinition => {
  const cardsNeeded: Array<{ cardId: string; count: number; zone: 'main' }> = [];
  let remaining = targetCardCount;
  let cardIndex = 0;

  while (remaining > 0) {
    const count = Math.min(4, remaining);
    cardsNeeded.push({
      cardId: `card-${cardIndex % 10}`,
      count,
      zone: 'main',
    });
    remaining -= count;
    cardIndex++;
  }

  return {
    id: 'test-deck-1',
    name: 'Test Deck',
    cards: cardsNeeded,
  };
};

// Mock card database
const mockCardDb: Record<string, any> = {
  'card-0': { id: 'card-0', name: 'Unit Alpha', type: 'Unit', atk: 5, def: 5 },
  'card-1': { id: 'card-1', name: 'Unit Beta', type: 'Unit', atk: 4, def: 6 },
  'card-2': { id: 'card-2', name: 'Command Card', type: 'Command', atk: 0, def: 0 },
};

describe('GameEngine - Core Functionality', () => {
  it('should initialize game with both players', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player1']).toBeDefined();
    expect(state.players['player2']).toBeDefined();
    expect(state.phase).toBe('setup');
    expect(state.turnNumber).toBe(1);
  });

  it('should initialize player1 deck with cards from deck definition', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    // Deck should be populated from the deck definition
    expect(state.players['player1'].deck.length).toBeGreaterThan(0);
    expect(state.players['player1'].deck.length).toBeLessThanOrEqual(50);
  });

  it('should initialize player1 with 5 shields', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player1'].shields.length).toBe(5);
  });

  it('should initialize player2 with 4 shields', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player2'].shields.length).toBe(4);
  });

  it('should have both players with 20 base health', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player1'].baseHealth).toBe(20);
    expect(state.players['player2'].baseHealth).toBe(20);
  });
});

describe('GameEngine - Combat Resolution', () => {
  it('should apply shield damage correctly', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const defender = state.players['player2'];
    const initialShields = defender.shields.length;
    const initialHealth = defender.baseHealth;

    engine.resolveDamage(defender, 2);

    expect(defender.shields.length).toBe(initialShields - 2);
    expect(defender.baseHealth).toBe(initialHealth); // No overflow
  });

  it('should overflow damage to base health', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const defender = state.players['player2'];
    const initialHealth = defender.baseHealth;

    // 6 damage = 4 shields + 2 base health
    engine.resolveDamage(defender, 6);

    expect(defender.shields.length).toBe(0);
    expect(defender.baseHealth).toBe(initialHealth - 2);
  });

  it('should end game when base health reaches 0 or below', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const defender = state.players['player2'];
    const initialHealth = defender.baseHealth;
    defender.shields = []; // Clear all shields first

    // Apply damage exceeding base health
    engine.resolveDamage(defender, initialHealth + 5);

    // Get fresh state after damage resolution
    const updatedState = engine.getState();
    expect(updatedState.isGameOver).toBe(true);
    expect(updatedState.phase).toBe('gameOver');
  });
});

describe('GameEngine - Hand Management', () => {
  it('should enforce 7-card hand limit', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const player = state.players['player1'];

    // Add 10 cards to hand
    for (let i = 0; i < 10; i++) {
      player.hand.push({
        instanceId: `card-${i}`,
        cardId: 'card-0',
        zone: 'hand',
        state: 'ready',
        damageMarkers: 0,
        attachments: { linked: [] },
        counters: {},
        usedAbilities: new Set(),
      });
    }

    engine.enforceHandLimit('player1');

    expect(player.hand.length).toBeLessThanOrEqual(7);
  });
});

describe('GameEngine - Game State Logging', () => {
  it('should create game log entries', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);

    const initialLogSize = engine.getLog().length;

    engine.executeAction({
      type: 'ADVANCE_PHASE',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    const updatedLog = engine.getLog();
    expect(updatedLog.length).toBeGreaterThan(initialLogSize);
  });

  it('should include rules trace in log entries', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);

    engine.executeAction({
      type: 'ADVANCE_PHASE',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    const log = engine.getLog();
    const lastEntry = log[log.length - 1];

    expect(lastEntry.rulesTrace).toBeDefined();
    expect(lastEntry.rulesTrace.length).toBeGreaterThan(0);
  });
});

describe('GameEngine - Phase Validation', () => {
  it('should reject DRAW action outside draw phase', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    state.phase = 'main'; // Not draw phase

    const validation = engine.validateAction(state, {
      type: 'DRAW',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    expect(validation.valid).toBe(false);
  });

  it('should reject actions when not your turn', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const validation = engine.validateAction(state, {
      type: 'DRAW',
      playerId: 'player2', // Not the active player
      timestamp: Date.now(),
    });

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('Not your turn');
  });
});

describe('GameEngine - End-to-End', () => {
  it('should successfully initialize and execute actions', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);

    const state = engine.getState();
    expect(state).toBeDefined();
    // Deck should have cards populated from deck definition
    expect(state.players['player1'].deck.length).toBeGreaterThan(0);

    // Execute phase advance
    const result = engine.executeAction({
      type: 'ADVANCE_PHASE',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    expect(result.valid).toBe(true);

    const updatedState = engine.getState();
    expect(updatedState.phase).not.toBe('setup');
  });

  it('should track game progression through log', () => {
    const freshDeck = createMockDeck();
    const engine = new GameEngine('deck-2', freshDeck, mockCardDb);

    const initialLogSize = engine.getLog().length;

    // Execute phase advance
    engine.executeAction({
      type: 'ADVANCE_PHASE',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    const log = engine.getLog();
    expect(log.length).toBeGreaterThan(initialLogSize);

    // Check that most recent action was logged
    const lastEntry = log[log.length - 1];
    expect(lastEntry.actionType).toBe('ADVANCE_PHASE');
  });
});
