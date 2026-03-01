/**
 * Gundam TCG Game Engine
 * Deterministic, rules-accurate game simulation
 */

import { COLORLESS_TOKEN_DECK } from './token-decks';

export type ZoneType =
  | 'deck'
  | 'hand'
  | 'battle'
  | 'shields'
  | 'base'
  | 'resources'
  | 'resourceDeck'   // separate 10-card resource deck (feeds Resource Phase)
  | 'trash'
  | 'exResource'
  | 'exBase';

export type CardState = 'ready' | 'rest';
// Official GCG phases: start → draw → resource → main → end
// 'action' and 'battle' are card timing keywords, NOT phases
export type Phase =
  | 'start'
  | 'draw'
  | 'resource'
  | 'main'
  | 'end'
  | 'gameOver';

export type TriggerType =
  | 'DEPLOY'
  | 'ATTACK'
  | 'DESTROYED'
  | 'BURST'
  | 'BREACH'
  | 'REPAIR'
  | 'PAIR'
  | 'LINK';

export type ActionType =
  | 'DRAW'
  | 'MULLIGAN'
  | 'PLAY_CARD'
  | 'ACTIVATE_ABILITY'
  | 'PAIR_PILOT'
  | 'DECLARE_ATTACK'
  | 'DECLARE_BLOCK'
  | 'RESOLVE_COMBAT'
  | 'PLACE_RESOURCE'   // Resource Phase: take top of resource deck → resource area (active)
  | 'END_PHASE'
  | 'ADVANCE_PHASE'
  | 'SPEND_RESOURCE'
  | 'REST_UNIT'
  | 'READY_ZONE'
  | 'RESOLVE_TRIGGER'
  | 'RESOLVE_ALL_TRIGGERS';

export interface TriggerEvent {
  id: string;
  type: TriggerType;
  sourceInstanceId?: string;
  ownerPlayerId?: string;
  payload?: Record<string, any>;
  optionalChoice: boolean;
  description: string;
  createdAt: number;
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  zone: ZoneType;
  state: CardState;
  damageMarkers: number;
  position?: 'front' | 'mid' | 'back';
  attachments: {
    pilot?: CardInstance;
    linked?: CardInstance[];
  };
  counters: Record<string, number>;
  usedAbilities: Set<string>;
}

export interface PlayerState {
  playerId: string;
  name: string;
  deck: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  battleArea: CardInstance[];
  shields: CardInstance[];
  base: CardInstance | null;
  resources: CardInstance[];
  resourceDeck: CardInstance[];   // separate 10-card resource deck (feeds Resource Phase)
  exZone: {
    exBase?: CardInstance;
    exResources: CardInstance[];
  };
  baseHealth: number;
  maxBaseHealth: number;
  shieldsDrawnThisTurn: number;
  deckShuffleSeed: number;
  mulliganTaken: boolean;
}

export interface GameLogEntry {
  timestamp: number;
  actionType: ActionType;
  activePlayer: string;
  phase: Phase;
  description: string;
  rulesTrace: string;
  state: Partial<GameState>;
}

export interface GameState {
  gameId: string;
  deckId: string;
  turnNumber: number;
  activePlayerId: string;
  phase: Phase;
  priorityPlayer: string;
  players: Record<string, PlayerState>;
  stack: TriggerEvent[];
  currentCombat?: any;
  log: GameLogEntry[];
  rngSeed: number;
  isGameOver: boolean;
  winner?: string;
  hasDrawnThisTurn: boolean;
  hasResourcePlacedThisTurn: boolean;
  hasMainPhaseActions: number;
}

export interface GameAction {
  type: ActionType;
  playerId: string;
  timestamp: number;
  payload?: Record<string, any>;
}

export interface ActionValidation {
  valid: boolean;
  error?: string;
  rulesTrace?: string;
}

export interface CardDefinition {
  id: string;
  name: string;
  type: 'Unit' | 'Pilot' | 'Command' | 'Base' | 'Resource' | 'EX';
  cost?: number;
  ap?: number;   // Attack Points — official GCG stat name
  hp?: number;   // Hit Points — official GCG stat name
  traits: string[];
  keywords: string[];
  imageUrl: string;
  text: string;
  abilities: any[];
  set: string;
  number: string;
}

export interface DeckDefinition {
  id: string;
  name: string;
  description?: string;
  cards: {
    cardId: string;
    count: number;
    zone: 'main' | 'resource' | 'base' | 'exResource' | 'exBase';
  }[];
}

export class GameEngine {
  private state: GameState;
  private cardDb: Record<string, CardDefinition> = {};
  private stateHistory: GameState[] = [];
  private historyIndex: number = -1;
  private readonly MAX_HISTORY = 100;

  constructor(
    deckId: string,
    deck: DeckDefinition,
    cardDatabase: Record<string, CardDefinition>,
  ) {
    this.cardDb = cardDatabase;
    this.registerTokenDeckDefinitions();
    this.state = this.initializeGame(deckId, deck);
    // Save initial state
    this.saveStateToHistory();
  }

  private registerTokenDeckDefinitions(): void {
    for (const tokenCard of COLORLESS_TOKEN_DECK.cards) {
      if (this.cardDb[tokenCard.id]) continue;
      this.cardDb[tokenCard.id] = {
        id: tokenCard.id,
        name: tokenCard.name,
        type: tokenCard.type,
        cost: tokenCard.type === 'Resource' ? 0 : 1,
        ap: (tokenCard as any).ap ?? (tokenCard as any).atk,
        hp: (tokenCard as any).hp ?? (tokenCard as any).def,
        traits: ['Token'],
        keywords: tokenCard.keywords ?? [],
        imageUrl: '',
        text: tokenCard.text ?? 'Token card',
        abilities: [],
        set: 'Token',
        number: tokenCard.id,
      };
    }
  }

  private initializeGame(deckId: string, deck: DeckDefinition): GameState {
    const rngSeed = Math.floor(Math.random() * (2 ** 31));
    const player1 = this.createPlayerState('player1', deck, rngSeed);
    const player2 = this.createPlayerStateOpponent('player2', rngSeed);

    const game: GameState = {
      gameId: `game-${Date.now()}`,
      deckId,
      turnNumber: 1,
      activePlayerId: 'player1',
      phase: 'start',
      priorityPlayer: 'player1',
      players: {
        player1,
        player2,
      },
      stack: [],
      log: [],
      rngSeed,
      isGameOver: false,
      hasDrawnThisTurn: false,
      hasResourcePlacedThisTurn: false,
      hasMainPhaseActions: 0,
    };

    this.log('GAME_START', 'player1', 'start', 'Game initialized', 'Starting new playtest session');

    return game;
  }

