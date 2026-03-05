import liveData from './events-live.json';

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

const data = liveData as unknown as EventRecord[];

export function getEvents(): EventRecord[] {
  return [...data].sort((a, b) => b.date.localeCompare(a.date));
}
