import { apiOk, apiError } from '@/lib/api/server';
import { supabase } from '@/lib/supabase/client';
import { getDecks } from '@/lib/data/decks';

export function generateStaticParams() {
  return getDecks().map((deck) => ({ id: deck.id }));
}

interface AnalyticsRow {
  deck_id: string;
  snapshot_date: string;
  view_count_delta: number;
  like_count_delta: number;
  meta_proximity_score: number;
  consistency_index: number;
  archetype_popularity_rank: number | null;
  color_combo_rank: number | null;
  trend_direction: string;
  sparkline_dates: string[];
  sparkline_scores: number[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { id } = params;

  if (!supabase) {
    // Fallback for static/export mode: return empty analytics
    return apiOk({ analytics: null }, request);
  }

  try {
    // Check deck visibility — public or owned by requester
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: deck, error: deckErr } = await supabase
      .from('decks')
      .select('id, is_public, user_id')
      .eq('id', id)
      .single();

    if (deckErr || !deck) {
      return apiError('Deck not found', 404, request, { code: 'DECK_NOT_FOUND' });
    }

    const isOwner = user !== null && deck.user_id === user.id;
    if (!deck.is_public && !isOwner) {
      return apiError('Forbidden', 403, request, { code: 'FORBIDDEN' });
    }

    const { data, error } = await supabase.rpc('get_deck_analytics', {
      p_deck_id: id,
    });

    if (error) {
      return apiError('Analytics unavailable', 503, request, { code: 'RPC_ERROR' });
    }

    const row = (data as AnalyticsRow[] | null)?.[0] ?? null;

    if (!row) {
      return apiOk({ analytics: null }, request, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    const analytics = {
      deckId: row.deck_id,
      snapshotDate: row.snapshot_date,
      viewCountDelta: row.view_count_delta,
      likeCountDelta: row.like_count_delta,
      metaProximityScore: Number(row.meta_proximity_score),
      consistencyIndex: Number(row.consistency_index),
      archetypePopularityRank: row.archetype_popularity_rank,
      colorComboRank: row.color_combo_rank,
      trendDirection: row.trend_direction as 'up' | 'flat' | 'down',
      sparklineDates: row.sparkline_dates ?? [],
      sparklineScores: (row.sparkline_scores ?? []).map(Number),
    };

    return apiOk({ analytics }, request, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    return apiError('Internal error', 500, request);
  }
}