  private createPlayerState(playerId: string, deck: DeckDefinition, rngSeed: number): PlayerState {
    const deckCards: CardInstance[] = [];
    let instanceCounter = 0;

    for (const deckCard of deck.cards.filter((c) => c.zone === 'main')) {
      for (let i = 0; i < deckCard.count; i++) {
        const card = this.cardDb[deckCard.cardId];
        if (card) {
          deckCards.push({
            instanceId: `${playerId}-${instanceCounter++}`,
            cardId: deckCard.cardId,
            zone: 'deck',
            state: 'ready',
            damageMarkers: 0,
            attachments: { linked: [] },
            counters: {},
            usedAbilities: new Set(),
          });
        }
      }
    }

    this.shuffleDeck(deckCards, rngSeed);

    // Official 2025 Gundam TCG: 6 shields face-down
    const shields = Array(6)
      .fill(null)
      .map((_, i) => ({
        instanceId: `${playerId}-shield-${i}`,
        cardId: 'SHIELD',
        zone: 'shields' as const,
        state: 'ready' as const,
        damageMarkers: 0,
        attachments: { linked: [] },
        counters: {},
        usedAbilities: new Set<string>(),
      }));

    // Build resource deck from deck definition (zone: 'resource' cards)
    const resourceDeckCards: CardInstance[] = [];
    let resourceCounter = 0;
    for (const deckCard of deck.cards.filter((c) => c.zone === 'resource')) {
      for (let i = 0; i < deckCard.count; i++) {
        const card = this.cardDb[deckCard.cardId];
        if (card) {
          resourceDeckCards.push({
            instanceId: `${playerId}-res-${resourceCounter++}`,
            cardId: deckCard.cardId,
            zone: 'resourceDeck',
            state: 'ready',
            damageMarkers: 0,
            attachments: { linked: [] },
            counters: {},
            usedAbilities: new Set(),
          });
        }
      }
    }
    this.shuffleDeck(resourceDeckCards, rngSeed + 1);

    const player: PlayerState = {
      playerId,
      name: playerId === 'player1' ? 'You' : 'Opponent',
      deck: deckCards,
      hand: [],
      discardPile: [],
      battleArea: [],
      shields,
      base: null,
      resources: [],
      resourceDeck: resourceDeckCards,
      exZone: { exResources: [] },
      baseHealth: 20,
      maxBaseHealth: 20,
      shieldsDrawnThisTurn: 0,
      deckShuffleSeed: rngSeed,
      mulliganTaken: false,
    };

    return player;
  }

  private createPlayerStateOpponent(playerId: string, rngSeed: number): PlayerState {
    const deckCards: CardInstance[] = [];
    let instanceCounter = 0;

    for (const tokenCard of COLORLESS_TOKEN_DECK.cards.filter((c) => c.zone === 'main')) {
      for (let i = 0; i < tokenCard.count; i++) {
        deckCards.push({
          instanceId: `${playerId}-token-${instanceCounter++}`,
          cardId: tokenCard.id,
          zone: 'deck',
          state: 'ready',
          damageMarkers: 0,
          attachments: { linked: [] },
          counters: {},
          usedAbilities: new Set(),
        });
      }
    }

    this.shuffleDeck(deckCards, rngSeed);

    const resourcePool: CardInstance[] = COLORLESS_TOKEN_DECK.cards
      .filter((c) => c.zone === 'resource')
      .flatMap((resourceCard, resourceIndex) =>
        Array.from({ length: resourceCard.count }, (_, copyIndex) => ({
          instanceId: `${playerId}-resource-${resourceIndex}-${copyIndex}`,
          cardId: resourceCard.id,
          zone: 'resources' as const,
          state: 'ready' as const,
          damageMarkers: 0,
          attachments: { linked: [] },
          counters: {},
          usedAbilities: new Set<string>(),
        })),
      );

    const openingHand = deckCards.splice(Math.max(deckCards.length - 5, 0), 5);
    openingHand.forEach((card) => {
      card.zone = 'hand';
    });

    return {
      playerId,
      name: 'Opponent',
      deck: deckCards,
      hand: openingHand,
      discardPile: [],
      battleArea: [],
      // Official 2025 Gundam TCG: 6 shields face-down
      shields: Array(6)
        .fill(null)
        .map((_, i) => ({
          instanceId: `${playerId}-shield-${i}`,
          cardId: 'SHIELD',
          zone: 'shields',
          state: 'ready',
          damageMarkers: 0,
          attachments: { linked: [] },
          counters: {},
          usedAbilities: new Set(),
        })),
      base: {
        instanceId: `${playerId}-base`,
        cardId: 'BASE',
        zone: 'base',
        state: 'ready',
        damageMarkers: 0,
        attachments: { linked: [] },
        counters: {},
        usedAbilities: new Set(),
      },
      resources: resourcePool,
      resourceDeck: [],
      exZone: { exResources: [] },
      baseHealth: 20,
      maxBaseHealth: 20,
      shieldsDrawnThisTurn: 0,
      deckShuffleSeed: rngSeed,
      mulliganTaken: false,
    };
  }

