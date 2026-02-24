import { supabase } from '../lib/supabase';
import type { DeckEntry } from '../features/deckbuilder/deckStore';

export interface DeckRecord {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  is_public: boolean;
  view_count: number;
  like_count: number;
  colors: string[];
  archetype: string | null;
  source: 'user' | 'official';
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeckCardRecord {
  card_id: string;
  qty: number;
  is_boss: boolean;
}

export interface DeckEntryWithBoss {
  cardId: string;
  qty: number;
  isBoss?: boolean;
}

/** Fetch all decks for the current user */
export async function fetchUserDecks(): Promise<DeckRecord[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('source', 'user')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Fetch a single deck with its cards */
export async function fetchDeck(deckId: string): Promise<{ deck: DeckRecord; cards: DeckEntryWithBoss[] }> {
  const [deckRes, cardsRes] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase.from('deck_cards').select('card_id, qty, is_boss').eq('deck_id', deckId),
  ]);

  if (deckRes.error) throw deckRes.error;
  if (cardsRes.error) throw cardsRes.error;

  return {
    deck: deckRes.data,
    cards: (cardsRes.data ?? []).map((c) => ({
      cardId: c.card_id,
      qty: c.qty,
      isBoss: c.is_boss ?? false,
    })),
  };
}

/** Create a new deck */
export async function createDeck(name: string): Promise<DeckRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('decks')
    .insert({ name, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update deck metadata */
export async function updateDeck(
  deckId: string,
  updates: { name?: string; description?: string; is_public?: boolean; archetype?: string | null }
) {
  const { error } = await supabase
    .from('decks')
    .update(updates)
    .eq('id', deckId);

  if (error) throw error;
}

/** Save deck cards (replace all) */
export async function saveDeckCards(deckId: string, entries: DeckEntryWithBoss[]) {
  // Delete existing cards
  const { error: deleteError } = await supabase
    .from('deck_cards')
    .delete()
    .eq('deck_id', deckId);

  if (deleteError) throw deleteError;

  // Insert new cards
  if (entries.length > 0) {
    const rows = entries
      .filter((e) => e.qty > 0)
      .map((e) => ({
        deck_id: deckId,
        card_id: e.cardId,
        qty: e.qty,
        is_boss: e.isBoss ?? false,
      }));

    const { error: insertError } = await supabase
      .from('deck_cards')
      .insert(rows);

    if (insertError) throw insertError;
  }

  // Touch updated_at
  await supabase.from('decks').update({ updated_at: new Date().toISOString() }).eq('id', deckId);
}

/** Duplicate a deck */
export async function duplicateDeck(deckId: string): Promise<DeckRecord> {
  const { deck, cards } = await fetchDeck(deckId);
  const newDeck = await createDeck(`${deck.name} (Copy)`);
  await saveDeckCards(newDeck.id, cards);
  return newDeck;
}

/** Delete a deck */
export async function deleteDeck(deckId: string) {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (error) throw error;
}

/* ============================================================
   Public / Community Decks
   ============================================================ */

export interface PublicDeckRecord {
  id: string;
  name: string;
  description: string | null;
  colors: string[];
  is_public: boolean;
  view_count: number;
  like_count: number;
  archetype: string | null;
  source: 'user' | 'official';
  source_url: string | null;
  created_at: string;
  updated_at: string;
  profiles: { username: string | null; display_name: string | null } | null;
}

/** Fetch public community decks (for homepage & explorer) */
export async function fetchPublicDecks(options?: {
  limit?: number;
  search?: string;
  orderBy?: 'view_count' | 'updated_at' | 'like_count';
  archetype?: string;
  source?: 'user' | 'official' | 'all';
  color?: string;
}): Promise<PublicDeckRecord[]> {
  try {
    const limit = options?.limit ?? 12;
    const orderBy = options?.orderBy ?? 'view_count';

    let query = supabase
      .from('decks')
      .select('id, name, description, colors, is_public, view_count, like_count, archetype, source, source_url, created_at, updated_at, profiles(username, display_name)')
      .eq('is_public', true)
      .order(orderBy, { ascending: false })
      .limit(limit);

    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options?.archetype) {
      query = query.eq('archetype', options.archetype);
    }

    if (options?.source && options.source !== 'all') {
      query = query.eq('source', options.source);
    }

    if (options?.color) {
      query = query.contains('colors', [options.color]);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Decks] Failed to fetch public decks:', error.message);
      return [];
    }
    return (data as unknown as PublicDeckRecord[]) ?? [];
  } catch {
    return [];
  }
}

/* ============================================================
   Likes
   ============================================================ */

/** Toggle like on a deck (like/unlike). Returns new state. */
export async function toggleDeckLike(deckId: string): Promise<{ liked: boolean; like_count: number }> {
  const { data, error } = await supabase.rpc('toggle_deck_like', { target_deck_id: deckId });
  if (error) throw error;
  return data as { liked: boolean; like_count: number };
}

/** Check if the current user has liked a specific deck */
export async function fetchLikeStatus(deckId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('deck_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('deck_id', deckId)
    .maybeSingle();

  return !!data;
}

/** Check like status for multiple decks at once (batch) */
export async function fetchBulkLikeStatus(deckIds: string[]): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || deckIds.length === 0) return new Set();

  const { data } = await supabase
    .from('deck_likes')
    .select('deck_id')
    .eq('user_id', user.id)
    .in('deck_id', deckIds);

  return new Set((data ?? []).map((r) => r.deck_id));
}

/** Increment view count for a public deck */
export async function incrementDeckView(deckId: string): Promise<void> {
  await supabase.rpc('increment_deck_view', { deck_id: deckId });
}
