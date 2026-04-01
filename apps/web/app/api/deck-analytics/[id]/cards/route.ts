import { apiOk, apiError } from '@/lib/api/server';
import { supabase } from '@/lib/supabase/client';
import { getDecks } from '@/lib/data/decks';

export function generateStaticParams() {
  return getDecks().map((deck) => ({ id: deck.id }));
}

interface CardRow {
  card_id: string;
  inclusion_rate_in_archetype: number;
  performance_score: number;
  trend_direction: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const { id } = params;

  if (!supabase) {
    return apiOk({ cards: [] }, request);
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

    const { data, error } = await supabase.rpc('get_deck_card_analytics', {
      p_deck_id: id,
    });

    if (error) {
      return apiError('Card analytics unavailable', 503, request, { code: 'RPC_ERROR' });
    }

    const cards = ((data as CardRow[] | null) ?? []).map((row) => ({
      cardId: row.card_id,
      inclusionRateInArchetype: Number(row.inclusion_rate_in_archetype),
      performanceScore: Number(row.performance_score),
      trendDirection: row.trend_direction as 'up' | 'flat' | 'down',
    }));

    return apiOk({ cards }, request, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch {
    return apiError('Internal error', 500, request);
  }
}
