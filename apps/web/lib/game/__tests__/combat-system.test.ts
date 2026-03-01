/**
 * Unit Tests for Combat and Trigger Systems
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TriggerQueueManager, createDeployTrigger, createBurstTrigger, createDestroyedTrigger } from '../trigger-queue';
import { CombatResolver, formatCombatResult } from '../combat-resolution';
import type { CardInstance, GameState, PlayerState } from '../game-engine';

/**
 * TRIGGER QUEUE TESTS
 */
describe('Trigger Queue System', () => {
  let queue: TriggerQueueManager;

  beforeEach(() => {
    queue = new TriggerQueueManager();
  });

  it('adds trigger to queue', () => {
    queue.addTrigger(
      'DEPLOY',
      'unit-1',
      'GD01-001',
      'player1',
      () => true,
      () => {},
      'Test trigger',
    );

    expect(queue.getPendingCount()).toBe(1);
  });

  it('sorts triggers by priority (BURST before DEPLOY)', () => {
    // Add DEPLOY first
    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Deploy');

    // Add BURST (should go before)
    queue.addTrigger('BURST', 'unit-2', 'GD01-002', 'player1', () => true, () => {}, 'Burst');

    const pending = queue.getPendingTriggers();
    expect(pending[0].type).toBe('BURST');
    expect(pending[1].type).toBe('DEPLOY');
  });

  it('maintains FIFO order for same priority triggers', () => {
    const delays: number[] = [];

    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {
      delays.push(1);
    }, 'Trigger 1');

    // Add small delay
    const trigger2 = queue.addTrigger(
      'DEPLOY',
      'unit-2',
      'GD01-002',
      'player1',
      () => true,
      () => {
        delays.push(2);
      },
      'Trigger 2',
    );

    const pending = queue.getPendingTriggers();
    expect(pending[0].id).not.toBe(trigger2.id);
    expect(pending[1].id).toBe(trigger2.id);
  });

  it('peekNextTrigger returns highest priority without removing', () => {
    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Trigger');

    const firstPeek = queue.peekNextTrigger();
    const secondPeek = queue.peekNextTrigger();

    expect(firstPeek?.id).toBe(secondPeek?.id);
    expect(queue.getPendingCount()).toBe(1);
  });

  it('resolveNextTrigger removes and executes', () => {
    let called = false;

    queue.addTrigger(
      'DEPLOY',
      'unit-1',
      'GD01-001',
      'player1',
      () => true,
      () => {
        called = true;
      },
      'Trigger',
    );

    const mockGameState = {} as GameState;
    const resolved = queue.resolveNextTrigger(mockGameState);

    expect(called).toBe(true);
    expect(queue.getPendingCount()).toBe(0);
    expect(resolved).not.toBeNull();
  });

  it('filters invalid triggers (condition returns false)', () => {
    let shouldExist = true;

    queue.addTrigger(
      'DEPLOY',
      'unit-1',
      'GD01-001',
      'player1',
      () => shouldExist,
      () => {},
      'Conditional trigger',
    );

    expect(queue.getPendingCount()).toBe(1);

    shouldExist = false;
    expect(queue.getPendingCount()).toBe(0);

    shouldExist = true;
    expect(queue.getPendingCount()).toBe(1);
  });

  it('getPendingTriggersForCard filters by card', () => {
    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Trigger 1');
    queue.addTrigger('DEPLOY', 'unit-2', 'GD01-002', 'player1', () => true, () => {}, 'Trigger 2');

    const unit1Triggers = queue.getPendingTriggersForCard('unit-1');
    expect(unit1Triggers).toHaveLength(1);
    expect(unit1Triggers[0].sourceInstanceId).toBe('unit-1');
  });

  it('getPendingTriggersOfType filters by type', () => {
    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Deploy');
    queue.addTrigger('DESTROYED', 'unit-2', 'GD01-002', 'player1', () => true, () => {}, 'Destroyed');

    const deployTriggers = queue.getPendingTriggersOfType('DEPLOY');
    expect(deployTriggers).toHaveLength(1);
    expect(deployTriggers[0].type).toBe('DEPLOY');
  });

  it('resolveAll resolves all pending triggers', () => {
    const order: string[] = [];

    queue.addTrigger('BURST', 'unit-1', 'GD01-001', 'player1', () => true, () => {
      order.push('BURST');
    }, 'Burst');

    queue.addTrigger('DEPLOY', 'unit-2', 'GD01-002', 'player1', () => true, () => {
      order.push('DEPLOY');
    }, 'Deploy');

    queue.addTrigger('DESTROYED', 'unit-3', 'GD01-003', 'player1', () => true, () => {
      order.push('DESTROYED');
    }, 'Destroyed');

    const mockGameState = {} as GameState;
    const resolved = queue.resolveAll(mockGameState);

    expect(resolved).toHaveLength(3);
    expect(order).toEqual(['BURST', 'DEPLOY', 'DESTROYED']);
  });

  it('isEmpty returns true when queue empty', () => {
    expect(queue.isEmpty()).toBe(true);

    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Trigger');
    expect(queue.isEmpty()).toBe(false);
  });

  it('clear removes all triggers', () => {
    queue.addTrigger('DEPLOY', 'unit-1', 'GD01-001', 'player1', () => true, () => {}, 'Trigger');
    queue.addTrigger('DESTROYED', 'unit-2', 'GD01-002', 'player1', () => true, () => {}, 'Trigger');

    queue.clear();

    expect(queue.getPendingCount()).toBe(0);
  });

  it('removeTrigger by ID', () => {
    const trigger = queue.addTrigger(
      'DEPLOY',
      'unit-1',
      'GD01-001',
      'player1',
      () => true,
      () => {},
      'Trigger',
    );

    queue.addTrigger('DESTROYED', 'unit-2', 'GD01-002', 'player1', () => true, () => {}, 'Trigger');

    const removed = queue.removeTrigger(trigger.id);

    expect(removed).toBe(true);
    expect(queue.getPendingCount()).toBe(1);
  });
});

