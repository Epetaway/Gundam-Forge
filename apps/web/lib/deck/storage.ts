import type { CardColor } from '@gundam-forge/shared';

export interface StoredDeckEntry {
  cardId: string;
  qty: number;
}

export interface StoredDeck {
  id: string;
  name: string;
  description: string;
  visibility: 'private' | 'unlisted' | 'public';
  archetype: string;
  colors: CardColor[];
  entries: StoredDeckEntry[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'gundam-forge.decks';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): StoredDeck[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(decks: StoredDeck[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function createStoredDeck(
  meta: Pick<StoredDeck, 'name' | 'description' | 'visibility' | 'archetype' | 'colors'>,
  entries: StoredDeckEntry[] = [],
): StoredDeck {
  const now = new Date().toISOString();
  const deck: StoredDeck = {
    id: generateId(),
    name: meta.name,
    description: meta.description,
    visibility: meta.visibility,
    archetype: meta.archetype,
    colors: meta.colors,
    entries,
    createdAt: now,
    updatedAt: now,
  };
  const all = loadAll();
  all.unshift(deck);
  saveAll(all);
  return deck;
}

export function getStoredDeck(id: string): StoredDeck | null {
  return loadAll().find((d) => d.id === id) ?? null;
}

export function getAllStoredDecks(): StoredDeck[] {
  return loadAll();
}

export function saveStoredDeck(deck: StoredDeck): void {
  const all = loadAll();
  const idx = all.findIndex((d) => d.id === deck.id);
  const updated: StoredDeck = { ...deck, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    all[idx] = updated;
  } else {
    all.unshift(updated);
  }
  saveAll(all);
}

export function updateDeckEntries(id: string, entries: StoredDeckEntry[]): void {
  const all = loadAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], entries, updatedAt: new Date().toISOString() };
  saveAll(all);
}

export function updateDeckMeta(
  id: string,
  meta: Partial<Pick<StoredDeck, 'name' | 'description' | 'visibility' | 'archetype' | 'colors'>>,
): void {
  const all = loadAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...meta, updatedAt: new Date().toISOString() };
  saveAll(all);
}

export function deleteStoredDeck(id: string): void {
  saveAll(loadAll().filter((d) => d.id !== id));
}
