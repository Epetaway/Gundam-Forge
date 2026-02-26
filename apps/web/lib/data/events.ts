export interface EventPlacementRecord {
  deckId: string;
  deckName: string;
  archetype: string;
  player: string;
  placement: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface EventRecord {
  id: string;
  slug: string;
  name: string;
  date: string;
  format: 'standard' | 'championship' | 'regional';
  location: string;
  playerCount: number;
  placements: EventPlacementRecord[];
}

export const eventCatalog: EventRecord[] = [
  {
    id: 'event-001',
    slug: 'pacific-regional-2026-02-12',
    name: 'Pacific Regional',
    date: '2026-02-12',
    format: 'regional',
    location: 'Los Angeles, CA',
    playerCount: 148,
    placements: [
      { deckId: 'zeon-rush', deckName: 'Zeon Rush', archetype: 'Aggro', player: 'AtlasPilot', placement: 1, wins: 8, losses: 1, draws: 0 },
      { deckId: 'blue-white-midrange', deckName: 'Blue / White Midrange', archetype: 'Midrange', player: 'Forge Team', placement: 2, wins: 7, losses: 2, draws: 0 },
      { deckId: 'meta-control', deckName: 'Meta Control Blueprint', archetype: 'Control', player: 'NewtypeLab', placement: 3, wins: 7, losses: 2, draws: 0 },
    ],
  },
  {
    id: 'event-002',
    slug: 'great-lakes-open-2026-02-01',
    name: 'Great Lakes Open',
    date: '2026-02-01',
    format: 'standard',
    location: 'Chicago, IL',
    playerCount: 112,
    placements: [
      { deckId: 'blue-white-midrange', deckName: 'Blue / White Midrange', archetype: 'Midrange', player: 'Forge Team', placement: 1, wins: 7, losses: 1, draws: 0 },
      { deckId: 'green-ramp', deckName: 'Green Ramp Pressure', archetype: 'Ramp', player: 'Forge Team', placement: 2, wins: 6, losses: 2, draws: 0 },
      { deckId: 'zeon-rush', deckName: 'Zeon Rush', archetype: 'Aggro', player: 'AtlasPilot', placement: 3, wins: 6, losses: 2, draws: 0 },
    ],
  },
  {
    id: 'event-003',
    slug: 'east-coast-championship-2026-01-18',
    name: 'East Coast Championship',
    date: '2026-01-18',
    format: 'championship',
    location: 'Boston, MA',
    playerCount: 196,
    placements: [
      { deckId: 'meta-control', deckName: 'Meta Control Blueprint', archetype: 'Control', player: 'NewtypeLab', placement: 1, wins: 9, losses: 1, draws: 0 },
      { deckId: 'zeon-rush', deckName: 'Zeon Rush', archetype: 'Aggro', player: 'AtlasPilot', placement: 2, wins: 8, losses: 2, draws: 0 },
      { deckId: 'green-ramp', deckName: 'Green Ramp Pressure', archetype: 'Ramp', player: 'Forge Team', placement: 3, wins: 8, losses: 2, draws: 0 },
    ],
  },
];

export function getEvents(): EventRecord[] {
  return [...eventCatalog].sort((a, b) => b.date.localeCompare(a.date));
}
