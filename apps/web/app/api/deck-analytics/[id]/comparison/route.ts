import { DeckAnalyticsComparisonResponseSchema } from '@gundam-forge/shared';
import { apiError, apiOk, enforceContract, toApiErrorResponse } from '@/lib/api/server';
import { supabase } from '@/lib/supabase/client';
import { getDecks } from '@/lib/data/decks';

// Normalize a score that may be stored as 0-1 decimal or 0-100 integer to 0-100.
function normalizeScore(value: number): number {
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

export function generateStaticParams() {
  return getDecks().map((deck) => ({ id: deck.id }));
}

interface ComparisonRow {
  deck_id: string;
  deck_archetype: string;
  meta_proximity_score: number;
  top_archetypes: string[];
  archetype_meta_shares: number[];
  archetype_win_rates: number[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { id } = params;

  if (!supabase) {
    return apiOk({ comparison: null }, request);
  }

  try {
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

    const { data, error } = await supabase.rpc('get_deck_meta_comparison', {
      p_deck_id: id,
    });

    if (error) {
      return apiError('Comparison data unavailable', 503, request, { code: 'RPC_ERROR' });
    }

    const row = (data as ComparisonRow[] | null)?.[0] ?? null;

    if (!row) {
      const response = enforceContract(
        DeckAnalyticsComparisonResponseSchema,
        { comparison: null },
        '/api/deck-analytics/[id]/comparison',
      );

      return apiOk(response, request);
    }

    const comparison = {
      deckId: row.deck_id,
      deckArchetype: row.deck_archetype,
      metaProximityScore: normalizeScore(Number(row.meta_proximity_score)),
      topArchetypes: row.top_archetypes ?? [],
      archetypeMetaShares: (row.archetype_meta_shares ?? []).map(Number),
      archetypeWinRates: (row.archetype_win_rates ?? []).map(Number),
    };

    const response = enforceContract(
      DeckAnalyticsComparisonResponseSchema,
      { comparison },
      '/api/deck-analytics/[id]/comparison',
    );

    return apiOk(response, request, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (err) {
    return toApiErrorResponse('/api/deck-analytics/[id]/comparison', err, request);
  }
}
