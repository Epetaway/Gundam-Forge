import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  MetaSourceAdapter,
  MetaSourceArchetype,
  MetaSourceCardPerformance,
  MetaSourcePayload,
} from '../types';

interface LivePlacement {
  archetype: string;
  placement: number;
  wins: number;
  losses: number;
  draws: number;
}

interface LiveEvent {
  date: string;
  placements: LivePlacement[];
}

function slugifyArchetype(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toWinRate(wins: number, losses: number, draws: number): number {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return Number((wins / total).toFixed(4));
}

function buildArchetypes(events: LiveEvent[]): MetaSourceArchetype[] {
  const map = new Map<string, {
    archetypeId: string;
    appearances: number;
    weightedScore: number;
    wins: number;
    losses: number;
    draws: number;
  }>();

  for (const event of events) {
    for (const placement of event.placements || []) {
      const archetypeId = slugifyArchetype(placement.archetype || 'unknown');
      const existing = map.get(archetypeId) || {
        archetypeId,
        appearances: 0,
        weightedScore: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      };

      existing.appearances += 1;
      existing.weightedScore += Math.max(1, 9 - placement.placement);
      existing.wins += placement.wins;
      existing.losses += placement.losses;
      existing.draws += placement.draws;
      map.set(archetypeId, existing);
    }
  }

  const totalAppearances = [...map.values()].reduce((sum, item) => sum + item.appearances, 0);

  return [...map.values()]
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .map((item, index) => ({
      archetypeId: item.archetypeId,
      rank: index + 1,
      winRate: toWinRate(item.wins, item.losses, item.draws),
      playRate: totalAppearances > 0 ? Number((item.appearances / totalAppearances).toFixed(4)) : 0,
      weightedScore: Number(item.weightedScore.toFixed(4)),
      trendDirection: 'flat',
    }));
}

function buildCardPerformance(_events: LiveEvent[]): MetaSourceCardPerformance[] {
  // Placeholder: card-level impact comes from decklist aggregation source in next iteration.
  return [];
}

export class EventsLiveAdapter implements MetaSourceAdapter {
  public readonly id = 'events-live';
  private readonly filePath: string;

  constructor(filePath?: string) {
    if (filePath) {
      this.filePath = filePath;
      return;
    }

    const candidates = [
      resolve(process.cwd(), 'apps/web/lib/data/events-live.json'),
      resolve(process.cwd(), 'lib/data/events-live.json'),
    ];

    this.filePath = candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
  }

  async fetch(): Promise<MetaSourcePayload> {
    const raw = await readFile(this.filePath, 'utf-8');
    const events = JSON.parse(raw) as LiveEvent[];
    const archetypes = buildArchetypes(events);

    return {
      source: this.id,
      version: 'v1',
      snapshotDate: new Date().toISOString().slice(0, 10),
      topArchetypes: archetypes.slice(0, 5).map((entry) => entry.archetypeId),
      archetypes,
      cardPerformance: buildCardPerformance(events),
      notes: `Derived from ${events.length} events from events-live.json`,
    };
  }
}
