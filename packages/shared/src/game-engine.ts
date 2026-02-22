/**
 * Gundam Card Game - Official Rules Engine (Ver. 1.5.0)
 *
 * Implements the comprehensive game rules for the Gundam Card Game.
 * Designed for solo goldfish playtest with architecture supporting future AI.
 */

import type { CardDefinition } from './types';
import { getCardAP, getCardHP, getCardLevel } from './types';

// ── Card Instance ──────────────────────────────────────────────

export interface GameCard {
  instanceId: string;
  cardId: string;
  definition: CardDefinition;
  active: boolean;          // Active (upright) vs Rested (sideways) (Rule 5-4)
  damage: number;           // Damage counters (Rule 5-18)
  pairedPilot: GameCard | null;   // Pilot beneath this Unit (Rule 3-3)
  pairedUnitId: string | null;    // Unit this Pilot is paired with
  deployedThisTurn: boolean;      // Summoning sickness (Rule 3-2-4)
  isLinked: boolean;        // Pilot satisfies link condition (Rule 3-2-6-2)
  isToken: boolean;
  tokenType?: 'ex-base' | 'ex-resource' | 'unit' | 'base' | 'resource';
  faceDown: boolean;        // For shields (Rule 4-6-4-1)
}

// ── Turn Phases (Rule 7-1) ─────────────────────────────────────

export type TurnPhase =
  | 'setup'
  | 'start-active'     // Start Phase: Active Step (7-2-3)
  | 'start-step'       // Start Phase: Start Step (7-2-4)
  | 'draw'             // Draw Phase (7-3)
  | 'resource'         // Resource Phase (7-4)
  | 'main'             // Main Phase (7-5)
  | 'battle-attack'    // Battle: Attack Step (8-2)
  | 'battle-block'     // Battle: Block Step (8-3)
  | 'battle-action'    // Battle: Action Step (8-4)
  | 'battle-damage'    // Battle: Damage Step (8-5)
  | 'battle-end'       // Battle: Battle End Step (8-6)
  | 'end-action'       // End Phase: Action Step (7-6-3)
  | 'end-step'         // End Phase: End Step (7-6-4)
  | 'end-hand'         // End Phase: Hand Step (7-6-5)
  | 'end-cleanup';     // End Phase: Cleanup Step (7-6-6)

export const PHASE_LABELS: Record<TurnPhase, string> = {
  'setup': 'Setup',
  'start-active': 'Start Phase: Active Step',
  'start-step': 'Start Phase: Start Step',
  'draw': 'Draw Phase',
  'resource': 'Resource Phase',
  'main': 'Main Phase',
  'battle-attack': 'Battle: Attack Step',
  'battle-block': 'Battle: Block Step',
  'battle-action': 'Battle: Action Step',
  'battle-damage': 'Battle: Damage Step',
  'battle-end': 'Battle: Battle End Step',
  'end-action': 'End Phase: Action Step',
  'end-step': 'End Phase: End Step',
  'end-hand': 'End Phase: Hand Step',
  'end-cleanup': 'End Phase: Cleanup Step',
};

/** Non-battle main phase flow */
export const MAIN_PHASE_ORDER: TurnPhase[] = [
  'start-active', 'start-step', 'draw', 'resource', 'main',
  'end-action', 'end-step', 'end-hand', 'end-cleanup',
];

/** Battle sub-phases */
export const BATTLE_PHASE_ORDER: TurnPhase[] = [
  'battle-attack', 'battle-block', 'battle-action', 'battle-damage', 'battle-end',
];

// ── Shield Area (Rule 4-6) ─────────────────────────────────────

export interface ShieldArea {
  shields: GameCard[];       // Face-down shield cards
  base: GameCard | null;     // Base section (max 1) (Rule 4-6-3)
}

// ── Player State ───────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  isPlayerOne: boolean;
  deck: GameCard[];            // Main deck face-down (Rule 4-2)
  resourceDeck: GameCard[];    // Resource deck face-down (Rule 4-3)
  hand: GameCard[];            // Hand, private (Rule 4-8)
  resourceArea: GameCard[];    // Resources, public (Rule 4-4) max 15
  battleArea: GameCard[];      // Units, public (Rule 4-5) max 6
  shieldArea: ShieldArea;      // Shields + Base (Rule 4-6)
  trash: GameCard[];           // Discard pile, public (Rule 4-9)
  removalArea: GameCard[];     // Removed cards, public (Rule 4-7)
  defeated: boolean;
}

// ── Battle State (Rule 8) ──────────────────────────────────────

export interface BattleState {
  attackerId: string;
  targetType: 'player' | 'unit';
  targetUnitId?: string;
  blockerId?: string;
}

// ── Game State ─────────────────────────────────────────────────

export interface GameState {
  players: [Player, Player];
  activePlayerIndex: 0 | 1;
  turnNumber: number;
  phase: TurnPhase;
  battle: BattleState | null;
  gameOver: boolean;
  winner: 0 | 1 | null;
  log: string[];
}