  private shuffleDeck(deck: CardInstance[], seed: number): void {
    const rng = this.seededRandom(seed);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  public executeAction(action: GameAction): ActionValidation {
    if (this.state.isGameOver) {
      return {
        valid: false,
        error: 'Game is over',
        rulesTrace: 'Cannot perform actions after game end.',
      };
    }

    const validation = this.validateAction(action);
    if (!validation.valid) {
      return validation;
    }

    let result: ActionValidation;

    switch (action.type) {
      case 'DRAW':
        result = this.handleDraw(action);
        break;
      case 'MULLIGAN':
        result = this.handleMulligan(action);
        break;
      case 'ADVANCE_PHASE':
        result = this.handleAdvancePhase(action);
        break;
      case 'PLAY_CARD':
        result = this.handlePlayCard(action);
        break;
      case 'ACTIVATE_ABILITY':
        result = this.handleActivateAbility(action);
        break;
      case 'PAIR_PILOT':
        result = this.handlePairPilot(action);
        break;
      case 'DECLARE_ATTACK':
        result = this.handleDeclareAttack(action);
        break;
      case 'DECLARE_BLOCK':
        result = this.handleDeclareBlock(action);
        break;
      case 'RESOLVE_COMBAT':
        result = this.handleResolveCombat(action);
        break;
      case 'RESOLVE_TRIGGER':
        result = this.handleResolveTrigger(action);
        break;
      case 'RESOLVE_ALL_TRIGGERS':
        result = this.handleResolveAllTriggers(action);
        break;
      case 'PLACE_RESOURCE':
        result = this.handlePlaceResource(action);
        break;
      case 'END_PHASE':
        result = this.handleEndPhase(action);
        break;
      default:
        result = { valid: false, error: `Unknown action: ${action.type}` };
    }

    // Save state after successful action
    if (result.valid) {
      this.saveStateToHistory();
    }

    return result;
  }

  public validateAction(
    stateOrAction: GameState | GameAction,
    maybeAction?: GameAction,
  ): ActionValidation {
    const action = maybeAction ?? (stateOrAction as GameAction);
    const activeState = maybeAction ? (stateOrAction as GameState) : this.state;
    const { type, playerId } = action;

    if (playerId !== activeState.activePlayerId) {
      return {
        valid: false,
        error: 'Not your turn',
        rulesTrace: `Active player is ${activeState.activePlayerId}, not ${playerId}`,
      };
    }

    const phaseGate = this.getPhaseGate(type, activeState.phase);
    if (!phaseGate.allowed) {
      return {
        valid: false,
        error: phaseGate.reason,
        rulesTrace: `${type} cannot be used in ${activeState.phase} phase.`,
      };
    }

    return { valid: true };
  }

  private getPhaseGate(action: ActionType, phase: Phase): { allowed: boolean; reason?: string } {
    // Official GCG: combat (DECLARE_ATTACK, DECLARE_BLOCK, RESOLVE_COMBAT) happens during Main Phase
    const gates: Record<ActionType, Phase[]> = {
      DRAW: ['draw'],
      MULLIGAN: ['draw'],
      PLACE_RESOURCE: ['resource'],
      PLAY_CARD: ['main'],
      ACTIVATE_ABILITY: ['main'],
      PAIR_PILOT: ['main'],
      DECLARE_ATTACK: ['main'],
      DECLARE_BLOCK: ['main'],
      RESOLVE_COMBAT: ['main'],
      END_PHASE: ['main'],
      ADVANCE_PHASE: ['start', 'draw', 'resource', 'main', 'end'],
      SPEND_RESOURCE: ['main'],
      REST_UNIT: ['main'],
      READY_ZONE: ['start'],
      RESOLVE_TRIGGER: ['main', 'end'],
      RESOLVE_ALL_TRIGGERS: ['main', 'end'],
    };

    const allowed = gates[action]?.includes(phase);
    return {
      allowed: allowed ?? false,
      reason: allowed ? undefined : `${action} not allowed in ${phase} phase`,
    };
  }

  private handleDraw(action: GameAction): ActionValidation {
    const player = this.state.players[action.playerId];
    if (player.deck.length === 0) {
      return {
        valid: false,
        error: 'Deck is empty',
        rulesTrace: 'Cannot draw from empty deck.',
      };
    }

    const card = player.deck.pop()!;
    card.zone = 'hand';
    player.hand.push(card);

    this.state.hasDrawnThisTurn = true;

    this.log(
      'DRAW',
      action.playerId,
      this.state.phase,
      `Drew ${card.cardId}`,
      'Card moved from deck to hand.',
    );

    return { valid: true };
  }

  private handleMulligan(action: GameAction): ActionValidation {
    const player = this.state.players[action.playerId];

    // Check if they've already taken a mulligan
    if (player.mulliganTaken) {
      return {
        valid: false,
        error: 'Mulligan already taken',
        rulesTrace: 'Each player can only mulligan (redraw) their opening hand once.',
      };
    }

    // Shuffle hand back into deck
    player.deck.push(...player.hand);
    player.hand = [];

    // Reshuffle deck with same seed (deterministic)
    this.shuffleDeck(player.deck, player.deckShuffleSeed);

    // Official 2025 Gundam TCG: Redraw 5 cards after mulligan
    for (let i = 0; i < 5 && player.deck.length > 0; i++) {
      const card = player.deck.pop()!;
      card.zone = 'hand';
      player.hand.push(card);
    }

    // Mark mulligan as taken
    player.mulliganTaken = true;

    this.log(
      'MULLIGAN',
      action.playerId,
      this.state.phase,
      'Hand reshuffled and redrawn',
      'Mulligan taken: 5 cards redrawn from deck.',
    );

    return { valid: true };
  }

  private handleAdvancePhase(action: GameAction): ActionValidation {
    // Official GCG phase sequence: start → draw → resource → main → end → (next player's start)
    const phaseSequence: Phase[] = ['start', 'draw', 'resource', 'main', 'end'];
    const currentPhaseIndex = phaseSequence.indexOf(this.state.phase as any);

    if (currentPhaseIndex === -1) {
      return { valid: false, error: 'Invalid current phase' };
    }

    if (this.state.phase === 'draw' && !this.state.hasDrawnThisTurn) {
      return {
        valid: false,
        error: 'Must draw before advancing',
        rulesTrace: 'Draw phase requires drawing one card',
      };
    }

    const isLastPhase = currentPhaseIndex === phaseSequence.length - 1;
    const nextPhase: Phase = isLastPhase ? 'start' : phaseSequence[currentPhaseIndex + 1];

    // End phase: enforce hand limit, then switch turns
    if (this.state.phase === 'end') {
      this.enforceHandLimit(action.playerId);
      this.triggerRepair(action.playerId);
      this.state.activePlayerId = this.state.activePlayerId === 'player1' ? 'player2' : 'player1';
      this.state.turnNumber++;
    }

    // Start phase: ready all cards for the active player
    if (nextPhase === 'start') {
      this.readyZone(this.state.activePlayerId);
    }

    // Reset per-turn flags
    if (nextPhase === 'draw') {
      this.state.hasDrawnThisTurn = false;
    }
    if (nextPhase === 'resource') {
      this.state.hasResourcePlacedThisTurn = false;
    }

    this.state.phase = nextPhase;
    this.log(
      'ADVANCE_PHASE',
      action.playerId,
      this.state.phase,
      `Advanced to ${nextPhase}`,
      'Phase transition successful.',
    );

    return { valid: true };
  }

  private handlePlayCard(action: GameAction): ActionValidation {
    const { cardInstanceId } = action.payload || {};
    if (!cardInstanceId) {
      return { valid: false, error: 'Missing cardInstanceId' };
    }

    const player = this.state.players[action.playerId];
    const card = player.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { valid: false, error: 'Card not in hand' };
    }

    const cardDef = this.cardDb[card.cardId];
    if (!cardDef) {
      return {
        valid: false,
        error: 'Card definition not found',
        rulesTrace: `Card ${card.cardId} not in database`,
      };
    }

    if (cardDef.cost && player.resources.length < cardDef.cost) {
      return {
        valid: false,
        error: `Not enough resources`,
        rulesTrace: `Need ${cardDef.cost}, have ${player.resources.length}`,
      };
    }

    player.hand = player.hand.filter((c) => c.instanceId !== cardInstanceId);

    let targetZone: ZoneType = 'battle';
    if (cardDef.type === 'Base') targetZone = 'base';
    else if (cardDef.type === 'Resource') targetZone = 'resources';

    card.zone = targetZone;

    switch (targetZone) {
      case 'battle': {
        // Official GCG: max 6 units in battle area
        if (player.battleArea.length >= 6) {
          return {
            valid: false,
            error: 'Battle area full',
            rulesTrace: 'Cannot exceed 6 units in battle area.',
          };
        }
        // Official GCG: units enter RESTED unless they have Rush keyword
        const hasRush = (cardDef.keywords ?? []).some(
          (k: string) => k.toLowerCase() === 'rush',
        );
        card.state = hasRush ? 'ready' : 'rest';
        player.battleArea.push(card);
        break;
      }
      case 'base':
        if (player.base) {
          return {
            valid: false,
            error: 'Base already in play',
            rulesTrace: 'Cannot have multiple bases',
          };
        }
        player.base = card;
        break;
      case 'resources':
        player.resources.push(card);
        break;
      default:
        break;
    }

    this.log(
      'PLAY_CARD',
      action.playerId,
      this.state.phase,
      `Played ${cardDef.id}`,
      `Card deployed to ${targetZone}.`,
    );

    if (targetZone === 'battle') {
      this.triggerDeploy(action.playerId, card);
    }

    return { valid: true };
  }

