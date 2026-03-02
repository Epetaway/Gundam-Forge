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
  {
    id: 'event-004',
    slug: 'west-coast-open-2026-01-25',
    name: 'West Coast Open',
    date: '2026-01-25',
    format: 'standard',
    location: 'Los Angeles, CA',
    playerCount: 48,
    placements: [
      { deckId: 'blue-aggro-rush', deckName: 'Blue Aggro Rush', archetype: 'Aggro', player: 'NTType00', placement: 1, wins: 6, losses: 1, draws: 0 },
      { deckId: 'mono-red-zeon', deckName: 'Mono-Red Zeon Beatdown', archetype: 'Aggro', player: 'AceNewtype', placement: 2, wins: 5, losses: 2, draws: 0 },
      { deckId: 'white-shield-wall', deckName: 'White Shield Wall', archetype: 'Control', player: 'ZeonAce', placement: 3, wins: 5, losses: 2, draws: 0 },
      { deckId: 'blue-green-aeug', deckName: 'Blue/Green AEUG Midrange', archetype: 'Midrange', player: 'NTType00', placement: 4, wins: 4, losses: 3, draws: 0 },
    ],
  },
  {
    id: 'event-005',
    slug: 'japan-qualifier-2026-02-15',
    name: 'Japan Qualifier',
    date: '2026-02-15',
    format: 'standard',
    location: 'Tokyo, Japan',
    playerCount: 96,
    placements: [
      { deckId: 'purple-blue-link', deckName: 'Purple/Blue Link Combo', archetype: 'Combo', player: 'FedForces1', placement: 1, wins: 7, losses: 1, draws: 0 },
      { deckId: 'mono-red-zeon', deckName: 'Mono-Red Zeon Beatdown', archetype: 'Aggro', player: 'AceNewtype', placement: 2, wins: 7, losses: 2, draws: 0 },
      { deckId: 'green-resource-ramp', deckName: 'Green Resource Ramp', archetype: 'Ramp', player: 'AceNewtype', placement: 3, wins: 6, losses: 2, draws: 0 },
      { deckId: 'blue-white-midrange', deckName: 'Blue / White Midrange', archetype: 'Midrange', player: 'Forge Team', placement: 4, wins: 6, losses: 3, draws: 0 },
    ],
  },
  {
    id: 'event-006',
    slug: 'mid-season-invitational-2026-02-22',
    name: 'Mid-Season Invitational',
    date: '2026-02-22',
    format: 'championship',
    location: 'Chicago, IL',
    playerCount: 32,
    placements: [
      { deckId: 'red-white-burn', deckName: 'Red/White Burn Control', archetype: 'Control', player: 'ShiroAmada', placement: 1, wins: 5, losses: 0, draws: 0 },
      { deckId: 'purple-blue-link', deckName: 'Purple/Blue Link Combo', archetype: 'Combo', player: 'FedForces1', placement: 2, wins: 4, losses: 1, draws: 0 },
      { deckId: 'meta-control', deckName: 'Meta Control Blueprint', archetype: 'Control', player: 'NewtypeLab', placement: 3, wins: 3, losses: 2, draws: 0 },
      { deckId: 'blue-aggro-rush', deckName: 'Blue Aggro Rush', archetype: 'Aggro', player: 'NTType00', placement: 4, wins: 3, losses: 2, draws: 0 },
    ],
  },
  {
    id: 'event-007',
    slug: 'regional-qualifier-2-2026-01-11',
    name: 'Regional Qualifier Series #2',
    date: '2026-01-11',
    format: 'regional',
    location: 'Seattle, WA',
    playerCount: 24,
    placements: [
      { deckId: 'colorless-support', deckName: 'Colorless Support Toolkit', archetype: 'Control', player: 'FedForces1', placement: 1, wins: 4, losses: 0, draws: 0 },
      { deckId: 'zeon-rush', deckName: 'Zeon Rush', archetype: 'Aggro', player: 'AtlasPilot', placement: 2, wins: 4, losses: 1, draws: 0 },
      { deckId: 'blue-green-aeug', deckName: 'Blue/Green AEUG Midrange', archetype: 'Midrange', player: 'NTType00', placement: 3, wins: 3, losses: 1, draws: 0 },
      { deckId: 'green-resource-ramp', deckName: 'Green Resource Ramp', archetype: 'Ramp', player: 'AceNewtype', placement: 4, wins: 2, losses: 2, draws: 0 },
    ],
  },
];

export function getEvents(): EventRecord[] {
  return [...eventCatalog].sort((a, b) => b.date.localeCompare(a.date));
}