// ── Constants ──────────────────────────────────────────────────

export const STARTING_HAND_SIZE = 5;       // Rule 6-2-1-5
export const SHIELD_COUNT = 6;             // Rule 6-2-2
export const MAX_HAND_SIZE = 10;           // Rule 4-8-4
export const MAX_BATTLE_AREA = 6;          // Rule 4-5-4
export const MAX_RESOURCES = 15;           // Rule 4-4-2
export const MAX_EX_RESOURCES = 5;         // Rule 4-4-2-1
export const MAX_BASE_SECTION = 1;         // Rule 4-6-3
export const SHIELD_HP = 1;               // Rule 11-3-1-1
export const EX_BASE_AP = 0;              // Rule 5-17-3-1-1
export const EX_BASE_HP = 3;              // Rule 5-17-3-1-1

// ── Card Creation ──────────────────────────────────────────────

let _nextId = 1;

export const createGameCard = (
  definition: CardDefinition,
  prefix: string,
  options?: { isToken?: boolean; tokenType?: GameCard['tokenType']; faceDown?: boolean }
): GameCard => ({
  instanceId: `${prefix}-${definition.id}-${_nextId++}`,
  cardId: definition.id,
  definition,
  active: true,
  damage: 0,
  pairedPilot: null,
  pairedUnitId: null,
  deployedThisTurn: false,
  isLinked: false,
  isToken: options?.isToken ?? false,
  tokenType: options?.tokenType,
  faceDown: options?.faceDown ?? false,
});

export const createEXBase = (prefix: string): GameCard => {
  const def: CardDefinition = {
    id: 'EX-BASE',
    name: 'EX Base',
    color: 'Colorless',
    cost: 0,
    type: 'Base',
    set: 'Token',
    ap: EX_BASE_AP,
    hp: EX_BASE_HP,
    text: 'Starting base. 0 AP / 3 HP.',
  };
  return createGameCard(def, prefix, { isToken: true, tokenType: 'ex-base' });
};

export const createEXResource = (prefix: string): GameCard => {
  const def: CardDefinition = {
    id: 'EX-RESOURCE',
    name: 'EX Resource',
    color: 'Colorless',
    cost: 0,
    type: 'Resource',
    set: 'Token',
    text: 'Temporary resource. Removed when used.',
  };
  return createGameCard(def, prefix, { isToken: true, tokenType: 'ex-resource' });
};

// ── Shuffle ────────────────────────────────────────────────────

export const shuffleCards = <T>(cards: T[]): T[] => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ── Game Initialization (Rule 6) ──────────────────────────────

export const initializeGame = (
  p1MainDeck: CardDefinition[],
  p1ResourceDeck: CardDefinition[],
  p2MainDeck: CardDefinition[],
  p2ResourceDeck: CardDefinition[],
  p1Name = 'Player 1',
  p2Name = 'Player 2',
): GameState => {
  _nextId = 1;

  const createPlayer = (
    name: string,
    mainDeck: CardDefinition[],
    resDeck: CardDefinition[],
    id: string,
    isPlayerOne: boolean,
  ): Player => {
    // Create and shuffle main deck
    const deck = shuffleCards(mainDeck.map(d => createGameCard(d, id)));

    // Draw starting hand of 5 (Rule 6-2-1-5)
    const hand = deck.splice(0, STARTING_HAND_SIZE);

    // Place top 6 cards as shields (Rule 6-2-2)
    const shields = deck.splice(0, SHIELD_COUNT).map(c => ({ ...c, faceDown: true }));

    // Resource deck (Rule 6-2-1-3)
    const resourceDeck = resDeck.map(d => createGameCard(d, `${id}-res`));

    // EX Base token (Rule 6-2-3)
    const exBase = createEXBase(id);

    // EX Resource for Player 2 (Rule 6-2-4)
    const resourceArea: GameCard[] = [];
    if (!isPlayerOne) {
      resourceArea.push(createEXResource(id));
    }

    return {
      id,
      name,
      isPlayerOne,
      deck,
      resourceDeck,
      hand,
      resourceArea,
      battleArea: [],
      shieldArea: { shields, base: exBase },
      trash: [],
      removalArea: [],
      defeated: false,
    };
  };

  const state: GameState = {
    players: [
      createPlayer(p1Name, p1MainDeck, p1ResourceDeck, 'p1', true),
      createPlayer(p2Name, p2MainDeck, p2ResourceDeck, 'p2', false),
    ],
    activePlayerIndex: 0, // Player 1 goes first (Rule 6-2-5)
    turnNumber: 1,
    phase: 'start-active',
    battle: null,
    gameOver: false,
    winner: null,
    log: ['Game started. Player 1 goes first.'],
  };

  return state;
};

/**
 * Simplified init for solo goldfish: generates placeholder resource deck
 * if none provided, and sets up a dummy opponent.
 */
