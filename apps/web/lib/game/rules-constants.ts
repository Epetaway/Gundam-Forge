/**
 * Gundam TCG Official Rules Constants
 * Version 1.0 (Beta Booster GD01-03)
 * Source: https://www.gundam-tcg.com/en/rules/
 *
 * These constants define the official deck construction rules,
 * game setup requirements, and turn structure enforcement.
 */

/**
 * DECK CONSTRUCTION RULES
 */
export const DECK_RULES = {
  // Main deck size (exact)
  mainDeckSize: 60,
  minMainDeckSize: 60,
  maxMainDeckSize: 60,

  // Resource deck size (exact)
  resourceDeckSize: 0, // Gundam TCG uses main deck only (no dedicated resource deck)

  // Copy limits per card
  maxCopiesPerCard: 3,

  // Colorless cards don't count toward color limit
  maxColorsPerDeck: 2,
  colorlessUnlimited: true,

  // Minimum unit requirement (recommended, not enforced)
  minUnitCards: 15,
};

/**
 * GAME START & SETUP RULES
 */
export const SETUP_RULES = {
  // Starting life total
  startingLife: 20,

  // Opening hand size
  openingHandSize: 7,

  // Number of shields at start
  initialShields: 5,

  // Mulligan configuration
  mulliganAllowed: true,
  mulliganCopies: 1, // Max 1 mulligan (optional, first-game only)

  // Shield placement order
  shieldsPlacedFromTopOfDeck: true,
  shieldsPlacedFaceDown: true,
};

/**
 * TURN STRUCTURE & PHASES
 * Official turn sequence per playtest_rules_map.md
 */
export const PHASE_SEQUENCE = [
  'setup',   // Phase 1: Ready all units, refresh resources, refresh once-per-turn
  'draw',    // Phase 2: Draw 1 card
  'main',    // Phase 3: Play cards, activate abilities, declare attacks
  'action',  // Phase 3b: Action window (optional, some card effects)
  'battle',  // Phase 3c: Battle resolution (sub-phase of main)
  'end',     // Phase 4: Discard down to 7, resolve end-of-turn effects
] as const;

export type GamePhase = (typeof PHASE_SEQUENCE)[number];

/**
 * PHASE RULES & CONSTRAINTS
 */
export const PHASE_RULES = {
  setup: {
    name: 'Setup Phase',
    actions: ['ready all units', 'refresh resources', 'refresh once-per-turn abilities'],
    allowedActions: ['READY_ZONE', 'ADVANCE_PHASE'] as const,
  },
  draw: {
    name: 'Draw Phase',
    actions: ['draw 1 card'],
    allowedActions: ['DRAW', 'MULLIGAN', 'ADVANCE_PHASE'] as const,
  },
  main: {
    name: 'Main Phase',
    actions: ['play cards', 'activate abilities', 'spend resources', 'declare attacks'],
    allowedActions: [
      'PLAY_CARD',
      'ACTIVATE_ABILITY',
      'PAIR_PILOT',
      'DECLARE_ATTACK',
      'SPEND_RESOURCE',
      'REST_UNIT',
      'END_PHASE',
      'ADVANCE_PHASE',
    ] as const,
  },
  action: {
    name: 'Action Phase',
    actions: ['action window for triggered effects'],
    allowedActions: ['ACTIVATE_ABILITY', 'SPEND_RESOURCE', 'END_PHASE', 'ADVANCE_PHASE'] as const,
  },
  battle: {
    name: 'Battle Phase',
    actions: ['declare blockers', 'resolve combat'],
    allowedActions: ['DECLARE_BLOCK', 'RESOLVE_COMBAT', 'END_PHASE', 'ADVANCE_PHASE'] as const,
  },
  end: {
    name: 'End Phase',
    actions: ['discard down to 7', 'resolve end-of-turn effects'],
    allowedActions: ['ADVANCE_PHASE'] as const,
  },
} as const;

/**
 * RESOURCE SYSTEM RULES
 */
export const RESOURCE_RULES = {
  // Cards played as resources per turn
  resourcesPlayedPerTurn: 1,

  // Cost to declare an attack (typical)
  costPerAttack: 1,

  // Resource states
  states: ['ready', 'rest'] as const,

  // Resource zone size limit (unlimited)
  maxResources: Infinity,
};

/**
 * COMBAT RULES
 */
