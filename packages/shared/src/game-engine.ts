/**
 * Gundam Forge Game Engine
 * Implements the complete game rules and state management
 */

import type { CardDefinition, CardColor, CardType } from './types';

// ===== Game State Types =====

export interface GameCard {
  instanceId: string;
  cardId: string;
  definition: CardDefinition;
  tapped: boolean;
  damage: number;
  attachedCards: GameCard[]; // Pilots attached to Units
  powerModifiers: number[]; // Temporary power bonuses
  hasHaste: boolean;
  hasFirstStrike: boolean;
  hasFlying: boolean;
  hasBeam: boolean;
  armor: number;
  isUnblockable: boolean;
  summoningSickness: boolean; // Can't attack the turn it's played
  metadata: Record<string, unknown>; // For custom effects
}

export type TurnPhase = 
  | 'refresh'
  | 'resource'
  | 'main'
  | 'combat-declare-attackers'
  | 'combat-declare-blockers'
  | 'combat-damage'
  | 'end';

export interface Player {
  id: string;
  name: string;
  lifePoints: number;
  deck: GameCard[];
  hand: GameCard[];
  battlefield: {
    units: GameCard[];
    base: GameCard | null;
  };
  resourcePool: GameCard[]; // Cards used as resources
  discardPile: GameCard[];
  hasPlayedResource: boolean; // Only 1 resource per turn
}

export interface CombatState {
  attackers: Array<{
    attacker: GameCard;
    target: 'player' | 'base';
    isBlocked: boolean;
    blockers: GameCard[];
  }>;
  phase: 'declaring-attackers' | 'declaring-blockers' | 'resolving-damage' | 'complete';
}

export interface GameState {
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  turnNumber: number;
  phase: TurnPhase;
  priority: 0 | 1; // Which player has priority to act
  combat: CombatState | null;
  stack: GameEffect[]; // For instant-speed effects
  gameOver: boolean;
  winner: 0 | 1 | null;
}

export interface GameEffect {
  id: string;
  sourceCard: GameCard;
  controller: 0 | 1;
  effect: () => void;
  description: string;
}

// ===== Color Management =====

export const getCardColors = (card: CardDefinition): CardColor[] => {
  if (card.color === 'Colorless') return [];
  return [card.color];
};

export const canPayCost = (
  player: Player,
  card: CardDefinition
): { canPay: boolean; colorsAvailable: CardColor[] } => {
  const readyResources = player.resourcePool.filter((r) => !r.tapped);
  const colorCounts: Partial<Record<CardColor, number>> = {};
  let colorlessCount = 0;

  // Count available resources
  for (const resource of readyResources) {
    const colors = getCardColors(resource.definition);
    if (colors.length === 0) {
      colorlessCount++;
    } else {
      for (const color of colors) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }
  }

  const requiredColor = card.color;
  const requiredCost = card.cost;

  // Check if we have enough resources of the right color
  if (requiredColor === 'Colorless') {
    return {
      canPay: colorlessCount + Object.values(colorCounts).reduce((a, b) => a + b, 0) >= requiredCost,
      colorsAvailable: Object.keys(colorCounts) as CardColor[]
    };
  }

  const specificColorCount = colorCounts[requiredColor] || 0;
  const totalAvailable = specificColorCount + colorlessCount;

  return {
    canPay: totalAvailable >= requiredCost,
    colorsAvailable: Object.keys(colorCounts) as CardColor[]
  };
};

