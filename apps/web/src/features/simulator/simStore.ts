import { create } from 'zustand';
import type { DeckEntry } from '../deckbuilder/deckStore';

export interface SimCardInstance {
  instanceId: string;
  cardId: string;
  tapped: boolean;
}

export type SimZoneMap = Record<string, SimCardInstance[]>;

export interface SimState {
  sourceDeck: DeckEntry[];
  deckPile: SimCardInstance[];
  hand: SimCardInstance[];
  zones: SimZoneMap;
  initializeFromDeck: (entries: DeckEntry[], zoneIds: string[]) => void;
  reset: () => void;
  shuffle: () => void;
  draw: (count?: number) => void;
  mulligan: () => void;
  moveCard: (instanceId: string, target: { kind: 'hand' } | { kind: 'zone'; zoneId: string }) => void;
  toggleTapped: (instanceId: string) => void;
}

export const expandDeckToInstances = (entries: DeckEntry[]): SimCardInstance[] => {
  const instances: SimCardInstance[] = [];

  for (const entry of entries) {
    for (let index = 0; index < entry.qty; index += 1) {
      instances.push({
        instanceId: `${entry.cardId}#${index + 1}`,
        cardId: entry.cardId,
        tapped: false
      });
    }
  }

  return instances;
};

export const shuffleInstances = (
  instances: SimCardInstance[],
  randomFn: () => number = Math.random
): SimCardInstance[] => {
  const shuffled = [...instances];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFn() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[randomIndex];
    shuffled[randomIndex] = current;
  }
  return shuffled;
};

const createEmptyZones = (zoneIds: string[]): SimZoneMap =>
  Object.fromEntries(zoneIds.map((zoneId) => [zoneId, [] as SimCardInstance[]]));

const removeCardFromStacks = (
  instanceId: string,
  deckPile: SimCardInstance[],
  hand: SimCardInstance[],
  zones: SimZoneMap
) => {
  const fromDeck = deckPile.find((card) => card.instanceId === instanceId);
  if (fromDeck) {
    return {
      card: fromDeck,
      deckPile: deckPile.filter((card) => card.instanceId !== instanceId),
      hand,
      zones
    };
  }

  const fromHand = hand.find((card) => card.instanceId === instanceId);
  if (fromHand) {
    return {
      card: fromHand,
      deckPile,
      hand: hand.filter((card) => card.instanceId !== instanceId),
      zones
    };
  }

  for (const [zoneId, cards] of Object.entries(zones)) {
    const fromZone = cards.find((card) => card.instanceId === instanceId);
    if (fromZone) {
      return {
        card: fromZone,
        deckPile,
        hand,
        zones: {
          ...zones,
          [zoneId]: cards.filter((card) => card.instanceId !== instanceId)
        }
      };
    }
  }

  return { card: null, deckPile, hand, zones };
};

const toggleInStack = (stack: SimCardInstance[], instanceId: string) =>
  stack.map((card) => (card.instanceId === instanceId ? { ...card, tapped: !card.tapped } : card));

export const useSimStore = create<SimState>((set, get) => ({
  sourceDeck: [],
  deckPile: [],
  hand: [],
  zones: {},

  initializeFromDeck: (entries, zoneIds) => {
    const normalized = entries
      .filter((entry) => entry.qty > 0 && entry.cardId.trim().length > 0)
      .map((entry) => ({ cardId: entry.cardId, qty: Math.floor(entry.qty) }));

    const deckPile = shuffleInstances(expandDeckToInstances(normalized));
    set(() => ({
      sourceDeck: normalized,
      deckPile,
      hand: [],
      zones: createEmptyZones(zoneIds)
    }));
  },

  reset: () => {
    const state = get();
    const zoneIds = Object.keys(state.zones);
    const deckPile = shuffleInstances(expandDeckToInstances(state.sourceDeck));
    set(() => ({
      deckPile,
      hand: [],
      zones: createEmptyZones(zoneIds)
    }));
  },

  shuffle: () => {
    const state = get();
    set(() => ({
      deckPile: shuffleInstances(state.deckPile)
    }));
  },

  draw: (count = 1) => {
    const state = get();
    if (count <= 0) return;

    const drawCount = Math.min(count, state.deckPile.length);
    if (drawCount <= 0) return;

    const drawn = state.deckPile.slice(-drawCount);
    const remaining = state.deckPile.slice(0, state.deckPile.length - drawCount);

    set(() => ({
      deckPile: remaining,
      hand: [...state.hand, ...drawn]
    }));
  },

  mulligan: () => {
    const state = get();
    const returned = [...state.deckPile, ...state.hand].map((card) => ({ ...card, tapped: false }));
    set(() => ({
      deckPile: shuffleInstances(returned),
      hand: []
    }));
  },

  moveCard: (instanceId, target) => {
    const state = get();
    const pulled = removeCardFromStacks(instanceId, state.deckPile, state.hand, state.zones);
    if (!pulled.card) return;

    if (target.kind === 'hand') {
      set(() => ({
        deckPile: pulled.deckPile,
        hand: [...pulled.hand, pulled.card!],
        zones: pulled.zones
      }));
      return;
    }

    if (target.zoneId === 'deck') {
      set(() => ({
        deckPile: [...pulled.deckPile, { ...pulled.card!, tapped: false }],
        hand: pulled.hand,
        zones: pulled.zones
      }));
      return;
    }

    if (!(target.zoneId in pulled.zones)) return;

    set(() => ({
      deckPile: pulled.deckPile,
      hand: pulled.hand,
      zones: {
        ...pulled.zones,
        [target.zoneId]: [...pulled.zones[target.zoneId], pulled.card!]
      }
    }));
  },

  toggleTapped: (instanceId) => {
    const state = get();
    if (state.deckPile.some((card) => card.instanceId === instanceId)) {
      set(() => ({ deckPile: toggleInStack(state.deckPile, instanceId) }));
      return;
    }

    if (state.hand.some((card) => card.instanceId === instanceId)) {
      set(() => ({ hand: toggleInStack(state.hand, instanceId) }));
      return;
    }

    const nextZones: SimZoneMap = {};
    let found = false;
    for (const [zoneId, cards] of Object.entries(state.zones)) {
      if (cards.some((card) => card.instanceId === instanceId)) {
        nextZones[zoneId] = toggleInStack(cards, instanceId);
        found = true;
      } else {
        nextZones[zoneId] = cards;
      }
    }

    if (found) set(() => ({ zones: nextZones }));
  }
}));