export const COMBAT_RULES = {
  // Blocker assignment
  oneBlockerPerAttacker: true,

  // High-Maneuver prevents blocking
  highManeuverUnblockable: true,

  // First Strike damage order
  firstStrikeDamageFirst: true,

  // Breach condition: attacker destroys defender by battle during attacker's turn
  breachRequiresYourTurn: true,
  breachRequiresBattleDamage: true,
};

/**
 * SHIELD SYSTEM RULES
 */
export const SHIELD_RULES = {
  // Shield count at start
  startingShields: 5,

  // Shields are face-down (hidden until destroyed)
  shieldsFaceDown: true,

  // Shields block damage before base
  damageRedirectsToCoreShield: true,

  // Shields destroyed one at a time
  oneShieldPerDamage: true,

  // Shield break timing
  shieldBreakBurstTiming: 'before', // Burst effects resolve before shield destroyed
};

/**
 * HAND & DECK RULES
 */
export const HAND_RULES = {
  // Maximum hand size at end of turn
  maxHandSize: 7,

  // Discard excess over hand limit
  enforceHandLimit: true,

  // Minimum deck size (game loss if cannot draw)
  minDeckSize: 1,

  // Game loss if deck empty and must draw
  lossOnDeckEmpty: true,
};

/**
 * ONCE-PER-TURN LIMIT RULES
 */
export const ONCE_PER_TURN_RULES = {
  // Reset timing
  resetAt: 'setup', // Refreshes at Setup Phase

  // Cannot be bypassed
  bypassable: false,

  // Per ability per card instance
  trackingGranularity: 'per-ability-instance' as const,
};

/**
 * WIN/LOSS CONDITION RULES
 */
export const WIN_CONDITIONS = {
  baseDestructionThreshold: 0, // Base destroyed at 0 health
  deckOutLoss: true, // Cannot draw = loss
  concede: true, // Player can concede
};

/**
 * VALIDATION ERRORS
 */
export const VALIDATION_ERRORS = {
  DECK_SIZE_INVALID: 'Deck must be exactly 60 cards',
  COPY_LIMIT_EXCEEDED: 'Cannot exceed 3 copies of any card',
  CARD_NOT_FOUND: 'Card not found in database',
  IMAGE_URL_MISSING: 'Card image URL is missing - cannot display card',
  INVALID_ZONE_PLACEMENT: 'Card cannot be placed in that zone',
  NOT_ENOUGH_RESOURCES: 'Not enough resources to pay cost',
  HAND_SIZE_EXCEEDED: 'Hand size exceeds maximum',
  COLOR_LIMIT_EXCEEDED: 'Deck exceeds color identity limit',
  UNIT_COUNT_LOW: 'Deck has fewer than recommended unit cards',
} as const;

/**
 * DETERMINISTIC RNG CONFIGURATION
 */
export const RNG_CONFIG = {
  // Seed-based shuffle for reproducibility
  useDeterministicShuffle: true,

  // Seed generation: timestamp + deckId + random
  seedGenerationMethod: 'timestamp-deckid-random' as const,

  // LCG params for seeded random
  lcgA: 9301,
  lcgC: 49297,
  lcgM: 233280,
};

/**
 * COIN FLIP CONFIGURATION
 */
export const COIN_FLIP = {
  heads: 'player',
  tails: 'opponent',
  defaultFirstPlayer: 'player',
};

/**
 * GAME LOG CONFIGURATION
 */
export const GAME_LOG_CONFIG = {
  // Log every action
  logAllActions: true,

  // Include rules trace for validation
  includeRulesTrace: true,

  // Include game state snapshots
  includeStateSnapshot: true,

  // Maximum log entries to keep (memory limit)
  maxLogEntries: 10000,
};

/**
 * AUTOPLAYER CONFIGURATION
 */
export const AUTOPLAYER_CONFIG = {
  // AI difficulty (for future expansion)
  difficulty: 'basic' as const,

  // Attack preference order
  attackPriority: ['shields', 'base'] as const,

  // Unit preference for attack
  unitAttackOrder: 'highest-attack-first' as const,

  // Resource generation per turn
  resourcesPerTurn: 1,

  // Max units to play per turn
  maxUnitsPerTurn: 1,

  // Minimum resources to keep (for blocking)
  minResourcesReserve: 1,
};