export const payResourceCost = (player: Player, card: CardDefinition): boolean => {
  const { canPay } = canPayCost(player, card);
  if (!canPay) return false;

  const readyResources = player.resourcePool.filter((r) => !r.tapped);
  const requiredColor = card.color;
  const requiredCost = card.cost;

  let costRemaining = requiredCost;

  // First, tap matching color resources
  if (requiredColor !== 'Colorless') {
    for (const resource of readyResources) {
      if (costRemaining <= 0) break;
      const colors = getCardColors(resource.definition);
      if (colors.includes(requiredColor)) {
        resource.tapped = true;
        costRemaining--;
      }
    }
  }

  // Then tap colorless resources
  for (const resource of readyResources) {
    if (costRemaining <= 0) break;
    if (!resource.tapped) {
      const colors = getCardColors(resource.definition);
      if (colors.length === 0) {
        resource.tapped = true;
        costRemaining--;
      }
    }
  }

  // Finally, tap any remaining resources if needed
  for (const resource of readyResources) {
    if (costRemaining <= 0) break;
    if (!resource.tapped) {
      resource.tapped = true;
      costRemaining--;
    }
  }

  return costRemaining === 0;
};

// ===== Card Power Calculation =====

export const calculateCardPower = (card: GameCard, player: Player): number => {
  let power = card.definition.power ?? 0;

  // Apply attached Pilots
  for (const pilot of card.attachedCards) {
    // Parse pilot text for power bonuses (simplified)
    const text = (pilot.definition.text || '').toLowerCase();
    if (text.includes('+1 power')) power += 1;
    if (text.includes('+2 power')) power += 2;
    if (text.includes('+3 power')) power += 3;
    if (text.includes('+4 power')) power += 4;
  }

  // Apply temporary modifiers
  for (const mod of card.powerModifiers) {
    power += mod;
  }

  // Apply global effects (e.g., Base bonuses)
  if (player.battlefield.base) {
    const baseText = (player.battlefield.base.definition.text || '').toLowerCase();
    if (baseText.includes('your units gain +1 power')) {
      power += 1;
    }
  }

  return Math.max(0, power);
};

// ===== Combat System =====

export interface CombatResult {
  attackerDestroyed: boolean;
  blockerDestroyed: boolean;
  damageToPlayer: number;
  damageToBase: number;
}

export const resolveCombat = (
  attacker: GameCard,
  blocker: GameCard | null,
  attackerPlayer: Player,
  defenderPlayer: Player,
  targetIsBase: boolean
): CombatResult => {
  const result: CombatResult = {
    attackerDestroyed: false,
    blockerDestroyed: false,
    damageToPlayer: 0,
    damageToBase: 0
  };

  const attackerPower = calculateCardPower(attacker, attackerPlayer);

  // Unblocked damage
  if (!blocker) {
    if (targetIsBase && defenderPlayer.battlefield.base) {
      result.damageToBase = attackerPower;
      defenderPlayer.battlefield.base.damage += attackerPower;
      const basePower = defenderPlayer.battlefield.base.definition.power ?? 0;
      if (defenderPlayer.battlefield.base.damage >= basePower) {
        result.blockerDestroyed = true; // Base destroyed
      }
    } else {
      result.damageToPlayer = attackerPower;
      defenderPlayer.lifePoints -= attackerPower;
    }
    return result;
  }

  // Blocked combat
  const blockerPower = calculateCardPower(blocker, defenderPlayer);

  // Handle First Strike
  if (attacker.hasFirstStrike && !blocker.hasFirstStrike) {
    // Attacker deals damage first
    blocker.damage += attackerPower;
    if (blocker.damage >= blockerPower) {
      result.blockerDestroyed = true;
      return result; // Blocker destroyed before it can strike back
    }
    // Blocker survives and strikes back
    attacker.damage += blockerPower;
    if (attacker.damage >= attackerPower) {
      result.attackerDestroyed = true;
    }
  } else if (blocker.hasFirstStrike && !attacker.hasFirstStrike) {
    // Blocker deals damage first
    attacker.damage += blockerPower;
    if (attacker.damage >= attackerPower) {
      result.attackerDestroyed = true;
      return result; // Attacker destroyed before it can strike
    }
    // Attacker survives and strikes
    blocker.damage += attackerPower;
    if (blocker.damage >= blockerPower) {
      result.blockerDestroyed = true;
    }
  } else {
    // Simultaneous damage
    attacker.damage += blockerPower;
    blocker.damage += attackerPower;

    if (attacker.damage >= attackerPower) {
      result.attackerDestroyed = true;
    }
    if (blocker.damage >= blockerPower) {
      result.blockerDestroyed = true;
    }
  }

  return result;
};