  private handleActivateAbility(action: GameAction): ActionValidation {
    const { sourceInstanceId, targetInstanceId, abilityId = 'SUPPORT_MAIN' } = action.payload || {};
    if (!sourceInstanceId || !targetInstanceId) {
      return { valid: false, error: 'Missing sourceInstanceId or targetInstanceId' };
    }

    const player = this.state.players[action.playerId];
    const source = player.battleArea.find((u) => u.instanceId === sourceInstanceId);
    const target = player.battleArea.find((u) => u.instanceId === targetInstanceId);

    if (!source || !target) {
      return { valid: false, error: 'Source/target unit not found in battle area' };
    }

    if (source.state === 'rest') {
      return { valid: false, error: 'Source unit is exhausted' };
    }

    if (source.usedAbilities.has(abilityId)) {
      return {
        valid: false,
        error: 'Ability already used this turn',
        rulesTrace: 'Once-per-turn limit prevents repeated activation.',
      };
    }

    const sourceHasSupport = this.hasKeyword(source, ['support']);
    if (!sourceHasSupport) {
      return {
        valid: false,
        error: 'Source unit has no support ability',
        rulesTrace: 'Only support units can activate this ability in MVP.',
      };
    }

    source.state = 'rest';
    source.usedAbilities.add(abilityId);

    const currentBuff = target.counters.tempApBuff ?? 0;
    target.counters.tempApBuff = currentBuff + 1;

    this.log(
      'ACTIVATE_ABILITY',
      action.playerId,
      this.state.phase,
      `${source.cardId} supported ${target.cardId}`,
      'Support unit rested and granted +1 temporary AP for this turn.',
    );

    return { valid: true };
  }

  private handlePairPilot(action: GameAction): ActionValidation {
    const { pilotInstanceId, unitInstanceId, mode = 'pair' } = action.payload || {};
    if (!pilotInstanceId || !unitInstanceId) {
      return { valid: false, error: 'Missing pilotInstanceId or unitInstanceId' };
    }

    const player = this.state.players[action.playerId];
    const pilot = player.battleArea.find((u) => u.instanceId === pilotInstanceId);
    const unit = player.battleArea.find((u) => u.instanceId === unitInstanceId);

    if (!pilot || !unit) {
      return { valid: false, error: 'Pilot or unit not found in battle area' };
    }

    const pilotDef = this.cardDb[pilot.cardId] as any;
    const unitDef = this.cardDb[unit.cardId] as any;

    if (pilotDef?.type !== 'Pilot') {
      return { valid: false, error: 'Selected pilot card is not a Pilot type' };
    }

    if (unitDef?.type !== 'Unit') {
      return { valid: false, error: 'Selected target card is not a Unit type' };
    }

    if (mode === 'pair') {
      unit.attachments.pilot = pilot;
      player.battleArea = player.battleArea.filter((u) => u.instanceId !== pilotInstanceId);
      this.enqueueTrigger({
        type: 'PAIR',
        sourceInstanceId: unit.instanceId,
        ownerPlayerId: action.playerId,
        optionalChoice: false,
        description: `${pilot.cardId} paired with ${unit.cardId}`,
        payload: { pilotInstanceId, unitInstanceId },
      });
    } else {
      unit.attachments.linked = unit.attachments.linked || [];
      unit.attachments.linked.push(pilot);
      player.battleArea = player.battleArea.filter((u) => u.instanceId !== pilotInstanceId);
      this.enqueueTrigger({
        type: 'LINK',
        sourceInstanceId: unit.instanceId,
        ownerPlayerId: action.playerId,
        optionalChoice: false,
        description: `${pilot.cardId} linked to ${unit.cardId}`,
        payload: { pilotInstanceId, unitInstanceId },
      });
    }

    this.log(
      'PAIR_PILOT',
      action.playerId,
      this.state.phase,
      `${mode === 'pair' ? 'Paired' : 'Linked'} ${pilot.cardId} to ${unit.cardId}`,
      'Pilot attachment completed and trigger queued.',
    );

    return { valid: true };
  }

