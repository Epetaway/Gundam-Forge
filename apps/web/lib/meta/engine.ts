import type { DeckRecord } from '@/lib/data/decks';
import type { EventRecord, EventPlacementRecord } from '@/lib/data/events';

export interface TrendingDeckRecord extends DeckRecord {
  trendingScore: number;
  winRate: number;
  eventAppearances: number;
}

export interface ArchetypeMetaRecord {
  archetype: string;
  placements: number;
  topThree: number;
  winRate: number;
  score: number;
}

function ageWeight(eventDate: string): number {
  const eventMs = new Date(eventDate).getTime();
  const nowMs = Date.now();
  const days = Math.max(0, (nowMs - eventMs) / (1000 * 60 * 60 * 24));
  if (days <= 30) return 1;
  if (days <= 90) return 0.75;
  if (days <= 180) return 0.45;
  return 0.2;
}

function placementScore(placement: number): number {
  if (placement === 1) return 40;
  if (placement === 2) return 24;
  if (placement === 3) return 18;
  if (placement <= 8) return 10;
  if (placement <= 16) return 5;
  return 2;
}

function calculateWinRate(records: EventPlacementRecord[]): number {
  const wins = records.reduce((sum, record) => sum + record.wins, 0);
  const losses = records.reduce((sum, record) => sum + record.losses, 0);
  const draws = records.reduce((sum, record) => sum + record.draws, 0);
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return wins / total;
}

export function rankTrendingDecks(decks: DeckRecord[], events: EventRecord[], limit: number = 8): TrendingDeckRecord[] {
  const placementMap = new Map<string, EventPlacementRecord[]>();

  for (const event of events) {
    for (const placement of event.placements) {
      const bucket = placementMap.get(placement.deckId) ?? [];
      bucket.push(placement);
      placementMap.set(placement.deckId, bucket);
    }
  }

  return decks
    .map((deck) => {
      const placements = placementMap.get(deck.id) ?? [];
      const winRate = calculateWinRate(placements);
      const eventAppearances = placements.length;
      const weightedPlacements = events.reduce((score, event) => {
        const eventPlacement = event.placements.find((placement) => placement.deckId === deck.id);
        if (!eventPlacement) return score;
        return score + placementScore(eventPlacement.placement) * ageWeight(event.date);
      }, 0);
      const socialMomentum = deck.likes * 3 + deck.views * 0.4;
      const performanceBoost = winRate * 100 + eventAppearances * 6;
      const trendingScore = socialMomentum + weightedPlacements + performanceBoost;

      return {
        ...deck,
        trendingScore: Number.parseFloat(trendingScore.toFixed(2)),
        winRate,
        eventAppearances,
      };
    })
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);
}

export function rankArchetypes(events: EventRecord[]): ArchetypeMetaRecord[] {
  const map = new Map<string, EventPlacementRecord[]>();

  for (const event of events) {
    for (const placement of event.placements) {
      const bucket = map.get(placement.archetype) ?? [];
      bucket.push(placement);
      map.set(placement.archetype, bucket);
    }
  }

  return Array.from(map.entries())
    .map(([archetype, records]) => {
      const placements = records.length;
      const topThree = records.filter((record) => record.placement <= 3).length;
      const winRate = calculateWinRate(records);
      const score = topThree * 10 + placements * 2 + winRate * 100;
      return {
        archetype,
        placements,
        topThree,
        winRate,
        score: Number.parseFloat(score.toFixed(2)),
      };
    })
    .sort((a, b) => b.score - a.score);
}