export const initializeSoloGame = (
  mainDeck: CardDefinition[],
  resourceDeck?: CardDefinition[],
  playerName = 'Player',
): GameState => {
  // Generate 10 placeholder resources if not provided
  const resDeck: CardDefinition[] = resourceDeck ?? Array.from({ length: 10 }, (_, i) => ({
    id: `RES-${String(i + 1).padStart(2, '0')}`,
    name: `Resource ${i + 1}`,
    color: 'Colorless' as const,
    cost: 0,
    type: 'Resource' as const,
    set: 'Token',
    text: 'Basic resource.',
  }));

  // Dummy opponent deck (empty placeholder for goldfish)
  const dummyDeck: CardDefinition[] = Array.from({ length: 50 }, (_, i) => ({
    id: `DUMMY-${String(i + 1).padStart(3, '0')}`,
    name: `Opponent Card ${i + 1}`,
    color: 'Colorless' as const,
    cost: 1,
    type: 'Unit' as const,
    set: 'Dummy',
    ap: 1,
    hp: 1,
  }));

  const dummyResourceDeck: CardDefinition[] = Array.from({ length: 10 }, (_, i) => ({
    id: `DUMMY-RES-${String(i + 1).padStart(2, '0')}`,
    name: `Opponent Resource ${i + 1}`,
    color: 'Colorless' as const,
    cost: 0,
    type: 'Resource' as const,
    set: 'Dummy',
  }));

  return initializeGame(mainDeck, resDeck, dummyDeck, dummyResourceDeck, playerName, 'Opponent');
};

// ── Getters ────────────────────────────────────────────────────

export const getActivePlayer = (state: GameState): Player =>
  state.players[state.activePlayerIndex];

export const getStandbyPlayer = (state: GameState): Player =>
  state.players[state.activePlayerIndex === 0 ? 1 : 0];

export const getStandbyPlayerIndex = (state: GameState): 0 | 1 =>
  state.activePlayerIndex === 0 ? 1 : 0;

/** Count total active (untapped) resources for a player */
export const countActiveResources = (player: Player): number =>
  player.resourceArea.filter(r => r.active).length;

/** Count total resources (for level check) */
export const countTotalResources = (player: Player): number =>
  player.resourceArea.length;

/** Get a card's effective AP including pilot modifiers */
export const getEffectiveAP = (card: GameCard): number => {
  let ap = getCardAP(card.definition);
  if (card.pairedPilot) {
    ap += card.pairedPilot.definition.apModifier ?? getCardAP(card.pairedPilot.definition);
  }
  return Math.max(0, ap);
};

/** Get a card's effective HP including pilot modifiers */
export const getEffectiveHP = (card: GameCard): number => {
  let hp = getCardHP(card.definition);
  if (card.pairedPilot) {
    hp += card.pairedPilot.definition.hpModifier ?? getCardHP(card.pairedPilot.definition);
  }
  return Math.max(0, hp);
};

/** Get remaining HP (effective HP minus damage) */
export const getRemainingHP = (card: GameCard): number =>
  Math.max(0, getEffectiveHP(card) - card.damage);

// ── Find Card Across All Zones ─────────────────────────────────

export interface CardLocation {
  card: GameCard;
  playerIndex: 0 | 1;
  zone: 'deck' | 'resourceDeck' | 'hand' | 'resourceArea' | 'battleArea' | 'shields' | 'base' | 'trash' | 'removalArea';
}

export const findCard = (state: GameState, instanceId: string): CardLocation | null => {
  for (let pi = 0; pi < 2; pi++) {
    const player = state.players[pi as 0 | 1];
    const idx = pi as 0 | 1;

    for (const card of player.deck) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'deck' };
    }
    for (const card of player.resourceDeck) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'resourceDeck' };
    }
    for (const card of player.hand) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'hand' };
    }
    for (const card of player.resourceArea) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'resourceArea' };
    }
    for (const card of player.battleArea) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'battleArea' };
      if (card.pairedPilot?.instanceId === instanceId) {
        return { card: card.pairedPilot, playerIndex: idx, zone: 'battleArea' };
      }
    }
    for (const card of player.shieldArea.shields) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'shields' };
    }
    if (player.shieldArea.base?.instanceId === instanceId) {
      return { card: player.shieldArea.base, playerIndex: idx, zone: 'base' };
    }
    for (const card of player.trash) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'trash' };
    }
    for (const card of player.removalArea) {
      if (card.instanceId === instanceId) return { card, playerIndex: idx, zone: 'removalArea' };
    }
  }
  return null;
};

// ── Phase Advancement ──────────────────────────────────────────

/**
 * Advance to the next phase in the turn flow.
 * Returns the updated game state with the new phase applied.
 */
