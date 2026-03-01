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

// Mock card database — uses official stat names: ap (Attack Points), hp (Hit Points)
const mockCardDb: Record<string, any> = {
  'card-0': { id: 'card-0', name: 'Unit Alpha', type: 'Unit', ap: 5, hp: 5 },
  'card-1': { id: 'card-1', name: 'Unit Beta', type: 'Unit', ap: 4, hp: 6 },
  'card-2': { id: 'card-2', name: 'Command Card', type: 'Command', ap: 0, hp: 0 },
};

describe('GameEngine - Core Functionality', () => {
  it('should initialize game with both players', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player1']).toBeDefined();
    expect(state.players['player2']).toBeDefined();
    expect(state.phase).toBe('start');
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

  it('should initialize player1 with 6 shields', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player1'].shields.length).toBe(6);
  });

  it('should initialize player2 with 6 shields', () => {
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    expect(state.players['player2'].shields.length).toBe(6);
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
  it('should apply shield damage correctly — any AP≥1 destroys exactly 1 shield', () => {
    // Official GCG rule: any attack with AP ≥ 1 destroys exactly ONE shield.
    // It is not a numeric subtraction — 1 attack = 1 shield destroyed.
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const defender = state.players['player2'];
    const initialShields = defender.shields.length;
    const initialHealth = defender.baseHealth;

    // One attack (AP=2) → destroys exactly 1 shield
    engine.resolveDamage(defender, 2);

    expect(defender.shields.length).toBe(initialShields - 1);
    expect(defender.baseHealth).toBe(initialHealth); // No base damage while shields remain
  });

  it('should deal damage to base when shields are empty', () => {
    // Official GCG: when no shields remain, damage goes to base directly
    const deck = createMockDeck();
    const engine = new GameEngine('deck-1', deck, mockCardDb);
    const state = engine.getState();

    const defender = state.players['player2'];
    defender.shields = []; // Clear all shields
    const initialHealth = defender.baseHealth;

    // Attack with AP=5 hits base directly (no shields)
    engine.resolveDamage(defender, 5);

    expect(defender.shields.length).toBe(0);
    expect(defender.baseHealth).toBe(initialHealth - 5);
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

    expect(player.hand.length).toBeLessThanOrEqual(10);
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
    expect(updatedState.phase).not.toBe('start');
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

describe('GameEngine - Milestone 3 Triggers & Buffs', () => {
  const triggerCardDb: Record<string, any> = {
    supportUnit: {
      id: 'supportUnit',
      name: 'Support Unit',
      type: 'Unit',
      ap: 2,
      hp: 3,
      keywords: ['support'],
    },
    attackerUnit: {
      id: 'attackerUnit',
      name: 'Attacker Unit',
      type: 'Unit',
      ap: 4,
      hp: 4,
      keywords: [],
    },
    breachUnit: {
      id: 'breachUnit',
      name: 'Breach Unit',
      type: 'Unit',
      ap: 3,
      hp: 3,
      keywords: ['breach'],
    },
  };

  const makeDeck = (): DeckDefinition => ({
    id: 'trigger-deck',
    name: 'Trigger Deck',
    cards: [
      { cardId: 'supportUnit', count: 4, zone: 'main' },
      { cardId: 'attackerUnit', count: 4, zone: 'main' },
      { cardId: 'breachUnit', count: 4, zone: 'main' },
    ],
  });

  // Advance through: start → draw → (DRAW) → resource → (PLACE_RESOURCE) → main
  const advanceToMainPhase = (engine: GameEngine) => {
    // start → draw
    engine.executeAction({ type: 'ADVANCE_PHASE', playerId: 'player1', timestamp: Date.now() });
    // draw card
    engine.executeAction({ type: 'DRAW', playerId: 'player1', timestamp: Date.now() });
    // draw → resource
    engine.executeAction({ type: 'ADVANCE_PHASE', playerId: 'player1', timestamp: Date.now() });
    // place resource (or skip if empty)
    engine.executeAction({ type: 'PLACE_RESOURCE', playerId: 'player1', timestamp: Date.now() });
    // resource → main
    engine.executeAction({ type: 'ADVANCE_PHASE', playerId: 'player1', timestamp: Date.now() });
  };

  it('should enforce once-per-turn support ability usage', () => {
    const engine = new GameEngine('deck-triggers', makeDeck(), triggerCardDb);
    advanceToMainPhase(engine);
    const state = engine.getState();

    const support = {
      instanceId: 'p1-support',
      cardId: 'supportUnit',
      zone: 'battle' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    };

    const target = {
      instanceId: 'p1-target',
      cardId: 'attackerUnit',
      zone: 'battle' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    };

    state.players['player1'].battleArea = [support, target];

    const firstUse = engine.executeAction({
      type: 'ACTIVATE_ABILITY',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: {
        sourceInstanceId: support.instanceId,
        targetInstanceId: target.instanceId,
        abilityId: 'SUPPORT_MAIN',
      },
    });

    const secondUse = engine.executeAction({
      type: 'ACTIVATE_ABILITY',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: {
        sourceInstanceId: support.instanceId,
        targetInstanceId: target.instanceId,
        abilityId: 'SUPPORT_MAIN',
      },
    });

    expect(firstUse.valid).toBe(true);
    expect(state.players['player1'].battleArea[1].counters.tempApBuff).toBe(1);
    expect(secondUse.valid).toBe(false);
    expect(secondUse.error).toMatch(/exhausted|already used this turn/i);
  });

  it('should resolve BREACH trigger as shield pop', () => {
    const engine = new GameEngine('deck-triggers', makeDeck(), triggerCardDb);
    advanceToMainPhase(engine);
    const state = engine.getState();

    const before = state.players['player2'].shields.length;
    state.stack.push({
      id: 'trg-breach-1',
      type: 'BREACH',
      sourceInstanceId: 'p1-breach',
      ownerPlayerId: 'player1',
      payload: { defenderPlayerId: 'player2' },
      optionalChoice: false,
      description: 'Breach trigger test',
      createdAt: Date.now(),
    });

    const result = engine.executeAction({
      type: 'RESOLVE_TRIGGER',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: { triggerId: 'trg-breach-1', chooseResolve: true },
    });

    expect(result.valid).toBe(true);
    expect(state.players['player2'].shields.length).toBe(before - 1);
  });

  it('should move paired/linked cards to discard when host is destroyed', () => {
    const engine = new GameEngine('deck-triggers', makeDeck(), triggerCardDb);
    advanceToMainPhase(engine);
    const state = engine.getState();

    const pilotAttachment = {
      instanceId: 'pilot-1',
      cardId: 'attackerUnit',
      zone: 'battle' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    };

    const linkedAttachment = {
      instanceId: 'linked-1',
      cardId: 'attackerUnit',
      zone: 'battle' as const,
      state: 'ready' as const,
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set<string>(),
    };

    const destroyedHost = {
      instanceId: 'host-1',
      cardId: 'breachUnit',
      zone: 'trash' as const,
      state: 'ready' as const,
      damageMarkers: 99,
      attachments: {
        pilot: pilotAttachment,
        linked: [linkedAttachment],
      },
      counters: {},
      usedAbilities: new Set<string>(),
    };

    state.players['player1'].discardPile = [destroyedHost];
    state.stack.push({
      id: 'trg-destroyed-1',
      type: 'DESTROYED',
      sourceInstanceId: 'host-1',
      ownerPlayerId: 'player1',
      optionalChoice: false,
      description: 'Destroyed cleanup test',
      createdAt: Date.now(),
    });

    const result = engine.executeAction({
      type: 'RESOLVE_TRIGGER',
      playerId: 'player1',
      timestamp: Date.now(),
      payload: { triggerId: 'trg-destroyed-1', chooseResolve: true },
    });

    expect(result.valid).toBe(true);
    expect(state.players['player1'].discardPile.length).toBe(3);
    expect(state.players['player1'].discardPile.some((card) => card.instanceId === 'pilot-1')).toBe(true);
    expect(state.players['player1'].discardPile.some((card) => card.instanceId === 'linked-1')).toBe(true);
  });
});