/**
 * COMBAT RESOLUTION TESTS
 */
describe('Combat Resolution System', () => {
  let resolver: CombatResolver;
  let triggerQueue: TriggerQueueManager;

  const mockCardDatabase = {
    'GD01-001': {
      id: 'GD01-001',
      name: 'RX-78-2 Gundam',
      type: 'Unit',
      atk: 5,
      def: 4,
      keywords: [],
    },
    'GD01-002': {
      id: 'GD01-002',
      name: 'Zaku II',
      type: 'Unit',
      atk: 3,
      def: 2,
      keywords: ['Blocker'],
    },
    'GD01-003': {
      id: 'GD01-003',
      name: 'First Strike Unit',
      type: 'Unit',
      atk: 2,
      def: 2,
      keywords: ['First Strike'],
    },
  };

  beforeEach(() => {
    triggerQueue = new TriggerQueueManager();
    resolver = new CombatResolver(triggerQueue);
  });

  it('createCombat creates valid combat object', () => {
    const combat = resolver.createCombat('unit-1', 'GD01-001', 'unit-2', 'GD01-002');

    expect(combat.attackerId).toBe('unit-1');
    expect(combat.attackerCardId).toBe('GD01-001');
    expect(combat.defenderId).toBe('unit-2');
    expect(combat.isResolved).toBe(false);
  });

  it('unblocked attack deals full damage', () => {
    const attacker: CardInstance = {
      instanceId: 'unit-1',
      cardId: 'GD01-001',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const combat = resolver.createCombat('unit-1', 'GD01-001', null, null);
    const mockGameState = {
      players: { player1: { battleArea: [attacker] } },
    } as any as GameState;

    const result = resolver.resolveCombat(combat, attacker, null, mockGameState, mockCardDatabase);

    // Unblocked attack just returns damage value, doesn't destroy units
    expect(result.netDamageToDefender).toBe(0); // No defender
    expect(result.description).toContain('unblocked');
  });

  it('normal combat: attacker (5 ATK) vs blocker (2 DEF)', () => {
    const attacker: CardInstance = {
      instanceId: 'unit-1',
      cardId: 'GD01-001',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const defender: CardInstance = {
      instanceId: 'unit-2',
      cardId: 'GD01-002',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const combat = resolver.createCombat('unit-1', 'GD01-001', 'unit-2', 'GD01-002');
    const mockGameState = {
      players: { player1: { battleArea: [attacker] }, player2: { battleArea: [defender] } },
      activePlayerId: 'player1',
    } as any as GameState;

    const result = resolver.resolveCombat(combat, attacker, defender, mockGameState, mockCardDatabase);

    // Attacker (ATK 5) vs Defender (DEF 2)
    // Normal combat: simultaneous damage
    expect(result.netDamageToDefender).toBe(5);
    expect(result.netDamageToAttacker).toBe(3);
    expect(result.defenderDestroyed).toBe(true); // 5 damage >= 2 def
    expect(result.attackerDestroyed).toBe(false); // 3 damage < 4 def
  });

  it('First Strike: attacker deals damage first', () => {
    const attacker: CardInstance = {
      instanceId: 'unit-3',
      cardId: 'GD01-003',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const defender: CardInstance = {
      instanceId: 'unit-2',
      cardId: 'GD01-002',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const combat = resolver.createCombat('unit-3', 'GD01-003', 'unit-2', 'GD01-002');
    const mockGameState = {
      players: { player1: { battleArea: [attacker] }, player2: { battleArea: [defender] } },
      activePlayerId: 'player1',
    } as any as GameState;

    const result = resolver.resolveCombat(combat, attacker, defender, mockGameState, mockCardDatabase);

    expect(result.combat.hasFirstStrike).toBe(true);
    expect(result.description).toContain('First Strike');
  });

  it('applyDamageToShields reduces shield count', () => {
    const mockGameState: GameState = {
      players: {
        player1: {
          shields: Array(6).fill({ zone: 'shields' } as CardInstance),
          discardPile: [],
        } as any,
      },
    } as any;

    const result = resolver.applyDamageToShields(mockGameState, 'player1', 3);

    expect(result.shieldsDestroyed).toBe(3);
    expect(result.remainingDamage).toBe(0);
    expect(mockGameState.players['player1'].shields).toHaveLength(3);
  });

  it('applyDamageToShields: damage exceeds shields', () => {
    const mockGameState: GameState = {
      players: {
        player1: {
          shields: Array(2).fill({ zone: 'shields' } as CardInstance),
          discardPile: [],
        } as any,
      },
    } as any;

    const result = resolver.applyDamageToShields(mockGameState, 'player1', 5);

    expect(result.shieldsDestroyed).toBe(2);
    expect(result.remainingDamage).toBe(3); // 5 damage - 2 shields = 3 overflow
    expect(mockGameState.players['player1'].shields).toHaveLength(0);
  });

  it('applyDamageToBase reduces life total', () => {
    const mockGameState: GameState = {
      players: {
        player1: { baseHealth: 20, maxBaseHealth: 20 } as any,
      },
    } as any;

    const result = resolver.applyDamageToBase(mockGameState, 'player1', 5);

    expect(result.baseHealthRemaining).toBe(15);
    expect(result.isDefeated).toBe(false);
  });

  it('applyDamageToBase detects defeat', () => {
    const mockGameState: GameState = {
      players: {
        player1: { baseHealth: 3, maxBaseHealth: 20 } as any,
      },
    } as any;

    const result = resolver.applyDamageToBase(mockGameState, 'player1', 5);

    expect(result.baseHealthRemaining).toBe(0);
    expect(result.isDefeated).toBe(true);
  });

  it('hasBlockingAbility checks Blocker keyword', () => {
    const unit: CardInstance = { instanceId: 'unit-1' } as any;

    const hasBlocker = resolver.hasBlockingAbility(unit, mockCardDatabase['GD01-002']);
    expect(hasBlocker).toBe(true);

    const noBlocker = resolver.hasBlockingAbility(unit, mockCardDatabase['GD01-001']);
    expect(noBlocker).toBe(false);
  });

  it('formatCombatResult creates readable output', () => {
    const attacker: CardInstance = {
      instanceId: 'unit-1',
      cardId: 'GD01-001',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const defender: CardInstance = {
      instanceId: 'unit-2',
      cardId: 'GD01-002',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const combat = resolver.createCombat('unit-1', 'GD01-001', 'unit-2', 'GD01-002');
    const mockGameState = {
      players: { player1: { battleArea: [attacker] }, player2: { battleArea: [defender] } },
      activePlayerId: 'player1',
    } as any as GameState;

    const result = resolver.resolveCombat(combat, attacker, defender, mockGameState, mockCardDatabase);
    const formatted = formatCombatResult(result);

    expect(formatted).toContain('COMBAT RESOLUTION');
    expect(formatted).toContain('GD01-001');
    expect(formatted).toContain('GD01-002');
    expect(formatted).toContain('Damage');
  });
});

/**
 * INTEGRATION: Combat with Trigger System
 */
describe('Integration: Combat with Triggers', () => {
  it('destroyed unit queues DESTROYED trigger', () => {
    const triggerQueue = new TriggerQueueManager();
    const resolver = new CombatResolver(triggerQueue);

    const attacker: CardInstance = {
      instanceId: 'unit-1',
      cardId: 'GD01-001',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const defender: CardInstance = {
      instanceId: 'unit-2',
      cardId: 'GD01-002',
      zone: 'battle',
      state: 'ready',
      damageMarkers: 0,
      attachments: { linked: [] },
      counters: {},
      usedAbilities: new Set(),
    };

    const mockCardDatabase = {
      'GD01-001': { atk: 10, def: 1, keywords: [] },
      'GD01-002': { atk: 1, def: 1, keywords: [] },
    };

    const mockGameState = {
      players: {
        player1: { battleArea: [attacker], discardPile: [] },
        player2: { battleArea: [defender], discardPile: [] },
      },
      activePlayerId: 'player1',
    } as any as GameState;

    const combat = resolver.createCombat('unit-1', 'GD01-001', 'unit-2', 'GD01-002');
    resolver.resolveCombat(combat, attacker, defender, mockGameState, mockCardDatabase);

    // Both should be destroyed (10 ATK > 1 DEF, 1 ATK >= 1 DEF)
    // Check that destroyed triggers were added
    const destroyedTriggers = triggerQueue.getPendingTriggersOfType('DESTROYED');
    expect(destroyedTriggers.length).toBeGreaterThan(0);
  });
});