export const advancePhase = (state: GameState): GameState => {
  const newState = { ...state };
  const player = getActivePlayer(newState);

  // If in battle, advance through battle phases
  if (BATTLE_PHASE_ORDER.includes(newState.phase)) {
    const idx = BATTLE_PHASE_ORDER.indexOf(newState.phase);
    if (idx < BATTLE_PHASE_ORDER.length - 1) {
      newState.phase = BATTLE_PHASE_ORDER[idx + 1];
    } else {
      // Battle ends, return to main phase
      newState.phase = 'main';
      newState.battle = null;
    }
    return newState;
  }

  // Normal phase advancement
  const idx = MAIN_PHASE_ORDER.indexOf(newState.phase);
  if (idx === -1) return newState;

  if (idx < MAIN_PHASE_ORDER.length - 1) {
    const nextPhase = MAIN_PHASE_ORDER[idx + 1];
    newState.phase = nextPhase;

    // Auto-execute phase actions
    switch (nextPhase) {
      case 'start-active':
        // Active Step: Set all rested cards to active (Rule 7-2-3)
        for (const unit of player.battleArea) {
          unit.active = true;
          unit.deployedThisTurn = false;
        }
        for (const resource of player.resourceArea) {
          resource.active = true;
        }
        if (player.shieldArea.base) {
          player.shieldArea.base.active = true;
        }
        newState.log = [...newState.log, `Turn ${newState.turnNumber}: Active Step - All cards set to active.`];
        break;

      case 'draw':
        // Draw Phase: Draw 1 card (Rule 7-3-1)
        if (player.deck.length > 0) {
          const drawn = player.deck.shift()!;
          player.hand.push(drawn);
          newState.log = [...newState.log, `Turn ${newState.turnNumber}: Drew ${drawn.definition.name}.`];
        } else {
          // Deck out = defeat (Rule 7-3-1-1)
          player.defeated = true;
          newState.gameOver = true;
          newState.winner = getStandbyPlayerIndex(newState);
          newState.log = [...newState.log, `Turn ${newState.turnNumber}: ${player.name} has no cards in deck - defeated!`];
        }
        break;

      case 'resource':
        // Resource Phase: Place 1 resource from resource deck (Rule 7-4-1)
        if (player.resourceDeck.length > 0 && player.resourceArea.length < MAX_RESOURCES) {
          const resource = player.resourceDeck.shift()!;
          resource.active = true;
          player.resourceArea.push(resource);
          newState.log = [...newState.log, `Turn ${newState.turnNumber}: Placed ${resource.definition.name} as resource.`];
        }
        break;

      case 'end-hand':
        // Hand Step: Discard down to 10 (Rule 7-6-5)
        if (player.hand.length > MAX_HAND_SIZE) {
          const excess = player.hand.length - MAX_HAND_SIZE;
          newState.log = [...newState.log, `Turn ${newState.turnNumber}: Hand exceeds limit. Discard ${excess} card(s).`];
        }
        break;
    }
  } else {
    // End of turn: switch active player (Rule 7-6-7)
    newState.activePlayerIndex = getStandbyPlayerIndex(newState);
    newState.turnNumber++;
    newState.phase = 'start-active';
    newState.battle = null;

    // Auto-execute active step for new turn
    const newPlayer = getActivePlayer(newState);
    for (const unit of newPlayer.battleArea) {
      unit.active = true;
      unit.deployedThisTurn = false;
    }
    for (const resource of newPlayer.resourceArea) {
      resource.active = true;
    }
    if (newPlayer.shieldArea.base) {
      newPlayer.shieldArea.base.active = true;
    }
    newState.log = [...newState.log, `Turn ${newState.turnNumber}: ${newPlayer.name}'s turn begins. Active Step complete.`];
  }

  return newState;
};

// ── Game Actions ───────────────────────────────────────────────

export interface ActionResult {
  success: boolean;
  error?: string;
  state: GameState;
}

/** Check if a player can play a card (level and cost check) (Rule 7-5-2-2) */
export const canPlayCard = (player: Player, card: CardDefinition): { canPlay: boolean; error?: string } => {
  const level = getCardLevel(card);
  const totalResources = countTotalResources(player);
  if (totalResources < level) {
    return { canPlay: false, error: `Need ${level} resources (have ${totalResources}) to meet level requirement.` };
  }

  const activeResources = countActiveResources(player);
  if (activeResources < card.cost) {
    return { canPlay: false, error: `Need ${card.cost} active resources to pay cost (have ${activeResources} active).` };
  }

  return { canPlay: true };
};

/** Rest resources to pay a cost (Rule 7-5-2-2-3) */
export const payResourceCost = (player: Player, cost: number): boolean => {
  if (cost <= 0) return true;

  const activeResources = player.resourceArea.filter(r => r.active);
  if (activeResources.length < cost) return false;

  // Rest the required number of resources
  let remaining = cost;
  for (const resource of player.resourceArea) {
    if (remaining <= 0) break;
    if (resource.active) {
      // EX Resources are removed when used (Rule 5-17-3-2-3)
      if (resource.tokenType === 'ex-resource') {
        player.resourceArea = player.resourceArea.filter(r => r.instanceId !== resource.instanceId);
      } else {
        resource.active = false;
      }
      remaining--;
    }
  }

  return remaining === 0;
};