  private handleDeclareAttack(action: GameAction): ActionValidation {
    const { attackerInstanceIds, defenderPlayerId, target } = action.payload || {};
    if (!attackerInstanceIds || !Array.isArray(attackerInstanceIds)) {
      return { valid: false, error: 'Missing attackerInstanceIds' };
    }

    const player = this.state.players[action.playerId];

    for (const instanceId of attackerInstanceIds) {
      const attacker = player.battleArea.find((u) => u.instanceId === instanceId);
      if (!attacker) {
        return { valid: false, error: `Unit ${instanceId} not found` };
      }
      if (attacker.state === 'rest') {
        return {
          valid: false,
          error: `Unit exhausted`,
          rulesTrace: 'Only ready units can attack.',
        };
      }
    }

    for (const instanceId of attackerInstanceIds) {
      const attacker = player.battleArea.find((u) => u.instanceId === instanceId);
      if (attacker) {
        attacker.state = 'rest';
      }
    }

    const opponentId =
      defenderPlayerId || Object.keys(this.state.players).find((id) => id !== action.playerId);

    this.state.currentCombat = {
      attackerPlayerId: action.playerId,
      defenderPlayerId: opponentId,
      attackerInstanceIds,
      blockerInstanceIds: [],
      target: target || 'shield',
      result: null,
    };

    // Combat remains in Main Phase — do NOT switch phase to 'battle'
    this.log(
      'DECLARE_ATTACK',
      action.playerId,
      this.state.phase,
      `${attackerInstanceIds.length} attacker(s) declared`,
      `Units exhausted. Target: ${target || 'shield'}.`,
    );

    attackerInstanceIds.forEach((instanceId: string) => {
      this.enqueueTrigger({
        type: 'ATTACK',
        sourceInstanceId: instanceId,
        ownerPlayerId: action.playerId,
        optionalChoice: false,
        description: `Attack trigger from ${instanceId}`,
        payload: {
          attackerPlayerId: action.playerId,
          defenderPlayerId: opponentId,
          target: target || 'shield',
        },
      });
    });

    return { valid: true };
  }

  private handleDeclareBlock(action: GameAction): ActionValidation {
    const { defenderId, attackerPlayerId, attackerInstanceId, blockerId } = action.payload || {};
    const defender = this.state.players[defenderId];
    const attacker = this.state.players[attackerPlayerId];

    if (!defender || !attacker) {
      return { valid: false, error: 'Invalid player IDs' };
    }

    const defendingUnit = defender.battleArea.find(u => u.instanceId === blockerId);
    if (!defendingUnit) {
      return { valid: false, error: 'Unit not found in battle area' };
    }

    if (defendingUnit.state === 'rest') {
      return { valid: false, error: 'Cannot block while exhausted' };
    }

    const attackingUnit = attacker.battleArea.find(u => u.instanceId === attackerInstanceId);
    if (!attackingUnit) {
      return { valid: false, error: 'Attacking unit not found' };
    }

    if (this.hasKeyword(attackingUnit, ['high_maneuver', 'high-maneuver', 'High-Maneuver'])) {
      return {
        valid: false,
        error: 'Cannot block High-Maneuver attacker',
        rulesTrace: 'High-Maneuver prevents blocker interception.',
      };
    }

    if (this.state.currentCombat) {
      this.state.currentCombat.blockerInstanceIds = [blockerId];
    }

    this.log(
      'DECLARE_BLOCK',
      defenderId,
      this.state.phase,
      `Unit ${blockerId} blocks attack from ${attackerInstanceId}`,
      'Blocker assigned during battle phase.'
    );

    return { valid: true };
  }

  private handleResolveCombat(action: GameAction): ActionValidation {
    const {
      attackerPlayerId,
      defenderPlayerId,
      attackerInstanceId,
      blockerInstanceIds = [],
      target,
    } = action.payload || {};

    const combatCtx = this.state.currentCombat || {};
    const resolvedAttackerPlayerId = attackerPlayerId || combatCtx.attackerPlayerId;
    const resolvedDefenderPlayerId = defenderPlayerId || combatCtx.defenderPlayerId;
    const resolvedAttackerInstanceId =
      attackerInstanceId || combatCtx.attackerInstanceIds?.[0];
    const resolvedBlockerInstanceIds =
      blockerInstanceIds.length > 0 ? blockerInstanceIds : combatCtx.blockerInstanceIds || [];

    const attacker = this.state.players[resolvedAttackerPlayerId];
    const defender = this.state.players[resolvedDefenderPlayerId];

    if (!attacker || !defender) {
      return { valid: false, error: 'Invalid player IDs in combat' };
    }

    const attackingUnit = attacker.battleArea.find(
      (u) => u.instanceId === resolvedAttackerInstanceId,
    );
    if (!attackingUnit) {
      return { valid: false, error: 'Attacking unit not found' };
    }

    const attackerDamage = this.getUnitAttack(attackingUnit);
    const blocker = resolvedBlockerInstanceIds.length
      ? defender.battleArea.find((u) => u.instanceId === resolvedBlockerInstanceIds[0])
      : undefined;

    const attackerHasFirstStrike = this.hasKeyword(attackingUnit, ['first_strike', 'first strike', 'First Strike']);
    const attackerHasHighManeuver = this.hasKeyword(attackingUnit, ['high_maneuver', 'high-maneuver', 'High-Maneuver']);
    const blockerHasFirstStrike = blocker
      ? this.hasKeyword(blocker, ['first_strike', 'first strike', 'First Strike'])
      : false;

    let attackerDestroyed = false;
    let blockerDestroyed = false;
    let shieldDamage = 0;
    let baseDamage = 0;
    let revealedShieldIds: string[] = [];

    const applyDamageToUnit = (
      targetUnit: CardInstance,
      targetPlayer: PlayerState,
      damage: number,
    ) => {
      targetUnit.damageMarkers += damage;
      const unitHp = this.getUnitHealth(targetUnit);
      if (targetUnit.damageMarkers >= unitHp) {
        this.triggerDestroyed(targetPlayer.playerId, targetUnit, {
          reason: 'battle',
          sourceInstanceId: resolvedAttackerInstanceId,
        });
        return true;
      }
      return false;
    };

    if (blocker && !attackerHasHighManeuver) {
      const blockerDamage = this.getUnitAttack(blocker);

      if (attackerHasFirstStrike && !blockerHasFirstStrike) {
        blockerDestroyed = applyDamageToUnit(blocker, defender, attackerDamage);
        if (!blockerDestroyed) {
          attackerDestroyed = applyDamageToUnit(attackingUnit, attacker, blockerDamage);
        }
      } else if (blockerHasFirstStrike && !attackerHasFirstStrike) {
        attackerDestroyed = applyDamageToUnit(attackingUnit, attacker, blockerDamage);
        if (!attackerDestroyed) {
          blockerDestroyed = applyDamageToUnit(blocker, defender, attackerDamage);
        }
      } else {
        blockerDestroyed = applyDamageToUnit(blocker, defender, attackerDamage);
        attackerDestroyed = applyDamageToUnit(attackingUnit, attacker, blockerDamage);
      }
    } else {
      const beforeShields = defender.shields.length;
      const damageResult = this.resolveDamage(defender, attackerDamage);
      shieldDamage = beforeShields - defender.shields.length;
      baseDamage = damageResult.baseDamage;
      revealedShieldIds = damageResult.revealedShieldIds;
    }

    this.state.currentCombat = {
      attackerPlayerId: resolvedAttackerPlayerId,
      defenderPlayerId: resolvedDefenderPlayerId,
      attackerInstanceIds: [resolvedAttackerInstanceId],
      blockerInstanceIds: blocker ? [blocker.instanceId] : [],
      target: target || combatCtx.target || 'shield',
      result: {
        attackerDamage,
        attackerDestroyed,
        blockerDestroyed,
        shieldDamage,
        baseDamage,
        revealedShieldIds,
        attackerHasFirstStrike,
        blockerHasFirstStrike,
        attackerHasHighManeuver,
      },
    };

    this.log(
      'RESOLVE_COMBAT',
      resolvedAttackerPlayerId,
      this.state.phase,
      `Combat resolved: attacker dealt ${attackerDamage}, shields broken ${shieldDamage}, base damage ${baseDamage}`,
      `First Strike (attacker/blocker): ${attackerHasFirstStrike}/${blockerHasFirstStrike}; High-Maneuver: ${attackerHasHighManeuver}.`
    );

    if (blockerDestroyed) {
      this.triggerBreach(resolvedAttackerPlayerId, resolvedAttackerInstanceId, {
        defenderPlayerId: resolvedDefenderPlayerId,
        destroyedUnitId: resolvedBlockerInstanceIds[0],
      });
    }

    return { valid: true };
  }

