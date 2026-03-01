/**
 * Game Engine Types for Gundam TCG Playtester
 * Deterministic, rules-accurate game simulation
 */

export type ZoneType =
  | 'deck'
  | 'hand'
  | 'battle'
  | 'shields'
  | 'base'
  | 'resources'
  | 'trash'
  | 'exResource'
  | 'exBase';

export type CardState = 'ready' | 'rest';
export type Phase =
  | 'setup'
  | 'draw'
  | 'main'
  | 'action'
  | 'battle'
  | 'end'
  | 'gameOver';

export type TriggerType =
  | 'burst'
  | 'deploy'
  | 'attack'
  | 'destroyed'
  | 'breach'
  | 'damaged'
  | 'beforeShieldDestroyed';

export type ActionType =
  | 'DRAW'
  | 'MULLIGAN'
  | 'PLAY_CARD'
  | 'ACTIVATE_ABILITY'
  | 'PAIR_PILOT'
  | 'DECLARE_ATTACK'
  | 'DECLARE_BLOCK'
  | 'RESOLVE_COMBAT'
  | 'END_PHASE'
  | 'ADVANCE_PHASE'
  | 'SPEND_RESOURCE'
  | 'REST_UNIT'
  | 'READY_ZONE';

/**
 * CardInstance represents a unique copy of a card in play
 */
export interface CardInstance {
  instanceId: string; // Unique ID for this copy (e.g., "instance-1-GD01-001")
  cardId: string; // Reference to card database (e.g., "GD01-001")
  zone: ZoneType;
  state: CardState; // ready or rest
  damageMarkers: number; // Damage taken (0+ markers)
  position?: 'front' | 'mid' | 'back'; // Battle area position if in battle zone
  attachments: {
    pilot?: CardInstance; // Paired pilot
    linked?: CardInstance[]; // Additional linked pilots
  };
  counters: Record<string, number>; // Custom counters
  usedAbilities: Set<string>; // Tracks once-per-turn abilities used (ability ID)
}

/**
 * PlayerState represents one player's board state
 */
export interface PlayerState {
  playerId: string;
  name: string;
  deck: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[]; // Trash zone
  battleArea: CardInstance[]; // Units in play (up to 3)
  shields: CardInstance[]; // Shield cards
  base: CardInstance | null; // Single base card
  resources: CardInstance[]; // Resources in play
  exZone: {
    exBase?: CardInstance;
    exResources: CardInstance[];
  };
  baseHealth: number; // Current base health (typical: 20)
  maxBaseHealth: number; // Max base health
  // Counters
  shieldsDrawnThisTurn: number;
  deckShuffle Seed: number; // For determinism
}

/**
 * GameLog entry for rules trace
 */
export interface GameLogEntry {
  timestamp: number;
  actionType: ActionType;
  activePlayer: string;
  phase: Phase;
  description: string;
  rulesTrace: string; // Why this was allowed/why it triggered
  state: Partial<GameState>; // Snapshot of state after action
}

/**
 * GameState represents the entire game
 */
export interface GameState {
  gameId: string;
  deckId: string; // Reference to deck being played
  turnNumber: number;
  activePlayerId: string; // Whose turn is it
  phase: Phase;
  priorityPlayer: string; // Who has priority in stack (if applicable)
  players: Record<string, PlayerState>; // player[0] and player[1]
  stack: Trigger[]; // Pending triggers to resolve
  currentCombat?: CombatInfo; // Active combat data
  log: GameLogEntry[];
  rngSeed: number; // Seeded RNG for reproducibility
  isGameOver: boolean;
  winner?: string;
  // Flags
  hasDrawnThisTurn: boolean;
  hasMainPhaseActions: number; // Count actions in main phase
}

/**
 * Trigger represents a pending game effect
 */
export interface Trigger {
  id: string;
  type: TriggerType;
  sourceInstanceId: string; // Which card triggered this
  priority: number; // For ordering (lower = earlier)
  condition: () => boolean; // Check if still valid
  resolve: (game: GameState) => void; // Apply the effect
  description: string; // For logging
}

/**
 * CombatInfo represents an ongoing attack
 */
export interface CombatInfo {
  attackerId: string; // Attacker instance ID
  defenderId: string; // Defender instance ID (unit or base)
  attackerDamage: number;
  defenderDamage: number;
  hasBlocker: boolean;
  isResolved: boolean;
}

/**
 * Action represents a player request
 */
export interface GameAction {
  type: ActionType;
  playerId: string;
  timestamp: number;
  payload?: Record<string, any>; // Action-specific data
}

/**
 * Action validation result
 */
export interface ActionValidation {
  valid: boolean;
  error?: string;
  rulesTrace?: string;
}

/**
 * Card definition from database
 */
export interface CardDefinition {
  id: string;
  name: string;
  type: 'Unit' | 'Pilot' | 'Command' | 'Base' | 'Resource' | 'EX';
  cost?: number; // Resource cost to play
  atk?: number;
  def?: number;
  traits: string[];
  keywords: string[]; // [High-Maneuver, First Strike, Blocker, Pair, Link, etc.]
  imageUrl: string;
  text: string; // Card text / abilities
  abilities: CardAbility[];
  set: string;
  number: string;
}

/**
 * Extracted ability from card
 */
export interface CardAbility {
  id: string; // Unique ID: ${cardId}-ability-${index}
  text: string;
  timing: 'main' | 'action' | 'trigger' | 'passive';
  triggerType?: TriggerType;
  isLimited: boolean; // Once per turn
  effect: (game: GameState, sourceInstance: CardInstance, context: any) => void;
}

/**
 * Deck structure (from deck builder)
 */
export interface DeckDefinition {
  id: string;
  name: string;
  description?: string;
  cards: {
    cardId: string;
    count: number;
    zone: 'main' | 'resource' | 'base' | 'exResource' | 'exBase';
  }[];
  intent?: {
    clans: string[];
    colors: string[];
  };
}