// ===== Turn Management =====

export const advancePhase = (state: GameState): TurnPhase => {
  const phaseOrder: TurnPhase[] = [
    'refresh',
    'resource',
    'main',
    'combat-declare-attackers',
    'combat-declare-blockers',
    'combat-damage',
    'end'
  ];

  const currentIndex = phaseOrder.indexOf(state.phase);
  if (currentIndex === phaseOrder.length - 1) {
    // End of turn, move to next player
    return 'refresh';
  }

  return phaseOrder[currentIndex + 1];
};

export const startTurn = (state: GameState): void => {
  const player = state.players[state.activePlayerIndex];

  // Refresh Phase
  for (const card of player.battlefield.units) {
    card.tapped = false;
    card.damage = 0;
    card.summoningSickness = false;
    card.powerModifiers = [];
  }
  for (const resource of player.resourcePool) {
    resource.tapped = false;
  }

  // Draw 1 card
  if (player.deck.length > 0) {
    const drawnCard = player.deck.shift()!;
    player.hand.push(drawnCard);
  } else {
    // Deck out - player loses
    state.gameOver = true;
    state.winner = state.activePlayerIndex === 0 ? 1 : 0;
  }

  // Reset resource play flag
  player.hasPlayedResource = false;

  // Generate Base resources
  if (player.battlefield.base) {
    const baseText = (player.battlefield.base.definition.text || '').toLowerCase();
    // Parse base text for resource generation (simplified)
    if (baseText.includes('generate 2')) {
      // Would add virtual resources here
    }
  }
};

export const endTurn = (state: GameState): void => {
  const player = state.players[state.activePlayerIndex];

  // Discard down to 7 cards
  while (player.hand.length > 7) {
    const discarded = player.hand.pop()!;
    player.discardPile.push(discarded);
  }

  // Switch active player
  state.activePlayerIndex = state.activePlayerIndex === 0 ? 1 : 0;
  state.turnNumber++;
  state.phase = 'refresh';
  state.priority = state.activePlayerIndex;
};

// ===== Game Actions =====

export const playUnit = (
  state: GameState,
  card: GameCard,
  playerIndex: 0 | 1
): { success: boolean; error?: string } => {
  const player = state.players[playerIndex];

  // Check if can pay cost
  if (!payResourceCost(player, card.definition)) {
    return { success: false, error: 'Insufficient resources' };
  }

  // Check battlefield limit (9 units max)
  if (player.battlefield.units.length >= 9) {
    return { success: false, error: 'Battlefield full (9 units max)' };
  }

  // Remove from hand
  player.hand = player.hand.filter((c) => c.instanceId !== card.instanceId);

  // Add to battlefield
  card.tapped = !card.hasHaste;
  card.summoningSickness = !card.hasHaste;
  player.battlefield.units.push(card);

  return { success: true };
};

export const playPilot = (
  state: GameState,
  pilot: GameCard,
  targetUnit: GameCard,
  playerIndex: 0 | 1
): { success: boolean; error?: string } => {
  const player = state.players[playerIndex];

  // Check if can pay cost
  if (!payResourceCost(player, pilot.definition)) {
    return { success: false, error: 'Insufficient resources' };
  }

  // Check if target is a Unit
  if (targetUnit.definition.type !== 'Unit') {
    return { success: false, error: 'Can only attach to Units' };
  }

  // Remove from hand
  player.hand = player.hand.filter((c) => c.instanceId !== pilot.instanceId);

  // Attach to Unit
  targetUnit.attachedCards.push(pilot);

  // Apply Pilot effects (parsed from text)
  const text = (pilot.definition.text || '').toLowerCase();
  if (text.includes('first strike')) {
    targetUnit.hasFirstStrike = true;
  }
  if (text.includes('haste')) {
    targetUnit.hasHaste = true;
    targetUnit.summoningSickness = false;
  }

  return { success: true };
};