  public resolveDamage(
    defender: PlayerState,
    damageAmount: number,
  ): { revealedShieldIds: string[]; baseDamage: number } {
    const revealedShieldIds: string[] = [];
    const baseBefore = defender.baseHealth;

    // Official GCG shield rule: any attack with AP ≥ 1 destroys exactly ONE shield.
    // The shield card's stats are irrelevant — it is not a HP comparison.
    // If no shields remain, damage goes directly to the base.
    if (damageAmount >= 1 && defender.shields.length > 0) {
      const shield = defender.shields.splice(0, 1)[0];
      this.enqueueTrigger({
        type: 'BURST',
        sourceInstanceId: shield.instanceId,
        ownerPlayerId: defender.playerId,
        optionalChoice: true,
        description: `Burst check for shield ${shield.cardId}`,
        payload: { shieldCardId: shield.cardId },
      });
      shield.zone = 'trash';
      defender.discardPile.push(shield);
      revealedShieldIds.push(shield.cardId);
    } else if (damageAmount >= 1 && defender.shields.length === 0) {
      // No shields remain — damage hits the base directly
      defender.baseHealth -= damageAmount;
    }

    // Check win condition
    if (defender.baseHealth <= 0) {
      this.state.isGameOver = true;
      this.state.phase = 'gameOver';
    }

    return {
      revealedShieldIds,
      baseDamage: Math.max(0, baseBefore - defender.baseHealth),
    };
  }

  private getUnitAttack(unit: CardInstance): number {
    const definition = this.cardDb[unit.cardId] as any;
    const baseAttack = definition?.ap ?? definition?.atk ?? definition?.power ?? 5;
    const supportBuff = unit.counters.tempApBuff ?? 0;
    const pairBonus = unit.attachments.pilot ? 1 : 0;
    const linkBonus = unit.attachments.linked?.length ?? 0;
    return baseAttack + supportBuff + pairBonus + linkBonus;
  }

  private getUnitHealth(unit: CardInstance): number {
    const definition = this.cardDb[unit.cardId] as any;
    const baseHealth = definition?.hp ?? definition?.def ?? definition?.power ?? 5;
    const pairBonus = unit.attachments.pilot ? 1 : 0;
    const linkBonus = unit.attachments.linked?.length ?? 0;
    return baseHealth + pairBonus + linkBonus;
  }

  private hasKeyword(unit: CardInstance, candidates: string[]): boolean {
    const definition = this.cardDb[unit.cardId] as any;
    const keywords: string[] = definition?.keywords || [];
    const normalized = keywords.map((k) => String(k).toLowerCase());
    return candidates.some((candidate) => normalized.includes(candidate.toLowerCase()));
  }

  private triggerDestroyed(
    ownerPlayerId: string,
    unit: CardInstance,
    meta?: { reason?: string; sourceInstanceId?: string },
  ): void {
    const owner = this.state.players[ownerPlayerId];
    const idx = owner.battleArea.findIndex((u) => u.instanceId === unit.instanceId);
    if (idx >= 0) {
      owner.battleArea.splice(idx, 1);
    }
    unit.zone = 'trash';
    owner.discardPile.push(unit);

    this.enqueueTrigger({
      type: 'DESTROYED',
      sourceInstanceId: unit.instanceId,
      ownerPlayerId,
      optionalChoice: false,
      description: `Destroyed trigger from ${unit.cardId}`,
      payload: {
        reason: meta?.reason || 'effect',
        sourceInstanceId: meta?.sourceInstanceId,
      },
    });
  }

  private triggerBreach(
    attackerPlayerId: string,
    attackerInstanceId: string,
    payload?: Record<string, unknown>,
  ): void {
    this.enqueueTrigger({
      type: 'BREACH',
      sourceInstanceId: attackerInstanceId,
      ownerPlayerId: attackerPlayerId,
      optionalChoice: false,
      description: `Breach trigger from ${attackerInstanceId}`,
      payload,
    });
  }

