import { describe, expect, it } from 'vitest';
import type { CardDefinition } from '../src/types';
import {
  GundamPlaytestEngine,
  MAIN_DECK_SIZE,
  RESOURCE_DECK_SIZE,
  validateConstructedDeck,
  type CardEffectRegistry,
} from '../src/playtest-engine';

const makeUnit = (id: string, overrides: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id,
  color: 'Blue',
  cost: 1,
  type: 'Unit',
  set: 'TST',
  ap: 2,
  hp: 2,
  ...overrides,
});

const makeResource = (id: string, overrides: Partial<CardDefinition> = {}): CardDefinition => ({
  id,
  name: id,
  color: 'Blue',
  cost: 0,
  type: 'Resource',
  set: 'TST',
  ...overrides,
});

const makeDecks = (): { main: CardDefinition[]; resource: CardDefinition[] } => ({
  main: Array.from({ length: MAIN_DECK_SIZE }, (_, i) => makeUnit(`U-${String(i + 1).padStart(3, '0')}`)),
  resource: Array.from({ length: RESOURCE_DECK_SIZE }, (_, i) => makeResource(`R-${String(i + 1).padStart(2, '0')}`)),
});

const setupMainPhase = (effects?: CardEffectRegistry): GundamPlaytestEngine => {
  const p1 = makeDecks();
  const p2 = makeDecks();
  const engine = new GundamPlaytestEngine({
    players: [
      { name: 'P1', mainDeck: p1.main, resourceDeck: p1.resource },
      { name: 'P2', mainDeck: p2.main, resourceDeck: p2.resource },
    ],
    seed: 7,
    effectRegistry: effects,
  });
  expect(engine.advanceToNextPhase().ok).toBe(true);
  expect(engine.advanceToNextPhase().ok).toBe(true);
  expect(engine.advanceToNextPhase().ok).toBe(true);
  expect(engine.state.phase).toBe('main');
  return engine;
};

describe('validateConstructedDeck', () => {
  it('accepts a valid 50/10 two-color list', () => {
    const main = [
      ...Array.from({ length: 25 }, (_, i) => makeUnit(`BL-${i}`, { color: 'Blue' })),
      ...Array.from({ length: 25 }, (_, i) => makeUnit(`RD-${i}`, { color: 'Red' })),
    ];
    const resource = Array.from({ length: 10 }, (_, i) => makeResource(`RS-${i}`, { color: 'Blue' }));
    const result = validateConstructedDeck(main, resource);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects bad size, copies, and 3-color lists', () => {
    const main = [
      ...Array.from({ length: 16 }, (_, i) => makeUnit(`BL-${i}`, { color: 'Blue' })),
      ...Array.from({ length: 16 }, (_, i) => makeUnit(`RD-${i}`, { color: 'Red' })),
      ...Array.from({ length: 16 }, (_, i) => makeUnit(`GR-${i}`, { color: 'Green' })),
      makeUnit('OVER-COPY'),
      makeUnit('OVER-COPY'),
      makeUnit('OVER-COPY'),
      makeUnit('OVER-COPY'),
      makeUnit('OVER-COPY'),
    ];
    const resource = Array.from({ length: 9 }, (_, i) => makeResource(`RS-${i}`));
    const result = validateConstructedDeck(main, resource);

    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toContain('Resource deck must contain exactly');
    expect(result.errors.join(' ')).toContain('exceeds max copies');
    expect(result.errors.join(' ')).toContain('at most 2 non-Colorless colors');
  });
});

describe('GundamPlaytestEngine setup and phases', () => {
  it('initializes hands, shields, base, and second-player EX resource', () => {
    const p1 = makeDecks();
    const p2 = makeDecks();
    const engine = new GundamPlaytestEngine({
      players: [
        { name: 'P1', mainDeck: p1.main, resourceDeck: p1.resource },
        { name: 'P2', mainDeck: p2.main, resourceDeck: p2.resource },
      ],
      seed: 1,
    });

    const one = engine.state.players[0];
    const two = engine.state.players[1];

    expect(one.hand).toHaveLength(5);
    expect(two.hand).toHaveLength(5);
    expect(one.shields).toHaveLength(6);
    expect(two.shields).toHaveLength(6);
    expect(one.mainDeck).toHaveLength(39);
    expect(two.mainDeck).toHaveLength(39);
    expect(one.base).toBeTruthy();
    expect(two.base).toBeTruthy();
    expect(two.resourceArea).toHaveLength(1);
    expect(engine.state.cards[two.resourceArea[0]].tokenType).toBe('ex-resource');
  });

  it('runs start -> draw -> resource -> main and opens priority', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    expect(engine.state.players[active].resourceArea.length).toBeGreaterThanOrEqual(1);
    expect(engine.state.priority?.window).toBe('main');
    expect(engine.state.priority?.currentPlayer).toBe(active);
  });
});

