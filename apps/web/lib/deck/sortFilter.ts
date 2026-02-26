import type { CardDefinition } from '@gundam-forge/shared';

export type DeckViewMode = 'image' | 'stacks' | 'text';
export type DeckDensity = 'comfortable' | 'compact';
export type DeckSortKey = 'name' | 'cost' | 'type';

export interface DeckViewItem {
  id: string;
  name: string;
  imageUrl?: string;
  placeholderArt?: string;
  typeLine: string;
  cost?: string | number;
  cmc: number;
  text?: string;
  qty: number;
  color?: string;
  set?: string;
  // Gundam Card Game stats
  ap?: number;
  hp?: number;
  level?: number;
  traits?: string[];
  linkCondition?: string;
  apModifier?: number;
  hpModifier?: number;
}

interface ResolvedDeckEntryLike {
  cardId: string;
  qty: number;
  card?: Pick<
    CardDefinition,
    | 'id'
    | 'name'
    | 'imageUrl'
    | 'placeholderArt'
    | 'type'
    | 'cost'
    | 'text'
    | 'color'
    | 'set'
    | 'ap'
    | 'hp'
    | 'level'
    | 'traits'
    | 'linkCondition'
    | 'apModifier'
    | 'hpModifier'
  >;
}

export interface DeckViewFilterState {
  query: string;
  sortBy: DeckSortKey;
}

function toCmc(cost: string | number | undefined): number {
  if (typeof cost === 'number') return cost;
  if (typeof cost === 'string') {
    const parsed = Number.parseInt(cost, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function toDeckViewItem(entry: ResolvedDeckEntryLike): DeckViewItem | null {
  if (!entry.card) return null;

  return {
    id: entry.card.id ?? entry.cardId,
    name: entry.card.name ?? entry.cardId,
    imageUrl: entry.card.imageUrl,
    placeholderArt: entry.card.placeholderArt,
    typeLine: entry.card.type ?? 'Unknown',
    cost: entry.card.cost,
    cmc: toCmc(entry.card.cost),
    text: entry.card.text,
    qty: entry.qty,
    color: entry.card.color,
    set: entry.card.set,
    ap: entry.card.ap,
    hp: entry.card.hp,
    level: entry.card.level,
    traits: entry.card.traits,
    linkCondition: entry.card.linkCondition,
    apModifier: entry.card.apModifier,
    hpModifier: entry.card.hpModifier,
  };
}

function compareBySortKey(a: DeckViewItem, b: DeckViewItem, sortBy: DeckSortKey): number {
  if (sortBy === 'cost') {
    const cmcDelta = a.cmc - b.cmc;
    if (cmcDelta !== 0) return cmcDelta;
    return a.name.localeCompare(b.name);
  }
  if (sortBy === 'type') {
    const typeDelta = a.typeLine.localeCompare(b.typeLine);
    if (typeDelta !== 0) return typeDelta;
    return a.name.localeCompare(b.name);
  }
  return a.name.localeCompare(b.name);
}

export function applyDeckFilterSort(
  items: DeckViewItem[],
  state: DeckViewFilterState,
): DeckViewItem[] {
  const query = state.query.trim().toLowerCase();

  const filtered = query.length === 0
    ? items
    : items.filter((item) => {
      const haystack = `${item.id} ${item.name} ${item.typeLine} ${item.text ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });

  return [...filtered].sort((a, b) => compareBySortKey(a, b, state.sortBy));
}

export function buildDeckExportText(items: DeckViewItem[]): string {
  return items.map((item) => `${item.qty}x ${item.name} (${item.id})`).join('\n');
}