/** Deploy a Unit from hand to battle area (Rule 3-2-1, 7-5-2) */
export const deployUnit = (state: GameState, instanceId: string): ActionResult => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);

  if (newState.phase !== 'main') {
    return { success: false, error: 'Can only deploy units during main phase.', state };
  }

  const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
  if (cardIndex === -1) return { success: false, error: 'Card not in hand.', state };

  const card = player.hand[cardIndex];
  if (card.definition.type !== 'Unit') {
    return { success: false, error: 'Only Unit cards can be deployed.', state };
  }

  // Check cost
  const check = canPlayCard(player, card.definition);
  if (!check.canPlay) return { success: false, error: check.error, state };

  // Check battle area limit (Rule 4-5-4, 11-4)
  if (player.battleArea.length >= MAX_BATTLE_AREA) {
    return { success: false, error: `Battle area full (max ${MAX_BATTLE_AREA} units).`, state };
  }

  // Pay cost
  if (!payResourceCost(player, card.definition.cost)) {
    return { success: false, error: 'Failed to pay resource cost.', state };
  }

  // Remove from hand and add to battle area
  player.hand.splice(cardIndex, 1);
  card.active = true;
  card.deployedThisTurn = true;
  player.battleArea.push(card);

  newState.log.push(`Deployed ${card.definition.name} to battle area.`);
  return { success: true, state: newState };
};

/** Pair a Pilot with a Unit (Rule 3-3, 7-5-2) */
export const pairPilot = (
  state: GameState,
  pilotInstanceId: string,
  targetUnitId: string,
): ActionResult => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);

  if (newState.phase !== 'main') {
    return { success: false, error: 'Can only pair pilots during main phase.', state };
  }

  const pilotIndex = player.hand.findIndex(c => c.instanceId === pilotInstanceId);
  if (pilotIndex === -1) return { success: false, error: 'Pilot not in hand.', state };

  const pilot = player.hand[pilotIndex];
  if (pilot.definition.type !== 'Pilot' && pilot.definition.type !== 'Command') {
    return { success: false, error: 'Only Pilots (or Commands with Pilot effects) can be paired.', state };
  }

  const unit = player.battleArea.find(u => u.instanceId === targetUnitId);
  if (!unit) return { success: false, error: 'Target unit not in battle area.', state };

  // Check if unit already has a pilot (Rule 3-3-4)
  if (unit.pairedPilot) {
    return { success: false, error: 'Unit already has a pilot paired.', state };
  }

  // Check cost
  const check = canPlayCard(player, pilot.definition);
  if (!check.canPlay) return { success: false, error: check.error, state };

  // Pay cost
  if (!payResourceCost(player, pilot.definition.cost)) {
    return { success: false, error: 'Failed to pay resource cost.', state };
  }

  // Remove from hand and pair
  player.hand.splice(pilotIndex, 1);
  pilot.pairedUnitId = unit.instanceId;
  unit.pairedPilot = pilot;

  // Check link condition (Rule 3-2-6)
  if (unit.definition.linkCondition) {
    const linkCondition = unit.definition.linkCondition.toLowerCase();
    const pilotName = pilot.definition.name.toLowerCase();
    unit.isLinked = pilotName.includes(linkCondition);

    if (unit.isLinked) {
      // Link Units can attack immediately (Rule 3-2-6-3)
      unit.deployedThisTurn = false;
      newState.log.push(`${pilot.definition.name} linked with ${unit.definition.name}! Can attack immediately.`);
    }
  }

  newState.log.push(`Paired ${pilot.definition.name} with ${unit.definition.name}.`);
  return { success: true, state: newState };
};

/** Play a Command card (Rule 3-4, 7-5-2) */
export const playCommand = (state: GameState, instanceId: string): ActionResult => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);

  if (newState.phase !== 'main' && newState.phase !== 'battle-action' && newState.phase !== 'end-action') {
    return { success: false, error: 'Cannot play commands in this phase.', state };
  }

  const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
  if (cardIndex === -1) return { success: false, error: 'Card not in hand.', state };

  const card = player.hand[cardIndex];
  if (card.definition.type !== 'Command') {
    return { success: false, error: 'Not a Command card.', state };
  }

  // Check cost
  const check = canPlayCard(player, card.definition);
  if (!check.canPlay) return { success: false, error: check.error, state };

  // Pay cost
  if (!payResourceCost(player, card.definition.cost)) {
    return { success: false, error: 'Failed to pay resource cost.', state };
  }

  // Remove from hand, place in trash (Rule 3-4-4)
  player.hand.splice(cardIndex, 1);
  player.trash.push(card);

  newState.log.push(`Played command ${card.definition.name}.`);
  return { success: true, state: newState };
};

