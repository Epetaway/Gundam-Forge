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
  metaShare: number; // 0–1, fraction of total tournament placements
}

export interface ColorShareRecord {
  color: string;
  count: number;
  share: number; // 0–1
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

// GCG color names as they appear in Limitless deck names (e.g. "Blue Purple Midrange")
const GCG_COLORS = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'] as const;

// Jaccard-like overlap of a deck's colors against colors extracted from a tournament deck name.
// Returns 0–1; 1 means perfect match, 0 means no shared colors.
function colorOverlap(deckColors: readonly string[], deckName: string): number {
  const nameColors = GCG_COLORS.filter((c) => deckName.includes(c));
  if (nameColors.length === 0 || deckColors.length === 0) return 0;
  const deckSet = new Set(deckColors);
  const shared = nameColors.filter((c) => deckSet.has(c)).length;
  return shared / Math.max(deckColors.length, nameColors.length);
}

export function rankTrendingDecks(decks: DeckRecord[], events: EventRecord[], limit: number = 8): TrendingDeckRecord[] {
  // Map Limitless deckId → placements (catalog deck lookup)
  const placementMap = new Map<string, EventPlacementRecord[]>();
  // Map archetype name → placements (tournament deck lookup)
  const archetypeMap = new Map<string, EventPlacementRecord[]>();

  for (const event of events) {
    for (const placement of event.placements) {
      const idBucket = placementMap.get(placement.deckId) ?? [];
      idBucket.push(placement);
      placementMap.set(placement.deckId, idBucket);

      const archBucket = archetypeMap.get(placement.archetype) ?? [];
      archBucket.push(placement);
      archetypeMap.set(placement.archetype, archBucket);
    }
  }

  return decks
    .map((deck) => {
      // Tournament decks match by archetype name; catalog decks by Limitless deckId
      const isTournament = deck.source === 'tournament';
      const placements = isTournament
        ? (archetypeMap.get(deck.archetype) ?? [])
        : (placementMap.get(deck.id) ?? []);

      const winRate = calculateWinRate(placements);
      const eventAppearances = placements.length;
      const weightedPlacements = events.reduce((score, event) => {
        const match = isTournament
          ? event.placements.find((p) => p.archetype === deck.archetype)
          : event.placements.find((p) => p.deckId === deck.id);
        if (!match) return score;
        return score + placementScore(match.placement) * ageWeight(event.date);
      }, 0);

      // Color-overlap boost only for catalog decks with no exact match
      const colorBoost =
        !isTournament && weightedPlacements === 0
          ? events.reduce((score, event) => {
              for (const p of event.placements) {
                const overlap = colorOverlap(deck.colors, p.deckName);
                if (overlap >= 0.5) {
                  score += placementScore(p.placement) * ageWeight(event.date) * overlap * 0.4;
                }
              }
              return score;
            }, 0)
          : 0;

      const socialMomentum = deck.likes * 3 + deck.views * 0.4;
      const performanceBoost = winRate * 100 + eventAppearances * 6;
      const trendingScore = socialMomentum + weightedPlacements + colorBoost + performanceBoost;

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
  let totalPlacements = 0;

  for (const event of events) {
    for (const placement of event.placements) {
      const bucket = map.get(placement.archetype) ?? [];
      bucket.push(placement);
      map.set(placement.archetype, bucket);
      totalPlacements++;
    }
  }

  return Array.from(map.entries())
    .map(([archetype, records]) => {
      const placements = records.length;
      const topThree = records.filter((record) => typeof record.placement === 'number' && record.placement <= 3).length;
      const winRate = calculateWinRate(records);
      const score = topThree * 10 + placements * 2 + winRate * 100;
      return {
        archetype,
        placements,
        topThree,
        winRate,
        score: Number.parseFloat(score.toFixed(2)),
        metaShare: totalPlacements > 0 ? placements / totalPlacements : 0,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getColorDistribution(events: EventRecord[], decks: DeckRecord[]): ColorShareRecord[] {
  const deckMap = new Map(decks.map((d) => [d.id, d]));
  const colorCount = new Map<string, number>();
  let total = 0;

  for (const event of events) {
    for (const placement of event.placements) {
      const deck = deckMap.get(placement.deckId);
      const colors = deck
        ? deck.colors
        : // Fallback: extract color words from the Limitless deck name
          GCG_COLORS.filter((c) => placement.deckName.includes(c));

      for (const color of colors) {
        colorCount.set(color, (colorCount.get(color) ?? 0) + 1);
        total++;
      }
    }
  }

  return Array.from(colorCount.entries())
    .map(([color, count]) => ({ color, count, share: total > 0 ? count / total : 0 }))
    .sort((a, b) => b.count - a.count);
}
