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
    slug: 'west-coast-open-2026-02-15',
    name: 'West Coast Open',
    date: '2026-02-15',
    format: 'standard',
    location: 'Los Angeles, CA',
    playerCount: 48,
    placements: [
      { deckId: 'blue-aggro-rush', deckName: 'Blue Aggro Rush', archetype: 'Aggro', player: 'NTType00', placement: 1, wins: 4, losses: 0, draws: 0 },
      { deckId: 'red-white-burn', deckName: 'Red / White Burn Control', archetype: 'Burn', player: 'ShiroAmada', placement: 2, wins: 3, losses: 1, draws: 0 },
      { deckId: 'green-resource-ramp-v2', deckName: 'Green Resource Ramp Advanced', archetype: 'Ramp', player: 'AceNewtype', placement: 3, wins: 3, losses: 1, draws: 0 },
      { deckId: 'purple-blue-link-combo', deckName: 'Purple / Blue Link Combo', archetype: 'Combo', player: 'FedForces1', placement: 4, wins: 3, losses: 1, draws: 0 },
    ],
  },
  {
    id: 'event-005',
    slug: 'japan-qualifier-2026-02-20',
    name: 'Japan Qualifier',
    date: '2026-02-20',
    format: 'standard',
    location: 'Tokyo, Japan',
    playerCount: 96,
    placements: [
      { deckId: 'mono-red-zeon', deckName: 'Mono-Red Zeon Beatdown', archetype: 'Aggro', player: 'AtlasPilot', placement: 1, wins: 6, losses: 1, draws: 0 },
      { deckId: 'blue-green-aeug', deckName: 'Blue / Green AEUG Midrange', archetype: 'Midrange', player: 'AceNewtype', placement: 2, wins: 5, losses: 2, draws: 0 },
      { deckId: 'white-shield-wall', deckName: 'White Shield Wall', archetype: 'Control', player: 'ShiroAmada', placement: 3, wins: 5, losses: 2, draws: 0 },
      { deckId: 'colorless-support-toolkit', deckName: 'Colorless Support Toolkit', archetype: 'Toolbox', player: 'NewtypeLab', placement: 4, wins: 5, losses: 2, draws: 0 },
    ],
  },
  {
    id: 'event-006',
    slug: 'mid-season-invitational-2026-02-22',
    name: 'Mid-Season Invitational',
    date: '2026-02-22',
    format: 'regional',
    location: 'Chicago, IL',
    playerCount: 32,
    placements: [
      { deckId: 'meta-control', deckName: 'Meta Control Blueprint', archetype: 'Control', player: 'NewtypeLab', placement: 1, wins: 4, losses: 0, draws: 0 },
      { deckId: 'purple-blue-link-combo', deckName: 'Purple / Blue Link Combo', archetype: 'Combo', player: 'FedForces1', placement: 2, wins: 3, losses: 1, draws: 0 },
      { deckId: 'blue-aggro-rush', deckName: 'Blue Aggro Rush', archetype: 'Aggro', player: 'NTType00', placement: 3, wins: 2, losses: 2, draws: 0 },
    ],
  },
  {
    id: 'event-007',
    slug: 'regional-qualifier-series-2-2026-02-25',
    name: 'Regional Qualifier Series #2',
    date: '2026-02-25',
    format: 'standard',
    location: 'Seattle, WA',
    playerCount: 24,
    placements: [
      { deckId: 'green-resource-ramp-v2', deckName: 'Green Resource Ramp Advanced', archetype: 'Ramp', player: 'AceNewtype', placement: 1, wins: 3, losses: 0, draws: 0 },
      { deckId: 'red-white-burn', deckName: 'Red / White Burn Control', archetype: 'Burn', player: 'ShiroAmada', placement: 2, wins: 2, losses: 1, draws: 0 },
      { deckId: 'white-shield-wall', deckName: 'White Shield Wall', archetype: 'Control', player: 'ShiroAmada', placement: 3, wins: 2, losses: 1, draws: 0 },
    ],
  },
];

export function getEvents(): EventRecord[] {
  return [...eventCatalog].sort((a, b) => b.date.localeCompare(a.date));
}
