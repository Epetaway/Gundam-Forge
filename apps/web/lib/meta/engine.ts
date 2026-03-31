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

// ── Client-side pure analytics compute functions ────────────────────────────
// These run instantly on every deck edit in the builder without needing a
// server round-trip. They power the live-reactive analytics panels.

export interface DeckMetaProximityInput {
  /** Deck archetype label (e.g. "Midrange", "Aggro"). */
  archetype: string;
  /** Deck color array (e.g. ['Blue', 'White']). */
  colors: readonly string[];
  /** Total main-deck card count (excludes resources and EX). */
  mainDeckCount: number;
}

/**
 * computeDeckMetaProximity
 *
 * Returns a 0–100 score representing how closely this deck aligns with the
 * current meta archetypes. Higher = more on-meta.
 *
 * Algorithm:
 *  1. Exact archetype match in top-5 archetypes → 40–80 pts (scaled by rank).
 *  2. Partial name match (substring) → 25 pts.
 *  3. Color overlap with each top-5 archetype name → up to 15 pts.
 *  4. Deck completion bonus (50 cards = full deck) → up to 5 pts.
 */
export function computeDeckMetaProximity(
  deck: DeckMetaProximityInput,
  metaArchetypes: ArchetypeMetaRecord[],
): number {
  if (metaArchetypes.length === 0) return 0;

  const top5 = metaArchetypes.slice(0, 5);
  const normalizedDeckArch = deck.archetype.toLowerCase().trim();

  let score = 0;

  for (let i = 0; i < top5.length; i++) {
    const rank = i + 1; // 1..5
    const meta = top5[i];
    const metaNorm = meta.archetype.toLowerCase();

    // Exact archetype match: rank-1 gets 80 pts, rank-5 gets 40 pts
    if (metaNorm === normalizedDeckArch) {
      score += 80 - (rank - 1) * 8;
      break;
    }

    // Substring match: at least 25 pts
    if (metaNorm.includes(normalizedDeckArch) || normalizedDeckArch.includes(metaNorm)) {
      score = Math.max(score, 25);
    }

    // Color overlap with meta archetype name (e.g. "Blue Purple Midrange")
    const colorOverlapCount = GCG_COLORS.filter(
      (c) => deck.colors.includes(c) && meta.archetype.includes(c),
    ).length;
    if (colorOverlapCount > 0) {
      score += (colorOverlapCount / Math.max(deck.colors.length, 1)) * 15 * (1 - i * 0.15);
    }
  }

  // Completion bonus
  const completionPct = Math.min(1, deck.mainDeckCount / 50);
  score += completionPct * 5;

  return Math.min(100, Math.max(0, Number.parseFloat(score.toFixed(2))));
}

export interface ConsistencyIndexInput {
  /** Card entries with their quantities. */
  entries: ReadonlyArray<{ cardId: string; qty: number; typeLine?: string; cmc?: number }>;
}

/**
 * computeConsistencyIndex
 *
 * Returns a 0–100 score representing how likely the deck is to have a
 * consistent draw pattern.
 *
 * Algorithm:
 *  1. Main deck size (50 = 40 pts, partial = proportional).
 *  2. Resource deck completeness (10 = 20 pts).
 *  3. Curve efficiency: average CMC ≤ 3 = 20 pts, tapers off above.
 *  4. Copy count density: average copies per unique card (ideal = 3) → 20 pts.
 */
export function computeConsistencyIndex(input: ConsistencyIndexInput): number {
  const entries = input.entries;
  if (entries.length === 0) return 0;

  const mainEntries  = entries.filter((e) => e.typeLine !== 'Resource');
  const resEntries   = entries.filter((e) => e.typeLine === 'Resource');

  const mainTotal  = mainEntries.reduce((s, e) => s + e.qty, 0);
  const resTotal   = resEntries.reduce((s, e) => s + e.qty, 0);
  const grandTotal = mainTotal + resTotal;

  if (grandTotal === 0) return 0;

  // (1) Main deck completeness: 50 cards = 40 pts
  const mainScore = Math.min(40, (mainTotal / 50) * 40);

  // (2) Resource deck: 10 cards = 20 pts
  const resScore = Math.min(20, (resTotal / 10) * 20);

  // (3) Curve efficiency using provided CMC values (default 2 if missing)
  const totalCost = mainEntries.reduce((s, e) => s + (e.cmc ?? 2) * e.qty, 0);
  const avgCmc = mainTotal > 0 ? totalCost / mainTotal : 0;
  // avgCmc ≤ 2 → 20 pts; ≤ 3 → 15 pts; ≤ 4 → 8 pts; > 4 → 0 pts
  const curveScore = avgCmc <= 2 ? 20 : avgCmc <= 3 ? 15 : avgCmc <= 4 ? 8 : 0;

  // (4) Copy count density: avg copies per unique card, capped at 4
  const uniqueCards = mainEntries.length;
  const avgCopies = uniqueCards > 0 ? mainTotal / uniqueCards : 0;
  // Ideal = 3–4 copies → 20 pts; tapers below
  const copyScore = Math.min(20, (avgCopies / 3) * 20);

  const total = mainScore + resScore + curveScore + copyScore;
  return Math.min(100, Math.max(0, Number.parseFloat(total.toFixed(2))));
}

// ── Trend direction from sparkline ──────────────────────────────────────────

/**
 * Derives trend direction from a series of scores ordered oldest → newest.
 * Returns 'up' | 'flat' | 'down'.
 */
export function deriveTrendDirection(scores: number[]): 'up' | 'flat' | 'down' {
  if (scores.length < 2) return 'flat';
  const first = scores[0];
  const last  = scores[scores.length - 1];
  const delta = last - first;
  if (delta > 3) return 'up';
  if (delta < -3) return 'down';
  return 'flat';
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
