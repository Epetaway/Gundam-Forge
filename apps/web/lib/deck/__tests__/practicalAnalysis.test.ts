import { describe, expect, it } from 'vitest';
import { buildPracticalDeckAnalysis, calculateDrawOddsAtLeast } from '@/lib/deck/practicalAnalysis';
import type { DeckAnalyticsDto } from '@/lib/api/deckAnalytics';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

function makeItem(overrides: Partial<DeckViewItem>): DeckViewItem {
  return {
    id: 'TST-001',
    name: 'Test Card',
    typeLine: 'Unit',
    cmc: 2,
    qty: 1,
    ...overrides,
  };
}

describe('practicalAnalysis', () => {
  it('uses curated mechanic mapping before text fallback for role detection', () => {
    const items: DeckViewItem[] = [
      makeItem({ id: 'GD03-072', text: '', qty: 3 }), // mapped as blocker mechanic
      makeItem({ id: 'X-UNKNOWN', text: 'Draw 1 card.', qty: 2 }),
    ];

    const analysis = buildPracticalDeckAnalysis(items, null, 70);
    const defense = analysis.roles.find((r) => r.role === 'Defense');
    const draw = analysis.roles.find((r) => r.role === 'Draw');

    expect(defense?.qty).toBe(3);
    expect(draw?.qty).toBe(2);
  });

  it('computes known draw-odds values correctly', () => {
    // Probability of drawing at least one success in 2 draws from population=4 with 1 success:
    // 1 - C(3,2)/C(4,2) = 1 - 3/6 = 0.5
    const p = calculateDrawOddsAtLeast(1, 4, 1, 2);
    expect(p).toBeCloseTo(0.5, 6);
  });

  it('uses official server analytics for meta snapshot rows', () => {
    const items: DeckViewItem[] = [
      makeItem({ id: 'A-001', cmc: 2, qty: 10 }),
    ];

    const analytics: DeckAnalyticsDto = {
      deckId: 'deck-1',
      snapshotDate: '2026-04-01',
      viewCountDelta: 3,
      likeCountDelta: 1,
      metaProximityScore: 51,
      consistencyIndex: 62,
      archetypePopularityRank: 4,
      colorComboRank: 2,
      trendDirection: 'up',
      sparklineDates: ['2026-03-30', '2026-03-31', '2026-04-01'],
      sparklineScores: [48, 50, 51],
    };

    const analysis = buildPracticalDeckAnalysis(items, analytics, 62);

    expect(analysis.matchups.find((row) => row.label === 'Source')?.value).toContain('Official');
    expect(analysis.matchups.find((row) => row.label === 'Archetype Rank')?.value).toBe('#4');
    expect(analysis.matchups.find((row) => row.label === 'Color Rank')?.value).toBe('#2');
  });
});