  private triggerDeploy(playerId: string, instance: CardInstance): void {
    this.enqueueTrigger({
      type: 'DEPLOY',
      sourceInstanceId: instance.instanceId,
      ownerPlayerId: playerId,
      optionalChoice: false,
      description: `Deploy trigger from ${instance.cardId}`,
      payload: { cardId: instance.cardId },
    });
  }

  private triggerRepair(playerId: string): void {
    const player = this.state.players[playerId];
    player.battleArea.forEach((unit) => {
      if (!this.hasKeyword(unit, ['repair'])) return;
      this.enqueueTrigger({
        type: 'REPAIR',
        sourceInstanceId: unit.instanceId,
        ownerPlayerId: playerId,
        optionalChoice: false,
        description: `Repair trigger from ${unit.cardId}`,
        payload: { unitInstanceId: unit.instanceId },
      });
    });
  }

  private enqueueTrigger(
    trigger: Omit<TriggerEvent, 'id' | 'createdAt'>,
  ): void {
    const event: TriggerEvent = {
      id: `trg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      createdAt: Date.now(),
      ...trigger,
    };
    this.state.stack.push(event);
  }

  private drawTopCardToHand(playerId: string): CardInstance | null {
    const player = this.state.players[playerId];
    if (!player || player.deck.length === 0) return null;

    const card = player.deck.pop()!;
    card.zone = 'hand';
    player.hand.push(card);
    return card;
  }

  private handleResolveTrigger(action: GameAction): ActionValidation {
    const { triggerId, chooseResolve = true } = action.payload || {};
    if (!triggerId) {
      return { valid: false, error: 'Missing triggerId' };
    }

    const idx = this.state.stack.findIndex((trigger) => trigger.id === triggerId);
    if (idx === -1) {
      return { valid: false, error: 'Trigger not found' };
    }

    const trigger = this.state.stack[idx];
    this.state.stack.splice(idx, 1);

    if (trigger.optionalChoice && !chooseResolve) {
      this.log(
        'RESOLVE_TRIGGER',
        action.playerId,
        this.state.phase,
        `Skipped trigger ${trigger.type}`,
        `Optional trigger ${trigger.id} was declined.`,
      );
      return { valid: true };
    }

    this.applyTriggerEffect(trigger);
    this.log(
      'RESOLVE_TRIGGER',
      action.playerId,
      this.state.phase,
      `Resolved trigger ${trigger.type}`,
      trigger.description,
    );

    return { valid: true };
  }

  private handleResolveAllTriggers(action: GameAction): ActionValidation {
    while (this.state.stack.length > 0) {
      const trigger = this.state.stack.shift()!;
      this.applyTriggerEffect(trigger);
    }

    this.log(
      'RESOLVE_ALL_TRIGGERS',
      action.playerId,
      this.state.phase,
      'Resolved all pending triggers',
      'Trigger queue fully processed.',
    );

    return { valid: true };
  }

  private applyTriggerEffect(trigger: TriggerEvent): void {
    switch (trigger.type) {
      case 'DEPLOY': {
        const playerId = trigger.ownerPlayerId;
        const unitId = trigger.sourceInstanceId;
        if (!playerId || !unitId) break;

        const player = this.state.players[playerId];
        const unit = player.battleArea.find((u) => u.instanceId === unitId);
        if (!unit) break;

        if (this.hasKeyword(unit, ['draw_on_deploy', 'deploy_draw', 'deploy-draw'])) {
          const drawn = this.drawTopCardToHand(playerId);
          if (drawn) {
            this.log(
              'RESOLVE_TRIGGER',
              playerId,
              this.state.phase,
              `Deploy drew ${drawn.cardId}`,
              'Deploy trigger resolved and drew one card.',
            );
          }
        }
        break;
      }
      case 'ATTACK': {
        const sourceInstanceId = trigger.sourceInstanceId;
        const ownerPlayerId = trigger.ownerPlayerId;
        const defenderPlayerId = trigger.payload?.defenderPlayerId as string | undefined;
        if (!sourceInstanceId || !ownerPlayerId || !defenderPlayerId) break;

        const owner = this.state.players[ownerPlayerId];
        const attacker = owner.battleArea.find((u) => u.instanceId === sourceInstanceId);
        if (!attacker) break;

        if (this.hasKeyword(attacker, ['breach', 'shield_break', 'shield-break'])) {
          this.triggerBreach(ownerPlayerId, sourceInstanceId, {
            defenderPlayerId,
            via: 'attack-trigger',
          });
        }
        break;
      }
      case 'DESTROYED': {
        const playerId = trigger.ownerPlayerId;
        const sourceInstanceId = trigger.sourceInstanceId;
        if (!playerId || !sourceInstanceId) break;

        const owner = this.state.players[playerId];
        const destroyedHost = owner.discardPile.find((u) => u.instanceId === sourceInstanceId);
        if (!destroyedHost) break;

        const attachedCards: CardInstance[] = [];
        if (destroyedHost.attachments.pilot) {
          attachedCards.push(destroyedHost.attachments.pilot);
          delete destroyedHost.attachments.pilot;
        }
        if (destroyedHost.attachments.linked && destroyedHost.attachments.linked.length > 0) {
          attachedCards.push(...destroyedHost.attachments.linked);
          destroyedHost.attachments.linked = [];
        }

        attachedCards.forEach((attached) => {
          attached.zone = 'trash';
          owner.discardPile.push(attached);
        });
        break;
      }
      case 'BURST': {
        const playerId = trigger.ownerPlayerId;
        if (!playerId) break;

        const drawn = this.drawTopCardToHand(playerId);
        if (drawn) {
          this.log(
            'RESOLVE_TRIGGER',
            playerId,
            this.state.phase,
            `Burst drew ${drawn.cardId}`,
            'Burst trigger resolved and drew one card.',
          );
        }
        break;
      }
      case 'BREACH': {
        const defenderPlayerId = trigger.payload?.defenderPlayerId as string | undefined;
        if (!defenderPlayerId) break;

        const defender = this.state.players[defenderPlayerId];
        if (!defender) break;

        this.resolveDamage(defender, 1);
        break;
      }
      case 'PAIR':
      case 'LINK':
        break;
      case 'REPAIR': {
        const playerId = trigger.ownerPlayerId;
        const unitId = trigger.payload?.unitInstanceId as string | undefined;
        if (!playerId || !unitId) break;
        const player = this.state.players[playerId];
        const unit = player.battleArea.find((u) => u.instanceId === unitId);
        if (unit && unit.damageMarkers > 0) {
          unit.damageMarkers -= 1;
        }
        break;
      }
      default:
        break;
    }
  }

  private handlePlaceResource(action: GameAction): ActionValidation {
    const player = this.state.players[action.playerId];

    if (this.state.hasResourcePlacedThisTurn) {
      return {
        valid: false,
        error: 'Resource already placed this turn',
        rulesTrace: 'Only one resource card may be placed per Resource Phase.',
      };
    }

    if (player.resourceDeck.length === 0) {
      // Resource Deck exhausted — skip (not a loss condition)
      this.state.hasResourcePlacedThisTurn = true;
      this.log(
        'PLACE_RESOURCE',
        action.playerId,
        this.state.phase,
        'Resource Deck empty — Resource Phase skipped',
        'No cards in Resource Deck; phase skipped per official rules.',
      );
      return { valid: true };
    }

    // Take top of resource deck → place into resource area as ACTIVE
    const resourceCard = player.resourceDeck.shift()!;
    resourceCard.zone = 'resources';
    resourceCard.state = 'ready'; // enters active — can be spent immediately
    player.resources.push(resourceCard);
    this.state.hasResourcePlacedThisTurn = true;

    this.log(
      'PLACE_RESOURCE',
      action.playerId,
      this.state.phase,
      `Placed resource ${resourceCard.cardId} from Resource Deck`,
      'Top of Resource Deck moved to Resource Area (enters active).',
    );

    return { valid: true };
  }

  private handleEndPhase(action: GameAction): ActionValidation {
    this.state.phase = 'end';
    this.log('END_PHASE', action.playerId, this.state.phase, 'Phase ended', 'Cleanup.');
    return { valid: true };
  }

  private readyZone(playerId: string): void {
    const player = this.state.players[playerId];
    player.battleArea.forEach((u) => (u.state = 'ready'));
    player.resources.forEach((r) => (r.state = 'ready'));
    player.battleArea.forEach((u) => {
      u.usedAbilities.clear();
      delete u.counters.tempApBuff;
    });
  }

  public enforceHandLimit(playerId: string): void {
    const player = this.state.players[playerId];
    // Official 2025 Gundam TCG: Maximum hand limit is 10 cards
    while (player.hand.length > 10) {
      const discard = player.hand.shift();
      if (discard) {
        discard.zone = 'trash';
        player.discardPile.push(discard);
      }
    }
  }

  private log(
    actionType: string,
    playerId: string,
    phase: Phase,
    description: string,
    rulesTrace: string,
  ): void {
    // Skip logging if state not yet initialized
    if (!this.state) return;

    const entry: GameLogEntry = {
      timestamp: Date.now(),
      actionType: actionType as ActionType,
      activePlayer: playerId,
      phase,
      description,
      rulesTrace,
      state: {
        turnNumber: this.state.turnNumber,
        activePlayerId: this.state.activePlayerId,
        phase: this.state.phase,
        priorityPlayer: this.state.priorityPlayer,
        hasDrawnThisTurn: this.state.hasDrawnThisTurn,
        hasMainPhaseActions: this.state.hasMainPhaseActions,
        isGameOver: this.state.isGameOver,
        winner: this.state.winner,
      },
    };
    this.state.log.push(entry);
  }

  public getState(): GameState {
    return structuredClone(this.state);
  }

  /**
   * Save current game state to history
   * Removes any states after current index (if we've undone and then taken new action)
   */
  private saveStateToHistory(): void {
    // Remove states after current index
    this.stateHistory = this.stateHistory.slice(0, this.historyIndex + 1);

    // Add current state
    this.stateHistory.push(structuredClone(this.state));
    this.historyIndex++;

    // Keep history size under limit (keep most recent states)
    if (this.stateHistory.length > this.MAX_HISTORY) {
      this.stateHistory.shift();
      this.historyIndex--;
    }
  }

  /**
   * Undo last action
   * @returns true if undo was successful, false if already at start
   */
  public undo(): boolean {
    if (this.historyIndex <= 0) {
      return false; // Can't undo before start
    }

    this.historyIndex--;
    this.state = structuredClone(this.stateHistory[this.historyIndex]);
    return true;
  }

  /**
   * Redo last undone action
   * @returns true if redo was successful, false if already at latest state
   */
  public redo(): boolean {
    if (this.historyIndex >= this.stateHistory.length - 1) {
      return false; // Can't redo beyond latest state
    }

    this.historyIndex++;
    this.state = structuredClone(this.stateHistory[this.historyIndex]);
    return true;
  }

  /**
   * Check if undo is available
   */
  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  public canRedo(): boolean {
    return this.historyIndex < this.stateHistory.length - 1;
  }

  public getPlayerHand(playerId: string) {
    const player = this.state.players[playerId];
    return player.hand.map((card) => ({
      ...card,
      cardDef: this.cardDb[card.cardId],
    }));
  }

  public getBattleArea(playerId: string) {
    const player = this.state.players[playerId];
    return player.battleArea.map((card) => ({
      ...card,
      cardDef: this.cardDb[card.cardId],
    }));
  }

  /**
   * Draw cards during setup without going through the phase gate.
   * Used for opening hand draw (setup is not a regular turn draw).
   */
  public setupDraw(playerId: string, count: number): void {
    const player = this.state.players[playerId];
    if (!player) return;
    const drawn = Math.min(count, player.deck.length);
    for (let i = 0; i < drawn; i++) {
      const card = player.deck.pop()!;
      card.zone = 'hand';
      player.hand.push(card);
    }
    // Opening hand counts as the turn-1 draw so draw phase is instantly skippable
    this.state.hasDrawnThisTurn = true;
    this.log(
      'DRAW',
      playerId,
      this.state.phase,
      `Setup draw: ${drawn} cards`,
      `Opening hand draw bypasses phase gate.`,
    );
    this.saveStateToHistory();
  }

  /** Set which player acts first (call before game starts, while still in setup phase). */
  public setFirstPlayer(playerId: string): void {
    this.state.activePlayerId = playerId;
    this.state.priorityPlayer = playerId;
  }

  public getLog(): GameLogEntry[] {
    return [...this.state.log];
  }
}