/** Deploy a Base (Rule 3-5, 7-5-2) */
export const deployBase = (state: GameState, instanceId: string): ActionResult => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);

  if (newState.phase !== 'main') {
    return { success: false, error: 'Can only deploy bases during main phase.', state };
  }

  const cardIndex = player.hand.findIndex(c => c.instanceId === instanceId);
  if (cardIndex === -1) return { success: false, error: 'Card not in hand.', state };

  const card = player.hand[cardIndex];
  if (card.definition.type !== 'Base') {
    return { success: false, error: 'Not a Base card.', state };
  }

  // Check cost
  const check = canPlayCard(player, card.definition);
  if (!check.canPlay) return { success: false, error: check.error, state };

  // Pay cost
  if (!payResourceCost(player, card.definition.cost)) {
    return { success: false, error: 'Failed to pay resource cost.', state };
  }

  // Remove from hand
  player.hand.splice(cardIndex, 1);

  // Replace existing base (Rule 11-5-2) - old base goes to trash, not destroyed
  if (player.shieldArea.base) {
    player.trash.push(player.shieldArea.base);
  }

  card.active = true;
  card.damage = 0;
  player.shieldArea.base = card;

  newState.log.push(`Deployed base ${card.definition.name}.`);
  return { success: true, state: newState };
};

// ── Combat System (Rule 8) ─────────────────────────────────────

/** Declare an attack (Rule 8-2) */
export const declareAttack = (
  state: GameState,
  attackerId: string,
  target: { kind: 'player' } | { kind: 'unit'; unitId: string },
): ActionResult => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);
  const opponent = getStandbyPlayer(newState);

  if (newState.phase !== 'main') {
    return { success: false, error: 'Can only attack during main phase.', state };
  }

  const attacker = player.battleArea.find(u => u.instanceId === attackerId);
  if (!attacker) return { success: false, error: 'Attacking unit not found.', state };

  if (!attacker.active) {
    return { success: false, error: 'Unit must be active to attack.', state };
  }

  // Summoning sickness check (Rule 3-2-4) - unless Link Unit (Rule 3-2-6-3)
  if (attacker.deployedThisTurn && !attacker.isLinked) {
    return { success: false, error: 'Unit cannot attack the turn it was deployed (unless linked).', state };
  }

  // Validate target
  if (target.kind === 'unit') {
    const targetUnit = opponent.battleArea.find(u => u.instanceId === target.unitId);
    if (!targetUnit) return { success: false, error: 'Target unit not found.', state };
    // Can only attack rested enemy units (Rule 8-1)
    if (targetUnit.active) {
      return { success: false, error: 'Can only attack rested enemy units.', state };
    }
  }

  // Rest the attacker (Rule 8-2-1)
  attacker.active = false;

  // Enter battle
  newState.phase = 'battle-attack';
  newState.battle = {
    attackerId: attacker.instanceId,
    targetType: target.kind === 'player' ? 'player' : 'unit',
    targetUnitId: target.kind === 'unit' ? target.unitId : undefined,
  };

  const targetName = target.kind === 'player' ? opponent.name : 'enemy unit';
  newState.log.push(`${attacker.definition.name} attacks ${targetName}!`);
  return { success: true, state: newState };
};

/** Declare a block (Rule 8-3) */
export const declareBlock = (state: GameState, blockerId: string): ActionResult => {
  const newState = { ...state, log: [...state.log] };

  if (newState.phase !== 'battle-block' || !newState.battle) {
    return { success: false, error: 'Not in block step.', state };
  }

  const opponent = getStandbyPlayer(newState);
  const blocker = opponent.battleArea.find(u => u.instanceId === blockerId);
  if (!blocker) return { success: false, error: 'Blocker not found.', state };

  if (!blocker.active) {
    return { success: false, error: 'Blocker must be active.', state };
  }

  // Rest the blocker (Rule 8-3-1)
  blocker.active = false;
  newState.battle.blockerId = blocker.instanceId;

  newState.log.push(`${blocker.definition.name} blocks!`);
  return { success: true, state: newState };
};

