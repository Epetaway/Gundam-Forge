import type { CardColor, CardDefinition } from '@gundam-forge/shared';
import { isMainDeckCard } from '@gundam-forge/shared';
import { cardsById } from '@/lib/data/cards';
import liveDecksData from './decks-live.json';

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
  updatedAt?: string;
  source?: 'catalog' | 'tournament';
  eventId?: string;
  placement?: number;
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
    updatedAt: '2026-02-12T18:30:00Z',
    entries: [
      { cardId: 'ST01-001', qty: 3 },
      { cardId: 'ST01-005', qty: 3 },
      { cardId: 'ST01-010', qty: 3 },
      { cardId: 'ST04-001', qty: 2 },
      { cardId: 'ST04-005', qty: 3 },
      { cardId: 'GD01-068', qty: 3 },
      { cardId: 'GD01-077', qty: 3 },
      { cardId: 'GD01-100', qty: 4 },
      { cardId: 'GD01-118', qty: 4 },
      { cardId: 'GD01-124', qty: 3 },
      { cardId: 'GD01-088', qty: 4 },
      { cardId: 'GD01-089', qty: 4 },
      { cardId: 'ST01-013', qty: 4 },
      { cardId: 'ST04-013', qty: 4 },
      { cardId: 'ST01-015', qty: 3 },
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
    updatedAt: '2026-02-08T14:22:00Z',
    entries: [
      { cardId: 'ST02-001', qty: 3 },
      { cardId: 'ST02-002', qty: 3 },
      { cardId: 'ST02-005', qty: 3 },
      { cardId: 'ST02-008', qty: 3 },
      { cardId: 'ST02-010', qty: 3 },
      { cardId: 'ST02-012', qty: 3 },
      { cardId: 'GD01-030', qty: 4 },
      { cardId: 'GD01-034', qty: 4 },
      { cardId: 'GD01-040', qty: 4 },
      { cardId: 'GD01-041', qty: 3 },
      { cardId: 'GD01-070', qty: 2 },
      { cardId: 'GD01-075', qty: 3 },
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
    updatedAt: '2026-02-15T09:45:00Z',
    entries: [
      { cardId: 'ST03-001', qty: 3 },
      { cardId: 'ST03-002', qty: 3 },
      { cardId: 'ST03-004', qty: 3 },
      { cardId: 'ST03-006', qty: 3 },
      { cardId: 'ST03-007', qty: 3 },
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
    updatedAt: '2026-02-10T16:15:00Z',
    entries: [
      { cardId: 'ST01-001', qty: 3 },
      { cardId: 'ST01-002', qty: 3 },
      { cardId: 'ST01-010', qty: 3 },
      { cardId: 'ST01-013', qty: 3 },
      { cardId: 'ST02-001', qty: 3 },
      { cardId: 'ST02-005', qty: 3 },
      { cardId: 'ST02-010', qty: 4 },
      { cardId: 'ST03-007', qty: 2 },
      { cardId: 'GD01-015', qty: 4 },
      { cardId: 'GD01-016', qty: 4 },
      { cardId: 'GD01-026', qty: 4 },
      { cardId: 'GD01-030', qty: 4 },
      { cardId: 'GD01-040', qty: 3 },
      { cardId: 'GD01-100', qty: 4 },
      { cardId: 'GD01-105', qty: 3 },
    ],
  },
  {
    id: 'blue-aggro-rush',
    name: 'Blue Aggro Rush',
    description: 'Early pressure strategy leveraging rush mechanics and tempo units.',
    archetype: 'Aggro',
    owner: 'NTType00',
    colors: ['Blue'],
    likes: 95,
    views: 1823,
    updatedAt: '2026-02-14T11:20:00Z',
    entries: [
      { cardId: 'GD01-001', qty: 3 },
      { cardId: 'GD01-002', qty: 3 },
      { cardId: 'GD01-003', qty: 3 },
      { cardId: 'GD01-004', qty: 4 },
      { cardId: 'GD01-005', qty: 3 },
      { cardId: 'GD01-006', qty: 4 },
      { cardId: 'GD01-007', qty: 4 },
      { cardId: 'GD01-008', qty: 4 },
      { cardId: 'GD01-009', qty: 3 },
      { cardId: 'GD01-010', qty: 4 },
      { cardId: 'GD01-011', qty: 3 },
      { cardId: 'GD01-012', qty: 3 },
      { cardId: 'GD01-013', qty: 4 },
      { cardId: 'GD01-014', qty: 3 },
      { cardId: 'GD01-015', qty: 2 },
    ],
  },
  {
    id: 'red-white-burn',
    name: 'Red / White Burn Control',
    description: 'Removal-heavy strategy with direct damage finishers and board sweeps.',
    archetype: 'Burn',
    owner: 'ShiroAmada',
    colors: ['Red', 'White'],
    likes: 112,
    views: 2456,
    updatedAt: '2026-02-13T19:55:00Z',
    entries: [
      { cardId: 'GD01-044', qty: 3 },
      { cardId: 'GD01-045', qty: 3 },
      { cardId: 'GD01-046', qty: 3 },
      { cardId: 'GD01-047', qty: 3 },
      { cardId: 'GD01-048', qty: 3 },
      { cardId: 'GD01-049', qty: 4 },
      { cardId: 'GD01-050', qty: 4 },
      { cardId: 'GD01-051', qty: 3 },
      { cardId: 'GD01-065', qty: 4 },
      { cardId: 'GD01-066', qty: 3 },
      { cardId: 'GD01-067', qty: 4 },
      { cardId: 'GD01-068', qty: 3 },
      { cardId: 'GD01-069', qty: 4 },
      { cardId: 'GD01-070', qty: 4 },
      { cardId: 'GD01-071', qty: 2 },
    ],
  },
  {
    id: 'green-resource-ramp-v2',
    name: 'Green Resource Ramp Advanced',
    description: 'Enhanced resource acceleration with explosive mid-game unit curve.',
    archetype: 'Ramp',
    owner: 'AceNewtype',
    colors: ['Green'],
    likes: 88,
    views: 1621,
    updatedAt: '2026-02-09T12:30:00Z',
    entries: [
      { cardId: 'GD01-030', qty: 3 },
      { cardId: 'GD01-031', qty: 3 },
      { cardId: 'GD01-032', qty: 3 },
      { cardId: 'GD01-033', qty: 3 },
      { cardId: 'GD01-034', qty: 4 },
      { cardId: 'GD01-035', qty: 3 },
      { cardId: 'GD01-036', qty: 4 },
      { cardId: 'GD01-037', qty: 4 },
      { cardId: 'GD01-038', qty: 3 },
      { cardId: 'GD01-039', qty: 4 },
      { cardId: 'GD01-040', qty: 4 },
      { cardId: 'GD01-041', qty: 4 },
      { cardId: 'GD01-042', qty: 3 },
      { cardId: 'GD01-043', qty: 2 },
      { cardId: 'ST02-002', qty: 3 },
    ],
  },
  {
    id: 'purple-blue-link-combo',
    name: 'Purple / Blue Link Combo',
    description: 'Synergy-driven shells leveraging LINK and PAIR mechanics for value.',
    archetype: 'Combo',
    owner: 'FedForces1',
    colors: ['Purple', 'Blue'],
    likes: 76,
    views: 1534,
    updatedAt: '2026-02-11T08:40:00Z',
    entries: [
      { cardId: 'GD02-053', qty: 3 },
      { cardId: 'GD02-054', qty: 3 },
      { cardId: 'GD02-055', qty: 4 },
      { cardId: 'GD02-056', qty: 3 },
      { cardId: 'GD02-057', qty: 4 },
      { cardId: 'GD02-058', qty: 4 },
      { cardId: 'GD02-059', qty: 3 },
      { cardId: 'GD02-060', qty: 4 },
      { cardId: 'GD01-001', qty: 4 },
      { cardId: 'GD01-002', qty: 4 },
      { cardId: 'GD01-003', qty: 3 },
      { cardId: 'GD01-004', qty: 4 },
      { cardId: 'GD01-005', qty: 3 },
      { cardId: 'GD02-061', qty: 2 },
      { cardId: 'GD02-062', qty: 2 },
    ],
  },
  {
    id: 'white-shield-wall',
    name: 'White Shield Wall',
    description: 'Defensive strategy built around shield recursion and incremental damage.',
    archetype: 'Control',
    owner: 'ShiroAmada',
    colors: ['White'],
    likes: 64,
    views: 1298,
    updatedAt: '2026-02-07T15:25:00Z',
    entries: [
      { cardId: 'GD01-065', qty: 3 },
      { cardId: 'GD01-066', qty: 3 },
      { cardId: 'GD01-067', qty: 3 },
      { cardId: 'GD01-068', qty: 4 },
      { cardId: 'GD01-069', qty: 3 },
      { cardId: 'GD01-070', qty: 4 },
      { cardId: 'GD01-071', qty: 4 },
      { cardId: 'GD01-072', qty: 4 },
      { cardId: 'GD01-073', qty: 3 },
      { cardId: 'GD01-074', qty: 4 },
      { cardId: 'GD01-075', qty: 4 },
      { cardId: 'GD01-076', qty: 3 },
      { cardId: 'GD01-077', qty: 2 },
      { cardId: 'GD01-078', qty: 3 },
      { cardId: 'GD01-079', qty: 3 },
    ],
  },
  {
    id: 'mono-red-zeon',
    name: 'Mono-Red Zeon Beatdown',
    description: 'Pure red aggression focused on Zeon faction synergy and efficient stats.',
    archetype: 'Aggro',
    owner: 'NTType00',
    colors: ['Red'],
    likes: 102,
    views: 2187,
    updatedAt: '2026-02-05T10:10:00Z',
    entries: [
      { cardId: 'GD01-044', qty: 3 },
      { cardId: 'GD01-045', qty: 3 },
      { cardId: 'GD01-046', qty: 3 },
      { cardId: 'GD01-047', qty: 4 },
      { cardId: 'GD01-048', qty: 4 },
      { cardId: 'GD01-049', qty: 4 },
      { cardId: 'GD01-050', qty: 4 },
      { cardId: 'GD01-051', qty: 4 },
      { cardId: 'GD01-052', qty: 3 },
      { cardId: 'GD01-053', qty: 4 },
      { cardId: 'GD01-054', qty: 4 },
      { cardId: 'GD01-055', qty: 3 },
      { cardId: 'GD01-056', qty: 3 },
      { cardId: 'GD01-057', qty: 2 },
      { cardId: 'GD01-058', qty: 2 },
    ],
  },
  {
    id: 'blue-green-aeug',
    name: 'Blue / Green AEUG Midrange',
    description: 'Clan-focused midrange leveraging AEUG synergies for value generation.',
    archetype: 'Midrange',
    owner: 'AceNewtype',
    colors: ['Blue', 'Green'],
    likes: 85,
    views: 1756,
    updatedAt: '2026-02-06T13:35:00Z',
    entries: [
      { cardId: 'GD01-001', qty: 3 },
      { cardId: 'GD01-030', qty: 3 },
      { cardId: 'GD01-031', qty: 4 },
      { cardId: 'GD01-032', qty: 4 },
      { cardId: 'GD01-002', qty: 3 },
      { cardId: 'GD01-033', qty: 4 },
      { cardId: 'GD01-034', qty: 4 },
      { cardId: 'GD01-003', qty: 3 },
      { cardId: 'GD01-004', qty: 3 },
      { cardId: 'GD01-035', qty: 3 },
      { cardId: 'GD01-036', qty: 4 },
      { cardId: 'GD01-005', qty: 2 },
      { cardId: 'GD01-037', qty: 4 },
      { cardId: 'GD01-038', qty: 3 },
      { cardId: 'GD01-039', qty: 3 },
    ],
  },
  {
    id: 'colorless-support-toolkit',
    name: 'Colorless Support Toolkit',
    description: 'Utility-focused shell with colorless synergies enabling diverse strategies.',
    archetype: 'Toolbox',
    owner: 'NewtypeLab',
    colors: ['Colorless'],
    likes: 54,
    views: 891,
    updatedAt: '2026-02-04T07:50:00Z',
    entries: [
      { cardId: 'EXBP-001', qty: 3 },
      { cardId: 'EXBP-002', qty: 4 },
      { cardId: 'EXBP-003', qty: 4 },
      { cardId: 'EXBP-004', qty: 4 },
      { cardId: 'EXBP-005', qty: 3 },
      { cardId: 'EXBP-006', qty: 4 },
      { cardId: 'EXBP-007', qty: 4 },
      { cardId: 'EXBP-008', qty: 3 },
      { cardId: 'EXBP-009', qty: 4 },
      { cardId: 'EXBP-010', qty: 4 },
      { cardId: 'EXBP-011', qty: 3 },
      { cardId: 'EXBP-012', qty: 4 },
      { cardId: 'ST01-015', qty: 2 },
      { cardId: 'ST02-012', qty: 2 },
      { cardId: 'ST03-014', qty: 2 },
    ],
  },
];

const resolveEntry = (entry: DeckEntry): (DeckEntry & { card?: CardDefinition }) => ({
  ...entry,
  card: cardsById.get(entry.cardId),
});

const liveDecks = liveDecksData as unknown as DeckRecord[];

function inferColors(entries: DeckEntry[]): CardColor[] {
  const seen = new Set<CardColor>();
  for (const entry of entries) {
    const card = cardsById.get(entry.cardId);
    if (card && card.color !== 'Colorless') seen.add(card.color);
  }
  return [...seen];
}

function withInferredColors(deck: DeckRecord): DeckRecord {
  if (deck.colors.length === 0) {
    return { ...deck, colors: inferColors(deck.entries) };
  }
  return deck;
}

export function getDecks(): DeckRecord[] {
  return [...deckCatalog, ...liveDecks].map(withInferredColors);
}

export function getDeckById(id: string): DeckRecord | undefined {
  return deckCatalog.find((deck) => deck.id === id) ?? liveDecks.find((deck) => deck.id === id);
}

export function getResolvedEntries(deck: DeckRecord): Array<DeckEntry & { card?: CardDefinition }> {
  return deck.entries.map(resolveEntry).filter((entry) => entry.card);
}

export function getDeckCardCount(deck: DeckRecord): number {
  return deck.entries.reduce((total, entry) => total + entry.qty, 0);
}
