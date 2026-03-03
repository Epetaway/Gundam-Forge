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
 * Official Gundam TCG Structure: Exactly 50 main deck cards + Up to 10 resource deck cards
 * Strictly enforced: no fewer, no more than 50 cards in main deck
 */
export const DECK_RULES = {
  // Main deck size: STRICTLY 50 cards (enforced minimum = maximum)
  minMainDeckSize: 50,
  maxMainDeckSize: 50,

  // Resource deck size limits — separate deck, feeds Resource Phase
  minResourceDeckSize: 0,
  maxResourceDeckSize: 10,

  // Side deck: optional tournament alternate set (0-15 cards max)
  // Each card can have up to 4 copies, independent of main deck counts
  minSideDeckSize: 0,
  maxSideDeckSize: 15,

  // Copy limits per card — official GCG allows 4 copies
  maxCopiesPerCard: 4,

  // Colorless cards don't count toward color limit
  maxColorsPerDeck: 2,
  colorlessUnlimited: true,

  // Minimum unit requirement (recommended, not enforced)
  minUnitCards: 15,
};

/**
 * GAME START & SETUP RULES
 * Official 2025 Gundam TCG rules
 */
export const SETUP_RULES = {
  // Starting life total
  startingLife: 20,

  // Opening hand size - Official 2025: 5 cards
  openingHandSize: 5,

  // Number of shields at start - Official 2025: 6 shields
  initialShields: 6,

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
// Official GCG Phase Sequence: start → draw → resource → main → end
// NOTE: 'action' and 'battle' are NOT phases — they are card timing keywords.
// Combat (DECLARE_ATTACK, DECLARE_BLOCK, RESOLVE_COMBAT) happens during Main Phase.
export const PHASE_SEQUENCE = [
  'start',    // Phase 1: Ready (untap) all cards. "Start of turn" effects fire.
  'draw',     // Phase 2: Draw 1 card from main deck. Empty deck = loss.
  'resource', // Phase 3: Take top of Resource Deck → Resource Area (enters active). Skip if empty.
  'main',     // Phase 4: Play cards, activate abilities, declare attacks (any order, any times).
  'end',      // Phase 5: Discard to 10. End-of-turn effects. Pass turn.
] as const;

export type GamePhase = (typeof PHASE_SEQUENCE)[number];

/**
 * PHASE RULES & CONSTRAINTS
 */
export const PHASE_RULES = {
  start: {
    name: 'Start Phase',
    actions: ['ready all rested cards', 'resolve start-of-turn effects', 'reset once-per-turn abilities'],
    allowedActions: ['READY_ZONE', 'ADVANCE_PHASE'] as const,
  },
  draw: {
    name: 'Draw Phase',
    actions: ['draw 1 card from main deck'],
    allowedActions: ['DRAW', 'ADVANCE_PHASE'] as const,
  },
  resource: {
    name: 'Resource Phase',
    actions: ['place top card of resource deck into resource area (enters active)'],
    allowedActions: ['PLACE_RESOURCE', 'ADVANCE_PHASE'] as const,
  },
  main: {
    name: 'Main Phase',
    actions: ['play cards', 'activate abilities', 'spend resources', 'declare attacks', 'declare blockers', 'resolve combat'],
    allowedActions: [
      'PLAY_CARD',
      'ACTIVATE_ABILITY',
      'PAIR_PILOT',
      'DECLARE_ATTACK',
      'DECLARE_BLOCK',
      'RESOLVE_COMBAT',
      'SPEND_RESOURCE',
      'REST_UNIT',
      'END_PHASE',
      'ADVANCE_PHASE',
    ] as const,
  },
  end: {
    name: 'End Phase',
    actions: ['discard down to 10', 'resolve end-of-turn effects', 'pass turn'],
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

  // Resource zone size limit: 10 from Resource Deck + 5 EX Resources = 15 max
  maxResources: 15,
  maxNormalResources: 10,
  maxExResources: 5,
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
  startingShields: 6,

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
  // Maximum hand size at end of turn - Official 2025: 10 cards
  maxHandSize: 10,

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
  resetAt: 'start', // Refreshes at Start Phase (Active Step)

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
 * Official GCG Deck Construction
 */
export const VALIDATION_ERRORS = {
  DECK_SIZE_INVALID: 'Main deck must be exactly 50 cards, resource deck up to 10 cards',
  COPY_LIMIT_EXCEEDED: 'Cannot exceed 4 copies of any card',
  CARD_NOT_FOUND: 'Card not found in database',
  IMAGE_URL_MISSING: 'Card image URL is missing - cannot display card',
  INVALID_ZONE_PLACEMENT: 'Card cannot be placed in that zone',
  NOT_ENOUGH_RESOURCES: 'Not enough resources to pay cost',
  HAND_SIZE_EXCEEDED: 'Hand size exceeds maximum',
  COLOR_LIMIT_EXCEEDED: 'Deck exceeds color identity limit',
  UNIT_COUNT_LOW: 'Deck has fewer than recommended unit cards',
  SIDE_DECK_TOO_LARGE: 'Side deck cannot exceed 15 cards',
  MAIN_DECK_WRONG_SIZE: 'Main deck must be exactly 50 cards',
  RESOURCE_DECK_TOO_LARGE: 'Resource deck cannot exceed 10 cards',
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