/** Resolve battle damage (Rule 8-5) */
export const resolveBattleDamage = (state: GameState): ActionResult => {
  const newState = { ...state, log: [...state.log] };

  if (newState.phase !== 'battle-damage' || !newState.battle) {
    return { success: false, error: 'Not in damage step.', state };
  }

  const player = getActivePlayer(newState);
  const opponent = getStandbyPlayer(newState);

  const attacker = player.battleArea.find(u => u.instanceId === newState.battle!.attackerId);
  if (!attacker) {
    // Attacker was removed, skip damage
    newState.phase = 'battle-end';
    return { success: true, state: newState };
  }

  const attackerAP = getEffectiveAP(attacker);

  if (newState.battle.targetType === 'player') {
    // Attack on a Player (Rule 8-5-2)
    const shield = opponent.shieldArea;

    if (shield.base) {
      // Damage goes to base first (Rule 8-5-2-4)
      shield.base.damage += attackerAP;
      newState.log.push(`${attacker.definition.name} deals ${attackerAP} damage to ${opponent.name}'s base.`);

      // Check if base is destroyed
      const baseHP = getEffectiveHP(shield.base);
      if (shield.base.damage >= baseHP) {
        opponent.trash.push(shield.base);
        shield.base = null;
        newState.log.push(`${opponent.name}'s base is destroyed!`);
      }
    } else if (shield.shields.length > 0) {
      // Damage to top shield (Rule 8-5-2-3)
      const topShield = shield.shields.shift()!;
      topShield.faceDown = false;
      opponent.trash.push(topShield);
      newState.log.push(
        `${attacker.definition.name} destroys a shield! (${shield.shields.length} shields remaining) ` +
        `Revealed: ${topShield.definition.name}`
      );

      // Check for Burst effect
      const text = (topShield.definition.text ?? '').toLowerCase();
      if (text.includes('burst')) {
        newState.log.push(`Shield has a Burst effect! (Manual activation)`);
      }
    } else {
      // No shields, no base = player defeated (Rule 1-2-2-1)
      opponent.defeated = true;
      newState.gameOver = true;
      newState.winner = state.activePlayerIndex;
      newState.log.push(`${attacker.definition.name} deals ${attackerAP} battle damage to ${opponent.name}! ${opponent.name} is defeated!`);
    }
  } else {
    // Attack on a Unit (Rule 8-5-3)
    const targetId = newState.battle.blockerId ?? newState.battle.targetUnitId;
    const target = opponent.battleArea.find(u => u.instanceId === targetId);

    if (!target) {
      newState.phase = 'battle-end';
      return { success: true, state: newState };
    }

    const targetAP = getEffectiveAP(target);

    // Simultaneous damage (Rule 8-5-3-2)
    target.damage += attackerAP;
    attacker.damage += targetAP;

    newState.log.push(
      `${attacker.definition.name} (AP ${attackerAP}) battles ${target.definition.name} (AP ${targetAP}).`
    );

    // Check destruction
    const attackerHP = getEffectiveHP(attacker);
    const targetHP = getEffectiveHP(target);

    if (attacker.damage >= attackerHP) {
      // Move attacker to trash
      player.battleArea = player.battleArea.filter(u => u.instanceId !== attacker.instanceId);
      if (attacker.pairedPilot) player.trash.push(attacker.pairedPilot);
      player.trash.push(attacker);
      newState.log.push(`${attacker.definition.name} is destroyed!`);
    }

    if (target.damage >= targetHP) {
      // Move target to trash
      opponent.battleArea = opponent.battleArea.filter(u => u.instanceId !== target.instanceId);
      if (target.pairedPilot) opponent.trash.push(target.pairedPilot);
      opponent.trash.push(target);
      newState.log.push(`${target.definition.name} is destroyed!`);
    }
  }

  newState.phase = 'battle-end';
  return { success: true, state: newState };
};

// ── Manual Actions for Goldfish Mode ───────────────────────────

/** Draw cards from deck */
export const drawCards = (state: GameState, playerIndex: 0 | 1, count: number): GameState => {
  const newState = { ...state, log: [...state.log] };
  const player = newState.players[playerIndex];

  const drawCount = Math.min(count, player.deck.length);
  for (let i = 0; i < drawCount; i++) {
    const card = player.deck.shift()!;
    player.hand.push(card);
  }

  if (drawCount > 0) {
    newState.log.push(`${player.name} drew ${drawCount} card(s). (${player.deck.length} remaining)`);
  }

  // Check deck-out (Rule 1-2-2-2)
  if (player.deck.length === 0) {
    player.defeated = true;
    newState.gameOver = true;
    newState.winner = playerIndex === 0 ? 1 : 0;
    newState.log.push(`${player.name} has no cards remaining in deck - defeated!`);
  }

  return newState;
};

/** Mulligan (Rule 6-2-1-6) - Return hand to bottom of deck, draw 5, shuffle */
export const mulligan = (state: GameState, playerIndex: 0 | 1): GameState => {
  const newState = { ...state, log: [...state.log] };
  const player = newState.players[playerIndex];

  // Return hand to bottom of deck
  player.deck.push(...player.hand);
  player.hand = [];

  // Draw 5 new cards
  player.deck = shuffleCards(player.deck);
  const drawn = player.deck.splice(0, STARTING_HAND_SIZE);
  player.hand = drawn;

  newState.log.push(`${player.name} mulliganed. Drew ${drawn.length} new cards.`);
  return newState;
};

/** Toggle active/rested state of a card */
export const toggleActive = (state: GameState, instanceId: string): GameState => {
  const newState = { ...state };

  for (const player of newState.players) {
    for (const card of player.battleArea) {
      if (card.instanceId === instanceId) {
        card.active = !card.active;
        return newState;
      }
    }
    for (const card of player.resourceArea) {
      if (card.instanceId === instanceId) {
        card.active = !card.active;
        return newState;
      }
    }
    if (player.shieldArea.base?.instanceId === instanceId) {
      player.shieldArea.base.active = !player.shieldArea.base.active;
      return newState;
    }
  }
  return newState;
};