export const playCommand = (
  state: GameState,
  command: GameCard,
  playerIndex: 0 | 1
): { success: boolean; error?: string } => {
  const player = state.players[playerIndex];

  // Check if can pay cost
  if (!payResourceCost(player, command.definition)) {
    return { success: false, error: 'Insufficient resources' };
  }

  // Remove from hand
  player.hand = player.hand.filter((c) => c.instanceId !== command.instanceId);

  // Resolve effect (simplified - would need full effect parser)
  // For now, just move to discard
  player.discardPile.push(command);

  return { success: true };
};

export const playBase = (
  state: GameState,
  base: GameCard,
  playerIndex: 0 | 1
): { success: boolean; error?: string } => {
  const player = state.players[playerIndex];

  // Check if can pay cost
  if (!payResourceCost(player, base.definition)) {
    return { success: false, error: 'Insufficient resources' };
  }

  // Remove from hand
  player.hand = player.hand.filter((c) => c.instanceId !== base.instanceId);

  // Replace old Base if exists
  if (player.battlefield.base) {
    player.discardPile.push(player.battlefield.base);
  }

  // Add new Base
  base.tapped = false;
  base.damage = 0;
  player.battlefield.base = base;

  return { success: true };
};

// ===== Win Condition Checks =====

export const checkWinConditions = (state: GameState): void => {
  for (let i = 0; i < 2; i++) {
    const player = state.players[i];
    const opponent = state.players[i === 0 ? 1 : 0];

    // Life points at 0 or below
    if (player.lifePoints <= 0) {
      state.gameOver = true;
      state.winner = i === 0 ? 1 : 0;
      return;
    }

    // Base destruction while at 5 or less life
    if (!player.battlefield.base && player.lifePoints <= 5) {
      state.gameOver = true;
      state.winner = i === 0 ? 1 : 0;
      return;
    }
  }
};

// ===== Utility Functions =====

export const createGameCard = (
  cardDef: CardDefinition,
  instanceId: string
): GameCard => {
  const cardText = (cardDef.text || '').toLowerCase();
  
  return {
    instanceId,
    cardId: cardDef.id,
    definition: cardDef,
    tapped: false,
    damage: 0,
    attachedCards: [],
    powerModifiers: [],
    hasHaste: cardText.includes('haste'),
    hasFirstStrike: cardText.includes('first strike'),
    hasFlying: cardText.includes('flying'),
    hasBeam: cardText.includes('beam'),
    armor: cardText.includes('armor')
      ? parseInt(cardText.match(/armor (\d+)/i)?.[1] || '0')
      : 0,
    isUnblockable: cardText.includes('unblockable') ||
      cardText.includes('cannot be blocked'),
    summoningSickness: true,
    metadata: {}
  };
};

export const initializeGame = (
  player1Deck: CardDefinition[],
  player2Deck: CardDefinition[],
  player1Name = 'Player 1',
  player2Name = 'Player 2'
): GameState => {
  const createPlayer = (name: string, deck: CardDefinition[], id: string): Player => {
    const gameCards = deck.map((card, idx) =>
      createGameCard(card, `${id}-${card.id}-${idx}`)
    );

    // Shuffle deck
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    // Draw starting hand of 7
    const hand = gameCards.splice(0, 7);

    return {
      id,
      name,
      lifePoints: 20,
      deck: gameCards,
      hand,
      battlefield: {
        units: [],
        base: null
      },
      resourcePool: [],
      discardPile: [],
      hasPlayedResource: false
    };
  };

  return {
    players: [
      createPlayer(player1Name, player1Deck, 'p1'),
      createPlayer(player2Name, player2Deck, 'p2')
    ],
    activePlayerIndex: Math.random() < 0.5 ? 0 : 1,
    turnNumber: 1,
    phase: 'refresh',
    priority: 0,
    combat: null,
    stack: [],
    gameOver: false,
    winner: null
  };
};
