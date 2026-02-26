import type { CardDefinition } from './types';
import { getCardAP, getCardHP, getCardLevel } from './types';

export type PlayerIndex = 0 | 1;

export type TurnPhase = 'start' | 'draw' | 'resource' | 'main' | 'battle' | 'end';
export type PriorityWindow = 'main' | 'battle' | 'end';

export interface CardInstance {
  instanceId: string;
  owner: PlayerIndex;
  definition: CardDefinition;
  rested: boolean;
  damage: number;
  enteredTurn: number;
  attachedPilotId: string | null;
  attachedUnitId: string | null;
  isLinked: boolean;
  faceDown: boolean;
  tokenType: 'ex-base' | 'ex-resource' | null;
}

export interface PlayerState {
  id: string;
  name: string;
  mainDeck: string[];
  resourceDeck: string[];
  hand: string[];
  resourceArea: string[];
  battleArea: string[];
  shields: string[];
  base: string | null;
  trash: string[];
  removed: string[];
  defeated: boolean;
}

export interface PriorityState {
  window: PriorityWindow;
  currentPlayer: PlayerIndex;
  consecutivePasses: number;
}

export interface BattleState {
  attackerId: string;
  defenderIndex: PlayerIndex;
  target: { kind: 'player' } | { kind: 'unit'; unitId: string };
  blockerId: string | null;
  step: 'block' | 'action' | 'damage';
}

export type StackEffect =
  | { kind: 'draw'; player: PlayerIndex; amount: number }
  | { kind: 'damage-unit'; targetUnitId: string; amount: number }
  | { kind: 'damage-base'; player: PlayerIndex; amount: number }
  | { kind: 'destroy-unit'; targetUnitId: string }
  | { kind: 'create-temp-resource'; player: PlayerIndex; amount: number }
  | { kind: 'log'; message: string };

export interface StackItem {
  id: string;
  controller: PlayerIndex;
  sourceCardId: string;
  sourceInstanceId: string;
  description: string;
  effects: StackEffect[];
}

