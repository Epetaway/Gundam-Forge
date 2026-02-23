import { create } from 'zustand';
import type { CardDefinition } from '@gundam-forge/shared';
import {
  initializeSoloGame,
  advancePhase,
  deployUnit,
  pairPilot,
  playCommand,
  deployBase,
  declareAttack,
  declareBlock,
  resolveBattleDamage,
  drawCards,
  mulligan,
  toggleActive,
  addDamage,
  destroyCard,
  returnToHand,
  discardFromHand,
  shuffleDeck,
  type GameState,
  type GameCard,
  type TurnPhase,
  getEffectiveAP,
  getEffectiveHP,
  getRemainingHP,
  getActivePlayer,
  countActiveResources,
  countTotalResources,
  PHASE_LABELS,
  BATTLE_PHASE_ORDER,
} from '@gundam-forge/shared';
import type { DeckEntry } from '../deckbuilder/deckStore';

// ── Types ─────────────────────────────────────────────────────────

export interface SimState {
  gameState: GameState | null;
  undoStack: GameState[];
  selectedInstanceId: string | null;
  hoveredZone: string | null;

  // Initialization
  startGame: (entries: DeckEntry[], cards: CardDefinition[]) => void;
  resetGame: () => void;

  // Phase control
  nextPhase: () => void;

  // Card actions
  playCard: (instanceId: string, targetUnitId?: string) => string | null;
  attack: (attackerId: string, target: { kind: 'player' } | { kind: 'unit'; unitId: string }) => string | null;
  block: (blockerId: string) => string | null;
  resolveDamage: () => string | null;

  // Manual actions (goldfish mode)
  manualDraw: (count?: number) => void;
  manualMulligan: () => void;
  manualToggleActive: (instanceId: string) => void;
  manualAddDamage: (instanceId: string, amount: number) => void;
  manualDestroy: (instanceId: string) => void;
  manualReturnToHand: (instanceId: string) => void;
  manualDiscard: (instanceId: string) => void;
  manualShuffleDeck: () => void;

  // UI state
  setSelectedInstanceId: (id: string | null) => void;
  setHoveredZone: (zone: string | null) => void;

  // Undo
  undo: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────

const buildMainDeck = (entries: DeckEntry[], cards: CardDefinition[]): CardDefinition[] => {
  const cardsById = new Map(cards.map((c) => [c.id, c]));
  const result: CardDefinition[] = [];
  for (const entry of entries) {
    const card = cardsById.get(entry.cardId);
    if (!card || card.type === 'Resource') continue;
    for (let i = 0; i < entry.qty; i++) {
      result.push(card);
    }
  }
  return result;
};

const buildResourceDeck = (entries: DeckEntry[], cards: CardDefinition[]): CardDefinition[] => {
  const cardsById = new Map(cards.map((c) => [c.id, c]));
  const result: CardDefinition[] = [];
  for (const entry of entries) {
    const card = cardsById.get(entry.cardId);
    if (!card || card.type !== 'Resource') continue;
    for (let i = 0; i < entry.qty; i++) {
      result.push(card);
    }
  }
  return result;
};

// ── Store ──────────────────────────────────────────────────────────

export const useSimStore = create<SimState>((set, get) => ({
  gameState: null,
  undoStack: [],
  selectedInstanceId: null,
  hoveredZone: null,

  startGame: (entries, cards) => {
    const mainDeck = buildMainDeck(entries, cards);
    const resourceDeck = buildResourceDeck(entries, cards);
    const state = initializeSoloGame(
      mainDeck,
      resourceDeck.length > 0 ? resourceDeck : undefined,
      'Player',
    );
    set({ gameState: state, undoStack: [], selectedInstanceId: null });
  },

  resetGame: () => {
    set({ gameState: null, undoStack: [], selectedInstanceId: null });
  },

  nextPhase: () => {
    const { gameState } = get();
    if (!gameState || gameState.gameOver) return;
    const prev = gameState;
    const next = advancePhase(gameState);
    set({ gameState: next, undoStack: [...get().undoStack, prev] });
  },

  playCard: (instanceId, targetUnitId) => {
    const { gameState } = get();
    if (!gameState) return 'No game in progress.';

    const player = getActivePlayer(gameState);
    const card = player.hand.find((c) => c.instanceId === instanceId);
    if (!card) return 'Card not in hand.';

    let result;
    switch (card.definition.type) {
      case 'Unit':
        result = deployUnit(gameState, instanceId);
        break;
      case 'Pilot':
        if (!targetUnitId) return 'Select a unit to pair with this pilot.';
        result = pairPilot(gameState, instanceId, targetUnitId);
        break;
      case 'Command':
        result = playCommand(gameState, instanceId);
        break;
      case 'Base':
        result = deployBase(gameState, instanceId);
        break;
      default:
        return 'Cannot play this card type.';
    }

    if (!result.success) return result.error ?? 'Action failed.';
    set({ gameState: result.state, undoStack: [...get().undoStack, gameState] });
    return null;
  },

  attack: (attackerId, target) => {
    const { gameState } = get();
    if (!gameState) return 'No game in progress.';
    const result = declareAttack(gameState, attackerId, target);
    if (!result.success) return result.error ?? 'Attack failed.';
    set({ gameState: result.state, undoStack: [...get().undoStack, gameState] });
    return null;
  },

  block: (blockerId) => {
    const { gameState } = get();
    if (!gameState) return 'No game in progress.';
    const result = declareBlock(gameState, blockerId);
    if (!result.success) return result.error ?? 'Block failed.';
    set({ gameState: result.state, undoStack: [...get().undoStack, gameState] });
    return null;
  },

  resolveDamage: () => {
    const { gameState } = get();
    if (!gameState) return 'No game in progress.';
    const result = resolveBattleDamage(gameState);
    if (!result.success) return result.error ?? 'Resolve failed.';
    set({ gameState: result.state, undoStack: [...get().undoStack, gameState] });
    return null;
  },

  manualDraw: (count = 1) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = drawCards(gameState, 0, count);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualMulligan: () => {
    const { gameState } = get();
    if (!gameState) return;
    const next = mulligan(gameState, 0);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualToggleActive: (instanceId) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = toggleActive(gameState, instanceId);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualAddDamage: (instanceId, amount) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = addDamage(gameState, instanceId, amount);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualDestroy: (instanceId) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = destroyCard(gameState, instanceId);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualReturnToHand: (instanceId) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = returnToHand(gameState, instanceId);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualDiscard: (instanceId) => {
    const { gameState } = get();
    if (!gameState) return;
    const next = discardFromHand(gameState, instanceId);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  manualShuffleDeck: () => {
    const { gameState } = get();
    if (!gameState) return;
    const next = shuffleDeck(gameState, 0);
    set({ gameState: next, undoStack: [...get().undoStack, gameState] });
  },

  setSelectedInstanceId: (id) => set({ selectedInstanceId: id }),
  setHoveredZone: (zone) => set({ hoveredZone: zone }),

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({ gameState: prev, undoStack: undoStack.slice(0, -1) });
  },
}));

// Re-export engine helpers for UI use
export {
  getEffectiveAP,
  getEffectiveHP,
  getRemainingHP,
  getActivePlayer,
  countActiveResources,
  countTotalResources,
  PHASE_LABELS,
  BATTLE_PHASE_ORDER,
};
export type { GameState, GameCard, TurnPhase };
