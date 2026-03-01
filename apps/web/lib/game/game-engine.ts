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
  stack: any[];
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
      case 'DECLARE_ATTACK':
        return this.handleDeclareAttack(action);
      case 'DECLARE_BLOCK':
        return this.handleDeclareBlock(action);
      case 'RESOLVE_COMBAT':
        return this.handleResolveCombat(action);
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
        targetUnit.zone = 'trash';
        const idx = targetPlayer.battleArea.findIndex((u) => u.instanceId === targetUnit.instanceId);
        if (idx >= 0) {
          targetPlayer.battleArea.splice(idx, 1);
          targetPlayer.discardPile.push(targetUnit);
        }
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

  private triggerDestroyed(unit: CardInstance): void {
    // Destroyed triggers would be resolved here
    // For now, just mark zone as trash
    unit.zone = 'trash';
  }

  private triggerBreach(): void {
    // Breach triggers only during attacker's turn when battle damage destroys defender
  }

  private triggerDeploy(instance: CardInstance): void {
    // Deploy triggers resolve after unit enters battle area
    instance.zone = 'battle';
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