export interface PlaytestGameState {
  cards: Record<string, CardInstance>;
  players: [PlayerState, PlayerState];
  activePlayer: PlayerIndex;
  turn: number;
  phase: TurnPhase;
  battle: BattleState | null;
  priority: PriorityState | null;
  stack: StackItem[];
  pendingHandDiscards: number;
  gameOver: boolean;
  winner: PlayerIndex | null;
  log: string[];
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface ConstructedDeckValidation {
  isValid: boolean;
  errors: string[];
}

export interface PlayCardOptions {
  attachToUnitId?: string;
  targetUnitId?: string;
}

export type EngineAction =
  | { kind: 'advance-phase'; player: PlayerIndex }
  | { kind: 'play-card'; player: PlayerIndex; handCardId: string; options?: PlayCardOptions }
  | { kind: 'declare-attack'; player: PlayerIndex; attackerId: string; target: { kind: 'player' } | { kind: 'unit'; unitId: string } }
  | { kind: 'declare-block'; player: PlayerIndex; blockerId: string | null }
  | { kind: 'pass-priority'; player: PlayerIndex }
  | { kind: 'discard-hand-limit'; player: PlayerIndex; handCardId: string };

export type StrategyStyle = 'aggro' | 'midrange' | 'control' | 'combo';

export interface StrategyProfile {
  style: StrategyStyle;
  avgCost: number;
  unitRatio: number;
  commandRatio: number;
  pilotRatio: number;
}

export interface StrategicRecommendation {
  action: EngineAction;
  score: number;
  reason: string;
}

export interface EnginePlayerSetup {
  name: string;
  mainDeck: CardDefinition[];
  resourceDeck: CardDefinition[];
}

export interface CardScriptContext {
  engine: GundamPlaytestEngine;
  controller: PlayerIndex;
  opponent: PlayerIndex;
  source: CardInstance;
  targetUnitId?: string;
}

export interface CardScript {
  onPlay?: (ctx: CardScriptContext) => StackEffect[];
}

export type CardEffectRegistry = Record<string, CardScript>;
export type RandomFn = () => number;

export interface EngineInitOptions {
  players: [EnginePlayerSetup, EnginePlayerSetup];
  startingPlayer?: PlayerIndex;
  validateDecks?: boolean;
  effectRegistry?: CardEffectRegistry;
  rng?: RandomFn;
  seed?: number;
}

export const STARTING_HAND_SIZE = 5;
export const SHIELD_COUNT = 6;
export const MAX_HAND_SIZE = 10;
export const MAX_BATTLE_AREA = 6;
export const MAX_RESOURCE_AREA = 15;
export const MAIN_DECK_SIZE = 50;
export const RESOURCE_DECK_SIZE = 10;
export const MAX_COLORS = 2;
export const MAX_COPIES_PER_CARD = 4;

const EX_BASE_AP = 0;
const EX_BASE_HP = 3;

export const createSeededRng = (seed: number): RandomFn => {
  let state = seed >>> 0;
  return () => {
    state = ((state * 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const validateConstructedDeck = (
  mainDeck: CardDefinition[],
  resourceDeck: CardDefinition[]
): ConstructedDeckValidation => {
  const errors: string[] = [];

  if (mainDeck.length !== MAIN_DECK_SIZE) {
    errors.push(`Main deck must contain exactly ${MAIN_DECK_SIZE} cards (found ${mainDeck.length}).`);
  }
  if (resourceDeck.length !== RESOURCE_DECK_SIZE) {
    errors.push(`Resource deck must contain exactly ${RESOURCE_DECK_SIZE} cards (found ${resourceDeck.length}).`);
  }

  const copies: Record<string, number> = {};
  for (const card of [...mainDeck, ...resourceDeck]) {
    copies[card.id] = (copies[card.id] ?? 0) + 1;
  }
  for (const [cardId, qty] of Object.entries(copies)) {
    if (qty > MAX_COPIES_PER_CARD) {
      errors.push(`Card ${cardId} exceeds max copies (${qty}/${MAX_COPIES_PER_CARD}).`);
    }
  }

  const colors = new Set<string>();
  for (const card of [...mainDeck, ...resourceDeck]) {
    if (card.color !== 'Colorless') {
      colors.add(card.color);
    }
  }
  if (colors.size > MAX_COLORS) {
    errors.push(`Deck may use at most ${MAX_COLORS} non-Colorless colors (found: ${[...colors].sort().join(', ')}).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const shuffle = <T>(values: T[], rng: RandomFn): T[] => {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const exBaseDefinition: CardDefinition = {
  id: 'EX-BASE',
  name: 'EX Base',
  color: 'Colorless',
  cost: 0,
  type: 'Base',
  set: 'Token',
  ap: EX_BASE_AP,
  hp: EX_BASE_HP,
  text: 'Starting base token.',
};

const exResourceDefinition: CardDefinition = {
  id: 'EX-RESOURCE',
  name: 'EX Resource',
  color: 'Colorless',
  cost: 0,
  type: 'Resource',
  set: 'Token',
  text: 'Removed from game when used to pay cost.',
};

export class GundamPlaytestEngine {
  public readonly state: PlaytestGameState;

  private readonly rng: RandomFn;
  private readonly effects: CardEffectRegistry;
  private nextCardInstance = 1;
  private nextStackId = 1;

  public constructor(options: EngineInitOptions) {
    const validateDecks = options.validateDecks ?? true;
    if (validateDecks) {
      for (const player of options.players) {
        const check = validateConstructedDeck(player.mainDeck, player.resourceDeck);
        if (!check.isValid) {
          throw new Error(`Invalid deck for ${player.name}: ${check.errors.join(' ')}`);
        }
      }
    }

    this.rng = options.rng ?? (typeof options.seed === 'number' ? createSeededRng(options.seed) : Math.random);
    this.effects = options.effectRegistry ?? {};

    const startingPlayer: PlayerIndex = options.startingPlayer ?? 0;
    const secondPlayer: PlayerIndex = startingPlayer === 0 ? 1 : 0;
    const cards: Record<string, CardInstance> = {};

    const createInstance = (
      card: CardDefinition,
      owner: PlayerIndex,
      tokenType: CardInstance['tokenType'] = null
    ): string => {
      const id = `ci-${String(this.nextCardInstance++).padStart(5, '0')}`;
      cards[id] = {
        instanceId: id,
        owner,
        definition: card,
        rested: false,
        damage: 0,
        enteredTurn: 0,
        attachedPilotId: null,
        attachedUnitId: null,
        isLinked: false,
        faceDown: false,
        tokenType,
      };
      return id;
    };

    const buildPlayer = (setup: EnginePlayerSetup, index: PlayerIndex): PlayerState => {
      const mainIds = shuffle(setup.mainDeck.map((card) => createInstance(card, index)), this.rng);
      const resourceIds = shuffle(setup.resourceDeck.map((card) => createInstance(card, index)), this.rng);

      const hand = mainIds.splice(0, STARTING_HAND_SIZE);
      const shields = mainIds.splice(0, SHIELD_COUNT);
      for (const shieldId of shields) {
        cards[shieldId].faceDown = true;
      }

      const base = createInstance(exBaseDefinition, index, 'ex-base');

      return {
        id: `p${index + 1}`,
        name: setup.name,
        mainDeck: mainIds,
        resourceDeck: resourceIds,
        hand,
        resourceArea: [],
        battleArea: [],
        shields,
        base,
        trash: [],
        removed: [],
        defeated: false,
      };
    };

    const players: [PlayerState, PlayerState] = [
      buildPlayer(options.players[0], 0),
      buildPlayer(options.players[1], 1),
    ];

    const bonusResource = createInstance(exResourceDefinition, secondPlayer, 'ex-resource');
    players[secondPlayer].resourceArea.push(bonusResource);

    this.state = {
      cards,
      players,
      activePlayer: startingPlayer,
      turn: 1,
      phase: 'start',
      battle: null,
      priority: null,
      stack: [],
      pendingHandDiscards: 0,
      gameOver: false,
      winner: null,
      log: [`Game initialized. ${players[startingPlayer].name} takes the first turn.`],
    };
  }

  public registerScript(cardId: string, script: CardScript): void {
    this.effects[cardId] = script;
  }

  public snapshot(): PlaytestGameState {
    return structuredClone(this.state);
  }

  public advanceToNextPhase(): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }

    switch (this.state.phase) {
      case 'start':
        this.startStep();
        this.state.phase = 'draw';
        this.state.log.push(`Turn ${this.state.turn}: Draw phase.`);
        return { ok: true };

      case 'draw':
        this.drawCards(this.state.activePlayer, 1);
        if (this.state.gameOver) {
          return { ok: true };
        }
        this.state.phase = 'resource';
        this.state.log.push(`Turn ${this.state.turn}: Resource phase.`);
        return { ok: true };

      case 'resource':
        this.placeResourceForTurn(this.state.activePlayer);
        this.state.phase = 'main';
        this.openPriority('main', this.state.activePlayer);
        this.state.log.push(`Turn ${this.state.turn}: Main phase started.`);
        return { ok: true };

      case 'main':
      case 'battle':
      case 'end':
        return { ok: false, error: 'Use action windows and priority passing to leave this phase.' };
    }
  }

  public playCard(player: PlayerIndex, handCardId: string, options: PlayCardOptions = {}): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }
    if (!this.state.priority || this.state.priority.currentPlayer !== player) {
      return { ok: false, error: 'Player does not currently have priority.' };
    }

    const playerState = this.state.players[player];
    const handIndex = playerState.hand.indexOf(handCardId);
    if (handIndex === -1) {
      return { ok: false, error: 'Card is not in hand.' };
    }

    const card = this.state.cards[handCardId];
    if (!card) {
      return { ok: false, error: 'Card instance not found.' };
    }

    if (card.definition.type === 'Command') {
      if (!this.canPlayCommandInCurrentWindow()) {
        return { ok: false, error: 'Commands can only be played in an action window.' };
      }
    } else {
      if (this.state.phase !== 'main' || this.state.priority.window !== 'main') {
        return { ok: false, error: 'Units, Pilots, and Bases may only be played in the main action window.' };
      }
      if (player !== this.state.activePlayer) {
        return { ok: false, error: 'Only the active player can play permanent cards in main phase.' };
      }
    }

    const payCheck = this.canPayForCard(player, card.definition);
    if (!payCheck.ok) {
      return payCheck;
    }
    this.payCost(player, card.definition.cost);

    playerState.hand.splice(handIndex, 1);

    if (card.definition.type === 'Unit') {
      if (playerState.battleArea.length >= MAX_BATTLE_AREA) {
        playerState.hand.splice(handIndex, 0, handCardId);
        return { ok: false, error: `Battle area is full (max ${MAX_BATTLE_AREA}).` };
      }
      card.enteredTurn = this.state.turn;
      card.rested = false;
      card.damage = 0;
      playerState.battleArea.push(handCardId);
      this.state.log.push(`${playerState.name} deployed ${card.definition.name}.`);
    } else if (card.definition.type === 'Pilot') {
      if (!options.attachToUnitId) {
        playerState.hand.splice(handIndex, 0, handCardId);
        return { ok: false, error: 'Pilot play requires attachToUnitId.' };
      }
      const attachResult = this.attachPilotToUnit(player, handCardId, options.attachToUnitId);
      if (!attachResult.ok) {
        playerState.hand.splice(handIndex, 0, handCardId);
        return attachResult;
      }
      this.state.log.push(`${playerState.name} paired ${card.definition.name}.`);
    } else if (card.definition.type === 'Base') {
      if (playerState.base) {
        this.moveToTrash(player, playerState.base);
      }
      card.damage = 0;
      card.rested = false;
      playerState.base = handCardId;
      this.state.log.push(`${playerState.name} deployed base ${card.definition.name}.`);
    } else if (card.definition.type === 'Command') {
      this.moveToTrash(player, handCardId);
      this.queueCommandEffect(card, player, options.targetUnitId);
      this.state.log.push(`${playerState.name} played command ${card.definition.name}.`);
    } else if (card.definition.type === 'Resource') {
      playerState.resourceArea.push(handCardId);
      this.state.log.push(`${playerState.name} moved ${card.definition.name} to resources.`);
    }

    this.postActionPriorityShift(player);
    return { ok: true };
  }

  public declareAttack(
    player: PlayerIndex,
    attackerId: string,
    target: { kind: 'player' } | { kind: 'unit'; unitId: string }
  ): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }
    if (this.state.phase !== 'main' || !this.state.priority || this.state.priority.window !== 'main') {
      return { ok: false, error: 'Attacks may only be declared in main phase action window.' };
    }
    if (player !== this.state.activePlayer || this.state.priority.currentPlayer !== player) {
      return { ok: false, error: 'Only the active player with priority may declare an attack.' };
    }

    const attacker = this.state.cards[attackerId];
    if (!attacker || attacker.owner !== player) {
      return { ok: false, error: 'Attacking unit was not found.' };
    }
    if (attacker.definition.type !== 'Unit') {
      return { ok: false, error: 'Only Units can attack.' };
    }
    if (!this.state.players[player].battleArea.includes(attackerId)) {
      return { ok: false, error: 'Attacking unit is not in battle area.' };
    }
    if (attacker.rested) {
      return { ok: false, error: 'Attacking unit must be active.' };
    }
    if (attacker.enteredTurn === this.state.turn && !attacker.isLinked) {
      return { ok: false, error: 'Unit cannot attack on the turn it entered unless linked.' };
    }

    const defender = this.other(player);
    if (target.kind === 'unit') {
      const targetUnit = this.state.cards[target.unitId];
      if (!targetUnit || !this.state.players[defender].battleArea.includes(target.unitId)) {
        return { ok: false, error: 'Target unit was not found.' };
      }
      if (!targetUnit.rested) {
        return { ok: false, error: 'Only rested enemy units can be attacked directly.' };
      }
    }

    attacker.rested = true;
    this.state.phase = 'battle';
    this.state.priority = null;
    this.state.battle = {
      attackerId,
      defenderIndex: defender,
      target,
      blockerId: null,
      step: 'block',
    };

    const defenderName = this.state.players[defender].name;
    this.state.log.push(`${this.state.players[player].name} declares attack. ${defenderName} may declare a block.`);
    return { ok: true };
  }

  public declareBlock(player: PlayerIndex, blockerId: string | null): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }
    if (this.state.phase !== 'battle' || !this.state.battle || this.state.battle.step !== 'block') {
      return { ok: false, error: 'Not currently in block step.' };
    }
    if (player !== this.state.battle.defenderIndex) {
      return { ok: false, error: 'Only defending player may declare a block.' };
    }

    if (blockerId !== null) {
      const blocker = this.state.cards[blockerId];
      if (!blocker || blocker.definition.type !== 'Unit') {
        return { ok: false, error: 'Blocker must be a unit.' };
      }
      if (!this.state.players[player].battleArea.includes(blockerId)) {
        return { ok: false, error: 'Blocker is not in battle area.' };
      }
      if (blocker.rested) {
        return { ok: false, error: 'Blocker must be active.' };
      }
      blocker.rested = true;
      this.state.battle.blockerId = blockerId;
      this.state.log.push(`${this.state.players[player].name} blocks with ${blocker.definition.name}.`);
    } else {
      this.state.log.push(`${this.state.players[player].name} does not block.`);
    }

    this.state.battle.step = 'action';
    this.openPriority('battle', player);
    return { ok: true };
  }

  public passPriority(player: PlayerIndex): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }
    if (!this.state.priority) {
      return { ok: false, error: 'No active priority window.' };
    }
    if (this.state.priority.currentPlayer !== player) {
      return { ok: false, error: 'Player does not currently have priority.' };
    }

    this.state.priority.consecutivePasses += 1;
    this.state.log.push(`${this.state.players[player].name} passes priority.`);
    this.state.priority.currentPlayer = this.other(player);

    if (this.state.priority.consecutivePasses < 2) {
      return { ok: true };
    }

    if (this.state.stack.length > 0) {
      this.resolveTopOfStack();
      if (this.state.gameOver) {
        this.state.priority = null;
        return { ok: true };
      }
      if (this.state.priority) {
        this.state.priority.consecutivePasses = 0;
        this.state.priority.currentPlayer = this.state.activePlayer;
      }
      return { ok: true };
    }

    const window = this.state.priority.window;
    this.state.priority = null;

    if (window === 'main') {
      this.state.phase = 'end';
      this.state.log.push('Main phase ended. End phase action window starts.');
      this.openPriority('end', this.other(this.state.activePlayer));
      return { ok: true };
    }

    if (window === 'battle') {
      if (!this.state.battle) {
        return { ok: false, error: 'Battle state missing.' };
      }
      this.state.battle.step = 'damage';
      this.resolveBattleDamage();
      return { ok: true };
    }

    this.tryFinishTurnFromEndWindow();
    return { ok: true };
  }

  public discardForHandLimit(player: PlayerIndex, handCardId: string): ActionResult {
    if (this.state.gameOver) {
      return { ok: false, error: 'Game is already over.' };
    }
    if (this.state.phase !== 'end' || this.state.pendingHandDiscards <= 0) {
      return { ok: false, error: 'No hand-limit discard is currently required.' };
    }
    if (player !== this.state.activePlayer) {
      return { ok: false, error: 'Only the active player discards for hand limit.' };
    }

    const active = this.state.players[player];
    const idx = active.hand.indexOf(handCardId);
    if (idx === -1) {
      return { ok: false, error: 'Card is not in hand.' };
    }

    active.hand.splice(idx, 1);
    this.moveToTrash(player, handCardId);
    this.state.pendingHandDiscards -= 1;
    this.state.log.push(`${active.name} discards for hand limit (${this.state.pendingHandDiscards} remaining).`);

    if (this.state.pendingHandDiscards === 0) {
      this.finishTurn();
    }
    return { ok: true };
  }

  private startStep(): void {
    const active = this.state.players[this.state.activePlayer];
    for (const resourceId of active.resourceArea) {
      const card = this.state.cards[resourceId];
      if (card) {
        card.rested = false;
      }
    }
    for (const unitId of active.battleArea) {
      const card = this.state.cards[unitId];
      if (card) {
        card.rested = false;
      }
    }
    if (active.base) {
      const base = this.state.cards[active.base];
      if (base) {
        base.rested = false;
      }
    }
    this.state.log.push(`Turn ${this.state.turn}: Start step ready (${active.name}).`);
  }

  private canPlayCommandInCurrentWindow(): boolean {
    if (!this.state.priority) {
      return false;
    }
    if (this.state.priority.window === 'main') {
      return this.state.phase === 'main';
    }
    if (this.state.priority.window === 'battle') {
      return this.state.phase === 'battle' && this.state.battle?.step === 'action';
    }
    return this.state.phase === 'end';
  }

  private canPayForCard(player: PlayerIndex, card: CardDefinition): ActionResult {
    const state = this.state.players[player];
    const totalResources = state.resourceArea.length;
    const requiredLevel = getCardLevel(card);
    if (totalResources < requiredLevel) {
      return { ok: false, error: `Need level ${requiredLevel} (resources ${totalResources}).` };
    }

    const activeResources = state.resourceArea.filter((id) => !this.state.cards[id].rested).length;
    if (activeResources < card.cost) {
      return { ok: false, error: `Need ${card.cost} active resources (have ${activeResources}).` };
    }

    return { ok: true };
  }

  private payCost(player: PlayerIndex, cost: number): void {
    if (cost <= 0) {
      return;
    }
    const state = this.state.players[player];
    let remaining = cost;

    for (let i = 0; i < state.resourceArea.length && remaining > 0; i++) {
      const resourceId = state.resourceArea[i];
      const resource = this.state.cards[resourceId];
      if (!resource || resource.rested) {
        continue;
      }

      if (resource.tokenType === 'ex-resource') {
        state.resourceArea.splice(i, 1);
        i--;
        state.removed.push(resourceId);
        this.state.log.push(`${state.name} uses and removes EX Resource.`);
      } else {
        resource.rested = true;
      }
      remaining--;
    }
  }

  private attachPilotToUnit(player: PlayerIndex, pilotId: string, unitId: string): ActionResult {
    const pilot = this.state.cards[pilotId];
    const unit = this.state.cards[unitId];
    if (!pilot || !unit) {
      return { ok: false, error: 'Pilot or target unit not found.' };
    }
    if (unit.definition.type !== 'Unit') {
      return { ok: false, error: 'Pilot may only attach to a Unit.' };
    }
    if (!this.state.players[player].battleArea.includes(unitId)) {
      return { ok: false, error: 'Target unit is not controlled by player.' };
    }
    if (unit.attachedPilotId) {
      return { ok: false, error: 'Target unit already has a paired pilot.' };
    }

    unit.attachedPilotId = pilotId;
    pilot.attachedUnitId = unitId;
    pilot.enteredTurn = this.state.turn;

    if (unit.definition.linkCondition) {
      const key = unit.definition.linkCondition.toLowerCase();
      const pilotText = `${pilot.definition.name} ${(pilot.definition.traits ?? []).join(' ')}`.toLowerCase();
      unit.isLinked = pilotText.includes(key);
    }

    return { ok: true };
  }

  private queueCommandEffect(source: CardInstance, controller: PlayerIndex, targetUnitId?: string): void {
    const script = this.effects[source.definition.id];
    const effects = script?.onPlay?.({
      engine: this,
      controller,
      opponent: this.other(controller),
      source,
      targetUnitId,
    }) ?? [{ kind: 'log', message: `${source.definition.name} resolves with no scripted effect.` }];

    const item: StackItem = {
      id: `stack-${String(this.nextStackId++).padStart(4, '0')}`,
      controller,
      sourceCardId: source.definition.id,
      sourceInstanceId: source.instanceId,
      description: `${source.definition.name} effect`,
      effects,
    };
    this.state.stack.push(item);
    this.state.log.push(`Effect queued: ${item.description}.`);
  }

  private resolveTopOfStack(): void {
    const item = this.state.stack.pop();
    if (!item) {
      return;
    }

    this.state.log.push(`Resolving stack item: ${item.description}.`);
    for (const effect of item.effects) {
      this.resolveEffect(effect);
      if (this.state.gameOver) {
        return;
      }
      this.runStateBasedActions();
      if (this.state.gameOver) {
        return;
      }
    }
  }

  private resolveEffect(effect: StackEffect): void {
    if (effect.kind === 'draw') {
      this.drawCards(effect.player, effect.amount);
      return;
    }
    if (effect.kind === 'damage-unit') {
      const target = this.state.cards[effect.targetUnitId];
      if (target && target.definition.type === 'Unit') {
        target.damage += effect.amount;
        this.state.log.push(`${target.definition.name} takes ${effect.amount} effect damage.`);
      }
      return;
    }
    if (effect.kind === 'damage-base') {
      const player = this.state.players[effect.player];
      if (player.base) {
        const base = this.state.cards[player.base];
        base.damage += effect.amount;
        this.state.log.push(`${player.name}'s base takes ${effect.amount} effect damage.`);
      }
      return;
    }
    if (effect.kind === 'destroy-unit') {
      const owner = this.findCardOwner(effect.targetUnitId);
      if (owner !== null) {
        this.destroyUnit(owner, effect.targetUnitId, 'destroyed by effect');
      }
      return;
    }
    if (effect.kind === 'create-temp-resource') {
      for (let i = 0; i < effect.amount; i++) {
        const id = this.createToken(effect.player, exResourceDefinition, 'ex-resource');
        this.state.players[effect.player].resourceArea.push(id);
      }
      this.state.log.push(`${this.state.players[effect.player].name} gains ${effect.amount} temporary resource(s).`);
      return;
    }
    this.state.log.push(effect.message);
  }

  private createToken(player: PlayerIndex, definition: CardDefinition, tokenType: CardInstance['tokenType']): string {
    const id = `ci-${String(this.nextCardInstance++).padStart(5, '0')}`;
    this.state.cards[id] = {
      instanceId: id,
      owner: player,
      definition,
      rested: false,
      damage: 0,
      enteredTurn: this.state.turn,
      attachedPilotId: null,
      attachedUnitId: null,
      isLinked: false,
      faceDown: false,
      tokenType,
    };
    return id;
  }

  private resolveBattleDamage(): void {
    const battle = this.state.battle;
    if (!battle) {
      return;
    }

    const attacker = this.state.cards[battle.attackerId];
    if (!attacker || !this.state.players[this.state.activePlayer].battleArea.includes(attacker.instanceId)) {
      this.state.log.push('Attacker is no longer on battlefield. Battle ends.');
      this.endBattleAndReturnToMain();
      return;
    }

    const defenderIndex = battle.defenderIndex;
    const attackerAp = this.getEffectiveAP(attacker.instanceId);

    if (battle.target.kind === 'player') {
      const defender = this.state.players[defenderIndex];
      if (defender.base) {
        const base = this.state.cards[defender.base];
        base.damage += attackerAp;
        this.state.log.push(`${attacker.definition.name} deals ${attackerAp} damage to ${defender.name}'s base.`);
      } else if (defender.shields.length > 0) {
        const shieldId = defender.shields.shift()!;
        this.state.cards[shieldId].faceDown = false;
        this.moveToTrash(defenderIndex, shieldId);
        this.state.log.push(`${defender.name} loses one shield (${defender.shields.length} remaining).`);
      } else {
        defender.defeated = true;
        this.state.gameOver = true;
        this.state.winner = this.state.activePlayer;
        this.state.log.push(`${defender.name} takes battle damage with no base/shields and loses.`);
      }
    } else {
      const defenderUnitId = battle.blockerId ?? battle.target.unitId;
      const defenderUnit = this.state.cards[defenderUnitId];

      if (defenderUnit && this.state.players[defenderIndex].battleArea.includes(defenderUnitId)) {
        const defenderAp = this.getEffectiveAP(defenderUnitId);
        defenderUnit.damage += attackerAp;
        attacker.damage += defenderAp;
        this.state.log.push(
          `${attacker.definition.name} (${attackerAp} AP) and ${defenderUnit.definition.name} (${defenderAp} AP) deal simultaneous damage.`
        );
      }
    }

    if (!this.state.gameOver) {
      this.runStateBasedActions();
    }
    if (!this.state.gameOver) {
      this.endBattleAndReturnToMain();
    } else {
      this.state.priority = null;
      this.state.battle = null;
    }
  }

  private endBattleAndReturnToMain(): void {
    this.state.battle = null;
    this.state.phase = 'main';
    this.openPriority('main', this.state.activePlayer);
    this.state.log.push('Battle ended. Main action window resumes.');
  }

  private runStateBasedActions(): void {
    for (let player: PlayerIndex = 0; player < 2; player = (player + 1) as PlayerIndex) {
      const playerState = this.state.players[player];

      if (playerState.base) {
        const base = this.state.cards[playerState.base];
        const baseHp = this.getEffectiveHP(playerState.base);
        if (base.damage >= baseHp) {
          this.state.log.push(`${playerState.name}'s base is destroyed.`);
          this.moveToTrash(player, playerState.base);
          playerState.base = null;
        }
      }

      const deadUnits: string[] = [];
      for (const unitId of playerState.battleArea) {
        const hp = this.getEffectiveHP(unitId);
        const unit = this.state.cards[unitId];
        if (unit.damage >= hp) {
          deadUnits.push(unitId);
        }
      }
      for (const unitId of deadUnits) {
        this.destroyUnit(player, unitId, 'destroyed by damage');
      }
    }
  }

  private destroyUnit(player: PlayerIndex, unitId: string, reason: string): void {
    const playerState = this.state.players[player];
    const idx = playerState.battleArea.indexOf(unitId);
    if (idx === -1) {
      return;
    }

    playerState.battleArea.splice(idx, 1);
    const unit = this.state.cards[unitId];
    if (unit.attachedPilotId) {
      const pilotId = unit.attachedPilotId;
      const pilot = this.state.cards[pilotId];
      if (pilot) {
        pilot.attachedUnitId = null;
      }
      unit.attachedPilotId = null;
      this.moveToTrash(player, pilotId);
    }
    this.moveToTrash(player, unitId);
    this.state.log.push(`${unit.definition.name} is ${reason}.`);
  }

  private getEffectiveAP(unitId: string): number {
    const unit = this.state.cards[unitId];
    if (!unit) {
      return 0;
    }
    let ap = getCardAP(unit.definition);
    if (unit.attachedPilotId) {
      const pilot = this.state.cards[unit.attachedPilotId];
      if (pilot) {
        ap += pilot.definition.apModifier ?? getCardAP(pilot.definition);
      }
    }
    return Math.max(0, ap);
  }

  private getEffectiveHP(cardId: string): number {
    const card = this.state.cards[cardId];
    if (!card) {
      return 0;
    }
    let hp = getCardHP(card.definition);
    if (card.attachedPilotId) {
      const pilot = this.state.cards[card.attachedPilotId];
      if (pilot) {
        hp += pilot.definition.hpModifier ?? getCardHP(pilot.definition);
      }
    }
    return Math.max(0, hp);
  }

  private drawCards(player: PlayerIndex, amount: number): void {
    const playerState = this.state.players[player];
    for (let i = 0; i < amount; i++) {
      if (playerState.mainDeck.length === 0) {
        playerState.defeated = true;
        this.state.gameOver = true;
        this.state.winner = this.other(player);
        this.state.log.push(`${playerState.name} cannot draw and loses by deck-out.`);
        return;
      }
      const top = playerState.mainDeck.shift()!;
      this.state.cards[top].faceDown = false;
      playerState.hand.push(top);
    }
  }

  private placeResourceForTurn(player: PlayerIndex): void {
    const playerState = this.state.players[player];
    if (playerState.resourceArea.length >= MAX_RESOURCE_AREA) {
      this.state.log.push(`${playerState.name} cannot place a resource (resource area full).`);
      return;
    }
    if (playerState.resourceDeck.length === 0) {
      this.state.log.push(`${playerState.name} has no resource cards left to place.`);
      return;
    }
    const top = playerState.resourceDeck.shift()!;
    const card = this.state.cards[top];
    card.rested = false;
    playerState.resourceArea.push(top);
    this.state.log.push(`${playerState.name} places ${card.definition.name} as resource.`);
  }

  private openPriority(window: PriorityWindow, firstPlayer: PlayerIndex): void {
    this.state.priority = {
      window,
      currentPlayer: firstPlayer,
      consecutivePasses: 0,
    };
  }

  private postActionPriorityShift(actingPlayer: PlayerIndex): void {
    if (!this.state.priority) {
      return;
    }
    this.state.priority.currentPlayer = this.other(actingPlayer);
    this.state.priority.consecutivePasses = 0;
  }

  private tryFinishTurnFromEndWindow(): void {
    const active = this.state.players[this.state.activePlayer];
    const excess = active.hand.length - MAX_HAND_SIZE;
    if (excess > 0) {
      this.state.pendingHandDiscards = excess;
      this.state.log.push(`${active.name} must discard ${excess} card(s) for hand limit.`);
      return;
    }
    this.finishTurn();
  }

  private finishTurn(): void {
    this.state.pendingHandDiscards = 0;
    this.state.priority = null;
    this.state.battle = null;
    this.state.phase = 'start';
    this.state.activePlayer = this.other(this.state.activePlayer);
    this.state.turn += 1;
    this.state.log.push(`Turn ${this.state.turn}: ${this.state.players[this.state.activePlayer].name}'s turn begins.`);
  }

  private moveToTrash(player: PlayerIndex, cardId: string): void {
    const playerState = this.state.players[player];
    this.removeFromAllZones(player, cardId);
    playerState.trash.push(cardId);
  }

  private removeFromAllZones(player: PlayerIndex, cardId: string): void {
    const state = this.state.players[player];
    state.hand = state.hand.filter((id) => id !== cardId);
    state.mainDeck = state.mainDeck.filter((id) => id !== cardId);
    state.resourceDeck = state.resourceDeck.filter((id) => id !== cardId);
    state.resourceArea = state.resourceArea.filter((id) => id !== cardId);
    state.battleArea = state.battleArea.filter((id) => id !== cardId);
    state.shields = state.shields.filter((id) => id !== cardId);
    state.removed = state.removed.filter((id) => id !== cardId);
    if (state.base === cardId) {
      state.base = null;
    }
  }

  private findCardOwner(cardId: string): PlayerIndex | null {
    for (let player: PlayerIndex = 0; player < 2; player = (player + 1) as PlayerIndex) {
      const state = this.state.players[player];
      if (
        state.hand.includes(cardId) ||
        state.mainDeck.includes(cardId) ||
        state.resourceDeck.includes(cardId) ||
        state.resourceArea.includes(cardId) ||
        state.battleArea.includes(cardId) ||
        state.shields.includes(cardId) ||
        state.base === cardId ||
        state.trash.includes(cardId) ||
        state.removed.includes(cardId)
      ) {
        return player;
      }
      const card = this.state.cards[cardId];
      if (card?.owner === player) {
        return player;
      }
    }
    return null;
  }

  private other(player: PlayerIndex): PlayerIndex {
    return player === 0 ? 1 : 0;
  }
}
