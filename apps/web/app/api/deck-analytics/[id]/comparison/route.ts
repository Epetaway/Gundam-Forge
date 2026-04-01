import { apiOk, apiError } from '@/lib/api/server';
import { supabase } from '@/lib/supabase/client';
import { getDecks } from '@/lib/data/decks';

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
      return apiOk({ comparison: null }, request);
    }

    const comparison = {
      deckId: row.deck_id,
      deckArchetype: row.deck_archetype,
      metaProximityScore: Number(row.meta_proximity_score),
      topArchetypes: row.top_archetypes ?? [],
      archetypeMetaShares: (row.archetype_meta_shares ?? []).map(Number),
      archetypeWinRates: (row.archetype_win_rates ?? []).map(Number),
    };

    return apiOk({ comparison }, request, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return apiError('Internal error', 500, request);
  }
}