describe('GundamPlaytestEngine gameplay', () => {
  it('enforces level/cost before deployment', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const activePlayer = engine.state.players[active];
    const cardId = activePlayer.hand[0];
    const card = engine.state.cards[cardId];
    card.definition = makeUnit('BIG-UNIT', { cost: 2, level: 2, ap: 3, hp: 3 });

    const fail = engine.playCard(active, cardId);
    expect(fail.ok).toBe(false);
    expect(fail.error).toContain('Need level 2');

    const extraResource = activePlayer.resourceDeck.shift()!;
    activePlayer.resourceArea.push(extraResource);
    engine.state.cards[extraResource].rested = false;

    const success = engine.playCard(active, cardId);
    expect(success.ok).toBe(true);
    expect(activePlayer.battleArea).toContain(cardId);
  });

  it('supports pilot pairing and immediate attack for linked units', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const activePlayer = engine.state.players[active];

    const unitId = activePlayer.hand[0];
    const pilotId = activePlayer.hand[1];

    engine.state.cards[unitId].definition = makeUnit('RX-UNIT', {
      cost: 0,
      level: 0,
      linkCondition: 'amuro',
      ap: 3,
      hp: 3,
    });
    engine.state.cards[pilotId].definition = {
      ...makeUnit('AMURO-PILOT', { cost: 0, level: 0, type: 'Pilot' }),
      name: 'Amuro Ray',
      type: 'Pilot',
      apModifier: 1,
      hpModifier: 1,
    };

    expect(engine.playCard(active, unitId).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.playCard(active, pilotId, { attachToUnitId: unitId }).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);

    const attack = engine.declareAttack(active, unitId, { kind: 'player' });
    expect(attack.ok).toBe(true);
  });

  it('resolves unit combat simultaneously and destroys both when lethal', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const attackerId = engine.state.players[active].hand[0];
    const defenderId = engine.state.players[standby].hand[0];

    engine.state.players[active].hand = engine.state.players[active].hand.filter((id) => id !== attackerId);
    engine.state.players[standby].hand = engine.state.players[standby].hand.filter((id) => id !== defenderId);
    engine.state.players[active].battleArea.push(attackerId);
    engine.state.players[standby].battleArea.push(defenderId);

    engine.state.cards[attackerId].definition = makeUnit('ATK', { ap: 3, hp: 2, cost: 0, level: 0 });
    engine.state.cards[defenderId].definition = makeUnit('DEF', { ap: 2, hp: 3, cost: 0, level: 0 });
    engine.state.cards[attackerId].enteredTurn = engine.state.turn - 1;
    engine.state.cards[attackerId].rested = false;
    engine.state.cards[defenderId].rested = true;

    expect(engine.declareAttack(active, attackerId, { kind: 'unit', unitId: defenderId }).ok).toBe(true);
    expect(engine.declareBlock(standby, null).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);

    expect(engine.state.players[active].battleArea).not.toContain(attackerId);
    expect(engine.state.players[standby].battleArea).not.toContain(defenderId);
    expect(engine.state.players[active].trash).toContain(attackerId);
    expect(engine.state.players[standby].trash).toContain(defenderId);
    expect(engine.state.phase).toBe('main');
  });

  it('destroys shields then defeats player when no base/shields remain', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;

    const firstAttacker = engine.state.players[active].hand[0];
    engine.state.players[active].hand = engine.state.players[active].hand.filter((id) => id !== firstAttacker);
    engine.state.players[active].battleArea.push(firstAttacker);
    engine.state.cards[firstAttacker].definition = makeUnit('SHIELD-BREAK', { ap: 4, hp: 4, cost: 0, level: 0 });
    engine.state.cards[firstAttacker].enteredTurn = engine.state.turn - 1;

    const defender = engine.state.players[standby];
    if (defender.base) {
      defender.trash.push(defender.base);
      defender.base = null;
    }
    defender.shields = defender.shields.slice(0, 1);

    expect(engine.declareAttack(active, firstAttacker, { kind: 'player' }).ok).toBe(true);
    expect(engine.declareBlock(standby, null).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);
    expect(defender.shields).toHaveLength(0);
    expect(engine.state.gameOver).toBe(false);

    const secondAttacker = engine.state.players[active].hand[0];
    engine.state.players[active].hand = engine.state.players[active].hand.filter((id) => id !== secondAttacker);
    engine.state.players[active].battleArea.push(secondAttacker);
    engine.state.cards[secondAttacker].definition = makeUnit('LETHAL', { ap: 2, hp: 2, cost: 0, level: 0 });
    engine.state.cards[secondAttacker].enteredTurn = engine.state.turn - 1;

    expect(engine.declareAttack(active, secondAttacker, { kind: 'player' }).ok).toBe(true);
    expect(engine.declareBlock(standby, null).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.state.gameOver).toBe(true);
    expect(engine.state.winner).toBe(active);
  });

  it('resolves stack in LIFO order with priority passes', () => {
    const effects: CardEffectRegistry = {
      'CMD-DRAW2': {
        onPlay: ({ controller }) => [{ kind: 'draw', player: controller, amount: 2 }],
      },
      'CMD-DRAW1': {
        onPlay: ({ controller }) => [{ kind: 'draw', player: controller, amount: 1 }],
      },
    };

    const engine = setupMainPhase(effects);
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const activeCard = engine.state.players[active].hand[0];
    const standbyCard = engine.state.players[standby].hand[0];

    engine.state.cards[activeCard].definition = {
      ...makeUnit('CMD-DRAW2', { type: 'Command', cost: 0, level: 0 }),
      type: 'Command',
    };
    engine.state.cards[standbyCard].definition = {
      ...makeUnit('CMD-DRAW1', { type: 'Command', cost: 0, level: 0 }),
      type: 'Command',
    };

    const activeHandBefore = engine.state.players[active].hand.length;
    const standbyHandBefore = engine.state.players[standby].hand.length;

    expect(engine.playCard(active, activeCard).ok).toBe(true);
    expect(engine.playCard(standby, standbyCard).ok).toBe(true);
    expect(engine.state.stack).toHaveLength(2);

    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.state.stack).toHaveLength(1);

    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.state.stack).toHaveLength(0);

    expect(engine.state.players[standby].hand.length).toBe(standbyHandBefore);
    expect(engine.state.players[active].hand.length).toBe(activeHandBefore + 1);
  });

  it('requires discard in end phase before turn passes', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const activePlayer = engine.state.players[active];
    const startingTurn = engine.state.turn;

    while (activePlayer.hand.length < 12) {
      const drawn = activePlayer.mainDeck.shift();
      if (!drawn) break;
      activePlayer.hand.push(drawn);
    }

    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.state.phase).toBe('end');

    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.state.pendingHandDiscards).toBe(activePlayer.hand.length - 10);
    expect(engine.state.turn).toBe(startingTurn);

    while (engine.state.pendingHandDiscards > 0) {
      expect(engine.discardForHandLimit(active, activePlayer.hand[0]).ok).toBe(true);
    }

    expect(engine.state.turn).toBe(startingTurn + 1);
    expect(engine.state.activePlayer).toBe(standby);
    expect(engine.state.phase).toBe('start');
  });

  it('applies deck-out loss when draw is required and deck is empty', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;

    engine.state.phase = 'draw';
    engine.state.players[active].mainDeck = [];
    expect(engine.advanceToNextPhase().ok).toBe(true);
    expect(engine.state.gameOver).toBe(true);
    expect(engine.state.winner).toBe(standby);
  });

  it('does not spend resources when an illegal play is attempted', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const player = engine.state.players[active];
    const pilotId = player.hand[0];

    engine.state.cards[pilotId].definition = {
      ...makeUnit('PILOT-ONLY', { type: 'Pilot', cost: 1, level: 1 }),
      type: 'Pilot',
    };

    const activeBefore = player.resourceArea.filter((id) => !engine.state.cards[id].rested).length;
    const result = engine.playCard(active, pilotId, {});
    const activeAfter = player.resourceArea.filter((id) => !engine.state.cards[id].rested).length;

    expect(result.ok).toBe(false);
    expect(result.error).toContain('attachToUnitId');
    expect(activeAfter).toBe(activeBefore);
    expect(player.hand).toContain(pilotId);
  });

  it('infers command effects from text and enforces target requirements', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const activeCard = engine.state.players[active].hand[0];

    engine.state.cards[activeCard].definition = {
      ...makeUnit('CMD-TEXT-DRAW', { type: 'Command', cost: 0, level: 0, text: 'Draw 2 cards.' }),
      type: 'Command',
    };

    const handBefore = engine.state.players[active].hand.length;
    expect(engine.playCard(active, activeCard).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.state.players[active].hand.length).toBe(handBefore + 1);

    const targetCmd = engine.state.players[active].hand[0];
    engine.state.cards[targetCmd].definition = {
      ...makeUnit('CMD-TARGET', { type: 'Command', cost: 0, level: 0, text: 'Deal 2 damage to target unit.' }),
      type: 'Command',
    };

    const failNoTarget = engine.playCard(active, targetCmd);
    expect(failNoTarget.ok).toBe(false);
    expect(failNoTarget.error).toContain('requires a target unit');

    const defenderUnitId = engine.state.players[standby].hand[0];
    engine.state.players[standby].hand = engine.state.players[standby].hand.filter((id) => id !== defenderUnitId);
    engine.state.players[standby].battleArea.push(defenderUnitId);
    engine.state.cards[defenderUnitId].definition = makeUnit('DEF-TARGET', { hp: 5, ap: 1, cost: 0, level: 0 });

    expect(engine.playCard(active, targetCmd, { targetUnitId: defenderUnitId }).ok).toBe(true);
    expect(engine.passPriority(standby).ok).toBe(true);
    expect(engine.passPriority(active).ok).toBe(true);
    expect(engine.state.cards[defenderUnitId].damage).toBe(2);
  });

  it('returns legal actions and excludes illegal card plays', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const standby = active === 0 ? 1 : 0;
    const player = engine.state.players[active];
    const cheapUnitId = player.hand[0];
    const expensiveUnitId = player.hand[1];
    const needsTargetCmdId = player.hand[2];

    engine.state.cards[cheapUnitId].definition = makeUnit('CHEAP', { cost: 1, level: 1, ap: 2, hp: 2 });
    engine.state.cards[expensiveUnitId].definition = makeUnit('EXPENSIVE', { cost: 5, level: 5, ap: 6, hp: 6 });
    engine.state.cards[needsTargetCmdId].definition = {
      ...makeUnit('CMD-NEEDS-TARGET', { type: 'Command', cost: 0, level: 0, text: 'Destroy target unit.' }),
      type: 'Command',
    };

    engine.state.players[standby].battleArea = [];
    const legal = engine.getLegalActions(active).filter((a) => a.kind === 'play-card');
    const legalPlayIds = legal.map((action) => action.handCardId);

    expect(legalPlayIds).toContain(cheapUnitId);
    expect(legalPlayIds).not.toContain(expensiveUnitId);
    expect(legalPlayIds).not.toContain(needsTargetCmdId);
  });

  it('recommends strategic action from current legal actions', () => {
    const engine = setupMainPhase();
    const active = engine.state.activePlayer;
    const attackerId = engine.state.players[active].hand[0];

    engine.state.players[active].hand = [];
    engine.state.players[active].battleArea.push(attackerId);
    engine.state.cards[attackerId].definition = makeUnit('ATTACKER', { cost: 0, level: 0, ap: 3, hp: 3 });
    engine.state.cards[attackerId].enteredTurn = engine.state.turn - 1;
    engine.state.cards[attackerId].rested = false;

    const recommendation = engine.recommendAction(active);
    expect(recommendation).not.toBeNull();
    expect(recommendation?.action.kind).toBe('declare-attack');
  });
});
