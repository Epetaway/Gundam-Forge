import type { CardColor, CardDefinition } from '@gundam-forge/shared';
import { cardsById } from '@/lib/data/cards';

export interface DeckEntry {
  cardId: string;
  qty: number;
}

export interface DeckRecord {
  id: string;
  name: string;
  description: string;
  archetype: string;
  owner: string;
  colors: CardColor[];
  likes: number;
  views: number;
  entries: DeckEntry[];
}

export const deckCatalog: DeckRecord[] = [
  {
    id: 'blue-white-midrange',
    name: 'Blue / White Midrange',
    description: 'Tempo-oriented shell that stabilizes early and swings with linked finishers.',
    archetype: 'Midrange',
    owner: 'Forge Team',
    colors: ['Blue', 'White'],
    likes: 102,
    views: 2234,
    entries: [
      { cardId: 'ST01-001', qty: 3 },
      { cardId: 'ST01-005', qty: 4 },
      { cardId: 'ST01-010', qty: 4 },
      { cardId: 'ST04-001', qty: 2 },
      { cardId: 'ST04-005', qty: 3 },
      { cardId: 'GD01-068', qty: 3 },
      { cardId: 'GD01-077', qty: 3 },
      { cardId: 'GD01-100', qty: 4 },
      { cardId: 'GD01-118', qty: 4 },
      { cardId: 'GD01-124', qty: 4 },
      { cardId: 'GD01-088', qty: 4 },
      { cardId: 'GD01-089', qty: 4 },
      { cardId: 'ST01-013', qty: 4 },
      { cardId: 'ST04-013', qty: 4 },
      { cardId: 'ST01-015', qty: 4 },
    ],
  },
  {
    id: 'green-ramp',
    name: 'Green Ramp Pressure',
    description: 'Fast resource growth into oversized units with efficient shield pressure.',
    archetype: 'Ramp',
    owner: 'Forge Team',
    colors: ['Green'],
    likes: 88,
    views: 1915,
    entries: [
      { cardId: 'ST02-001', qty: 4 },
      { cardId: 'ST02-002', qty: 4 },
      { cardId: 'ST02-005', qty: 4 },
      { cardId: 'ST02-008', qty: 4 },
      { cardId: 'ST02-010', qty: 4 },
      { cardId: 'ST02-012', qty: 4 },
      { cardId: 'GD01-030', qty: 4 },
      { cardId: 'GD01-034', qty: 4 },
      { cardId: 'GD01-040', qty: 4 },
      { cardId: 'GD01-041', qty: 4 },
      { cardId: 'GD01-070', qty: 2 },
      { cardId: 'GD01-075', qty: 4 },
      { cardId: 'GD01-076', qty: 4 },
      { cardId: 'GD01-107', qty: 4 },
      { cardId: 'GD01-117', qty: 4 },
    ],
  },
  {
    id: 'zeon-rush',
    name: 'Zeon Rush',
    description: 'High-aggression red shell with breach lines and low-curve sequencing.',
    archetype: 'Aggro',
    owner: 'AtlasPilot',
    colors: ['Red'],
    likes: 144,
    views: 3370,
    entries: [
      { cardId: 'ST03-001', qty: 4 },
      { cardId: 'ST03-002', qty: 4 },
      { cardId: 'ST03-004', qty: 4 },
      { cardId: 'ST03-006', qty: 4 },
      { cardId: 'ST03-007', qty: 4 },
      { cardId: 'ST03-008', qty: 4 },
      { cardId: 'ST03-009', qty: 4 },
      { cardId: 'ST03-010', qty: 4 },
      { cardId: 'ST03-011', qty: 4 },
      { cardId: 'ST03-013', qty: 4 },
      { cardId: 'ST03-014', qty: 3 },
      { cardId: 'GD01-111', qty: 3 },
      { cardId: 'GD01-112', qty: 3 },
      { cardId: 'GD01-113', qty: 3 },
      { cardId: 'GD01-114', qty: 3 },
    ],
  },
  {
    id: 'meta-control',
    name: 'Meta Control Blueprint',
    description: 'Flexible blue shell with disruptive pilots and stable late-game conversion.',
    archetype: 'Control',
    owner: 'NewtypeLab',
    colors: ['Blue', 'Green'],
    likes: 77,
    views: 1741,
    entries: [
      { cardId: 'ST01-001', qty: 4 },
      { cardId: 'ST01-002', qty: 4 },
      { cardId: 'ST01-010', qty: 4 },
      { cardId: 'ST01-013', qty: 4 },
      { cardId: 'ST02-001', qty: 3 },
      { cardId: 'ST02-005', qty: 4 },
      { cardId: 'ST02-010', qty: 4 },
      { cardId: 'ST03-007', qty: 2 },
      { cardId: 'GD01-015', qty: 4 },
      { cardId: 'GD01-016', qty: 4 },
      { cardId: 'GD01-026', qty: 4 },
      { cardId: 'GD01-030', qty: 4 },
      { cardId: 'GD01-040', qty: 4 },
      { cardId: 'GD01-100', qty: 4 },
      { cardId: 'GD01-105', qty: 3 },
    ],
  },
];

const resolveEntry = (entry: DeckEntry): (DeckEntry & { card?: CardDefinition }) => ({
  ...entry,
  card: cardsById.get(entry.cardId),
});

export function getDecks(): DeckRecord[] {
  return deckCatalog;
}

export function getDeckById(id: string): DeckRecord | undefined {
  return deckCatalog.find((deck) => deck.id === id);
}

export function getResolvedEntries(deck: DeckRecord): Array<DeckEntry & { card?: CardDefinition }> {
  return deck.entries.map(resolveEntry).filter((entry) => entry.card);
}

export function getDeckCardCount(deck: DeckRecord): number {
  return deck.entries.reduce((total, entry) => total + entry.qty, 0);
}
