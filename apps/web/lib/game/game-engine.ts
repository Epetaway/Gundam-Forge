/**
 * Gundam TCG Game Engine
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
  exZone: {
    exBase?: CardInstance;
    exResources: CardInstance[];
  };
  baseHealth: number;
  maxBaseHealth: number;
  shieldsDrawnThisTurn: number;
  deckShuffleSeed: number;
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
  atk?: number;
  def?: number;
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

  constructor(
    deckId: string,
    deck: DeckDefinition,
    cardDatabase: Record<string, CardDefinition>,
  ) {
    this.cardDb = cardDatabase;
    this.state = this.initializeGame(deckId, deck);
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
      phase: 'setup',
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
      hasMainPhaseActions: 0,
    };

    this.log('GAME_START', 'player1', 'setup', 'Game initialized', 'Starting new playtest session');

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

    const shields = Array(5)
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
      exZone: { exResources: [] },
      baseHealth: 20,
      maxBaseHealth: 20,
      shieldsDrawnThisTurn: 0,
      deckShuffleSeed: rngSeed,
    };

    return player;
  }

  private createPlayerStateOpponent(playerId: string, rngSeed: number): PlayerState {
    return {
      playerId,
      name: 'Opponent',
      deck: [],
      hand: [],
      discardPile: [],
      battleArea: [],
      shields: Array(4)
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
      resources: [],
      exZone: { exResources: [] },
      baseHealth: 20,
      maxBaseHealth: 20,
      shieldsDrawnThisTurn: 0,
      deckShuffleSeed: rngSeed,
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

    switch (action.type) {
      case 'DRAW':
        return this.handleDraw(action);
      case 'ADVANCE_PHASE':
        return this.handleAdvancePhase(action);
      case 'PLAY_CARD':
        return this.handlePlayCard(action);
      case 'ACTIVATE_ABILITY':
        return this.handleActivateAbility(action);
      case 'PAIR_PILOT':
        return this.handlePairPilot(action);
      case 'DECLARE_ATTACK':
        return this.handleDeclareAttack(action);
      case 'DECLARE_BLOCK':
        return this.handleDeclareBlock(action);
      case 'RESOLVE_COMBAT':
        return this.handleResolveCombat(action);
      case 'RESOLVE_TRIGGER':
        return this.handleResolveTrigger(action);
      case 'RESOLVE_ALL_TRIGGERS':
        return this.handleResolveAllTriggers(action);
      case 'END_PHASE':
        return this.handleEndPhase(action);
      default:
        return { valid: false, error: `Unknown action: ${action.type}` };
    }
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
    const gates: Record<ActionType, Phase[]> = {
      DRAW: ['draw'],
      MULLIGAN: ['draw'],
      PLAY_CARD: ['main'],
      ACTIVATE_ABILITY: ['main', 'action'],
      PAIR_PILOT: ['main'],
      DECLARE_ATTACK: ['main'],
      DECLARE_BLOCK: ['battle'],
      RESOLVE_COMBAT: ['battle'],
      END_PHASE: ['main', 'action', 'battle'],
      ADVANCE_PHASE: ['setup', 'draw', 'main', 'action', 'battle', 'end'],
      SPEND_RESOURCE: ['main', 'action'],
      REST_UNIT: ['main'],
      READY_ZONE: ['setup'],
      RESOLVE_TRIGGER: ['main', 'action', 'battle', 'end'],
      RESOLVE_ALL_TRIGGERS: ['main', 'action', 'battle', 'end'],
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

  private handleAdvancePhase(action: GameAction): ActionValidation {
    const phaseSequence: Phase[] = ['setup', 'draw', 'main', 'action', 'battle', 'end'];
    const currentPhaseIndex = phaseSequence.indexOf(this.state.phase);

    if (currentPhaseIndex === -1) {
      return { valid: false, error: 'Invalid current phase' };
    }

    const nextPhase = phaseSequence[(currentPhaseIndex + 1) % phaseSequence.length];

    if (this.state.phase === 'draw' && !this.state.hasDrawnThisTurn) {
      return {
        valid: false,
        error: 'Must draw before advancing',
        rulesTrace: 'Draw phase requires drawing one card',
      };
    }

    if (nextPhase === 'setup') {
      this.state.turnNumber++;
      this.state.activePlayerId = this.state.activePlayerId === 'player1' ? 'player2' : 'player1';
      this.readyZone(this.state.activePlayerId);
      this.state.hasDrawnThisTurn = false;
    }

    if (this.state.phase === 'end') {
      this.enforceHandLimit(action.playerId);
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
      case 'battle':
        if (player.battleArea.length >= 3) {
          return {
            valid: false,
            error: 'Battle area full',
            rulesTrace: 'Cannot exceed 3 units',
          };
        }
        player.battleArea.push(card);
        break;
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

    this.state.phase = 'battle';

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
    let remainingDamage = damageAmount;
    const revealedShieldIds: string[] = [];
    const baseBefore = defender.baseHealth;

    // Shields protect base
    if (defender.shields.length > 0) {
      const shieldsDestroyed = Math.min(remainingDamage, defender.shields.length);
      const destroyed = defender.shields.splice(0, shieldsDestroyed);
      destroyed.forEach((shield) => {
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
      });
      remainingDamage -= shieldsDestroyed;
    }

    // Remaining damage to base
    if (remainingDamage > 0) {
      defender.baseHealth -= remainingDamage;
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
    return definition?.ap ?? definition?.atk ?? definition?.power ?? 5;
  }

  private getUnitHealth(unit: CardInstance): number {
    const definition = this.cardDb[unit.cardId] as any;
    return definition?.hp ?? definition?.def ?? definition?.power ?? 5;
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
      case 'DEPLOY':
      case 'ATTACK':
      case 'DESTROYED':
      case 'BURST':
      case 'BREACH':
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

  private handleEndPhase(action: GameAction): ActionValidation {
    this.triggerRepair(action.playerId);
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
    while (player.hand.length > 7) {
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
      state: { ...this.state },
    };
    this.state.log.push(entry);
  }

  public getState(): GameState {
    return { ...this.state };
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

  public getLog(): GameLogEntry[] {
    return [...this.state.log];
  }
}