/** Add damage to a card */
export const addDamage = (state: GameState, instanceId: string, amount: number): GameState => {
  const newState = { ...state, log: [...state.log] };

  for (const player of newState.players) {
    for (const card of player.battleArea) {
      if (card.instanceId === instanceId) {
        card.damage += amount;
        newState.log.push(`${card.definition.name} takes ${amount} damage. (${card.damage} total)`);

        // Check destruction (Rule 11-3-1)
        if (card.damage >= getEffectiveHP(card)) {
          player.battleArea = player.battleArea.filter(u => u.instanceId !== instanceId);
          if (card.pairedPilot) player.trash.push(card.pairedPilot);
          player.trash.push(card);
          newState.log.push(`${card.definition.name} is destroyed!`);
        }
        return newState;
      }
    }

    if (player.shieldArea.base?.instanceId === instanceId) {
      player.shieldArea.base.damage += amount;
      const baseHP = getEffectiveHP(player.shieldArea.base);
      newState.log.push(`Base takes ${amount} damage. (${player.shieldArea.base.damage}/${baseHP})`);

      if (player.shieldArea.base.damage >= baseHP) {
        player.trash.push(player.shieldArea.base);
        player.shieldArea.base = null;
        newState.log.push(`Base is destroyed!`);
      }
      return newState;
    }
  }
  return newState;
};

/** Recover HP (Rule 5-6) */
export const recoverHP = (state: GameState, instanceId: string, amount: number): GameState => {
  const newState = { ...state, log: [...state.log] };

  for (const player of newState.players) {
    for (const card of player.battleArea) {
      if (card.instanceId === instanceId && card.damage > 0) {
        const recovered = Math.min(amount, card.damage);
        card.damage -= recovered;
        newState.log.push(`${card.definition.name} recovers ${recovered} HP. (${card.damage} damage remaining)`);
        return newState;
      }
    }
  }
  return newState;
};

/** Destroy a card and send to trash */
export const destroyCard = (state: GameState, instanceId: string): GameState => {
  const newState = { ...state, log: [...state.log] };

  for (const player of newState.players) {
    const unitIdx = player.battleArea.findIndex(u => u.instanceId === instanceId);
    if (unitIdx !== -1) {
      const unit = player.battleArea[unitIdx];
      player.battleArea.splice(unitIdx, 1);
      if (unit.pairedPilot) player.trash.push(unit.pairedPilot);
      player.trash.push(unit);
      newState.log.push(`${unit.definition.name} is destroyed!`);
      return newState;
    }

    if (player.shieldArea.base?.instanceId === instanceId) {
      player.trash.push(player.shieldArea.base);
      player.shieldArea.base = null;
      newState.log.push(`Base is destroyed!`);
      return newState;
    }
  }
  return newState;
};

/** Move a card to hand (for manual manipulation) */
export const returnToHand = (state: GameState, instanceId: string): GameState => {
  const newState = { ...state, log: [...state.log] };

  for (const player of newState.players) {
    const unitIdx = player.battleArea.findIndex(u => u.instanceId === instanceId);
    if (unitIdx !== -1) {
      const unit = player.battleArea[unitIdx];
      player.battleArea.splice(unitIdx, 1);
      player.hand.push(unit);
      if (unit.pairedPilot) {
        player.hand.push(unit.pairedPilot);
        unit.pairedPilot = null;
      }
      newState.log.push(`${unit.definition.name} returned to hand.`);
      return newState;
    }

    const trashIdx = player.trash.findIndex(c => c.instanceId === instanceId);
    if (trashIdx !== -1) {
      const card = player.trash[trashIdx];
      player.trash.splice(trashIdx, 1);
      player.hand.push(card);
      newState.log.push(`${card.definition.name} returned from trash to hand.`);
      return newState;
    }
  }
  return newState;
};

/** Discard a card from hand to trash (Rule 5-11) */
export const discardFromHand = (state: GameState, instanceId: string): GameState => {
  const newState = { ...state, log: [...state.log] };
  const player = getActivePlayer(newState);

  const idx = player.hand.findIndex(c => c.instanceId === instanceId);
  if (idx !== -1) {
    const card = player.hand.splice(idx, 1)[0];
    player.trash.push(card);
    newState.log.push(`Discarded ${card.definition.name}.`);
  }
  return newState;
};

/** Shuffle the active player's deck */
export const shuffleDeck = (state: GameState, playerIndex: 0 | 1): GameState => ({
  ...state,
  players: state.players.map((p, i) =>
    i === playerIndex ? { ...p, deck: shuffleCards(p.deck) } : p,
  ) as [Player, Player],
  log: [...state.log, `${state.players[playerIndex].name}'s deck shuffled.`],
});
