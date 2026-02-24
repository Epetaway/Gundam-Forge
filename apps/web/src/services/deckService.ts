import { supabase } from '../lib/supabase';
import type { DeckEntry } from '../features/deckbuilder/deckStore';
import { OFFICIAL_DECKS, type OfficialDeck } from '../data/officialDecks';
import { getMetaTierForColors, type MetaTier } from '../data/metaTierList';

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
  slug: string | null;
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
  // Check for local official deck IDs (e.g. "official-deck-001")
  if (deckId.startsWith('official-')) {
    const localDeck = findOfficialDeckByLocalId(deckId);
    if (localDeck) {
      return {
        deck: officialDeckToRecord(localDeck),
        cards: localDeck.cards.map((c) => ({
          cardId: c.cardId,
          qty: c.qty,
          isBoss: c.isBoss,
        })),
      };
    }
  }

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

/** Save deck cards atomically via RPC */
export async function saveDeckCards(deckId: string, entries: DeckEntryWithBoss[]) {
  const cards = entries
    .filter((e) => e.qty > 0)
    .map((e) => ({
      card_id: e.cardId,
      qty: e.qty,
      is_boss: e.isBoss ?? false,
    }));

  const { error } = await supabase.rpc('save_deck_cards', {
    p_deck_id: deckId,
    p_cards: cards,
  });

  if (error) throw error;
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
   Local Official Deck Fallback
   ============================================================ */

/** Convert a static OfficialDeck to a PublicDeckRecord for offline/local display */
function officialDeckToPublic(deck: OfficialDeck): PublicDeckRecord {
  const now = new Date().toISOString();
  const meta = getMetaTierForColors(deck.colors);
  const bossIds = deck.cards.filter((c) => c.isBoss).map((c) => c.cardId);
  return {
    id: `official-${deck.slug}`,
    name: deck.name,
    description: deck.description,
    colors: deck.colors,
    is_public: true,
    view_count: 0,
    like_count: 0,
    archetype: deck.archetype,
    source: 'official',
    source_url: deck.sourceUrl,
    slug: deck.slug,
    created_at: now,
    updated_at: now,
    profiles: null,
    meta_tier: meta?.tier,
    boss_card_ids: bossIds.length > 0 ? bossIds : undefined,
  };
}

/** Convert a static OfficialDeck to a DeckRecord for the detail page */
function officialDeckToRecord(deck: OfficialDeck): DeckRecord {
  const now = new Date().toISOString();
  return {
    id: `official-${deck.slug}`,
    user_id: null,
    name: deck.name,
    description: deck.description,
    is_public: true,
    view_count: 0,
    like_count: 0,
    colors: deck.colors,
    archetype: deck.archetype,
    source: 'official',
    source_url: deck.sourceUrl,
    slug: deck.slug,
    created_at: now,
    updated_at: now,
  };
}

/** Find an official deck by its local ID (e.g. "official-deck-001") */
function findOfficialDeckByLocalId(id: string): OfficialDeck | undefined {
  const slug = id.replace(/^official-/, '');
  return OFFICIAL_DECKS.find((d) => d.slug === slug);
}

/** Look up boss card IDs for any deck that matches an official deck (by slug or name) */
function getBossCardIdsForDeck(deckId: string): string[] | undefined {
  // Try by local ID pattern
  const local = findOfficialDeckByLocalId(deckId);
  if (local) {
    const ids = local.cards.filter((c) => c.isBoss).map((c) => c.cardId);
    return ids.length > 0 ? ids : undefined;
  }
  // Try matching by name for Supabase decks
  const byName = OFFICIAL_DECKS.find(
    (d) => deckId === d.slug || deckId.endsWith(d.slug),
  );
  if (byName) {
    const ids = byName.cards.filter((c) => c.isBoss).map((c) => c.cardId);
    return ids.length > 0 ? ids : undefined;
  }
  return undefined;
}

/** Get official decks as PublicDeckRecords with basic client-side filtering */
function getLocalOfficialDecks(options?: {
  search?: string;
  archetype?: string;
  source?: 'user' | 'official' | 'all';
  color?: string;
  orderBy?: string;
  limit?: number;
}): PublicDeckRecord[] {
  // If filtering for community-only, return nothing from local
  if (options?.source === 'user') return [];

  let decks = OFFICIAL_DECKS.map(officialDeckToPublic);

  if (options?.search) {
    const q = options.search.toLowerCase();
    decks = decks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false) ||
        (d.archetype?.toLowerCase().includes(q) ?? false),
    );
  }

  if (options?.archetype) {
    decks = decks.filter((d) => d.archetype === options.archetype);
  }

  if (options?.color) {
    decks = decks.filter((d) => d.colors.includes(options.color!));
  }

  if (options?.limit) {
    decks = decks.slice(0, options.limit);
  }

  return decks;
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
  slug: string | null;
  created_at: string;
  updated_at: string;
  profiles: { username: string | null; display_name: string | null } | null;
  /** Meta tier from gundamcard.gg tier list (based on color combination) */
  meta_tier?: MetaTier;
  /** Boss/key card IDs for thumbnail display */
  boss_card_ids?: string[];
}

/** Paginated deck response */
export interface PaginatedDecks {
  decks: PublicDeckRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Fetch public community decks (for homepage & explorer) */
export async function fetchPublicDecks(options?: {
  limit?: number;
  search?: string;
  orderBy?: 'view_count' | 'updated_at' | 'like_count';
  archetype?: string;
  source?: 'user' | 'official' | 'all';
  color?: string;
  cursor?: string;
}): Promise<PublicDeckRecord[]> {
  try {
    const limit = options?.limit ?? 12;
    const orderBy = options?.orderBy ?? 'view_count';

    let query = supabase
      .from('decks')
      .select('id, name, description, colors, is_public, view_count, like_count, archetype, source, source_url, slug, created_at, updated_at, profiles(username, display_name)')
      .eq('is_public', true)
      .order(orderBy, { ascending: false })
      .order('id', { ascending: true })
      .limit(limit + 1);

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
      console.warn('[Decks] Supabase fetch failed, using local official decks:', error.message);
      return getLocalOfficialDecks(options);
    }

    // Trim extra record used for hasMore detection
    const trimmed = (data as unknown as PublicDeckRecord[]) ?? [];
    const limited = trimmed.slice(0, limit);

    const results = limited.map((d) => ({
      ...d,
      meta_tier: d.meta_tier ?? getMetaTierForColors(d.colors)?.tier,
      boss_card_ids: d.boss_card_ids ?? getBossCardIdsForDeck(d.id),
    }));

    // If Supabase returned results, use them
    if (results.length > 0) return results;

    // Otherwise fall back to local official decks
    return getLocalOfficialDecks(options);
  } catch {
    return getLocalOfficialDecks(options);
  }
}

/** Fetch public decks with cursor-based pagination */
export async function fetchPublicDecksPaginated(options?: {
  pageSize?: number;
  search?: string;
  orderBy?: 'view_count' | 'updated_at' | 'like_count';
  archetype?: string;
  source?: 'user' | 'official' | 'all';
  color?: string;
  cursor?: string;
}): Promise<PaginatedDecks> {
  const pageSize = options?.pageSize ?? 20;
  const decks = await fetchPublicDecks({
    limit: pageSize,
    search: options?.search,
    orderBy: options?.orderBy,
    archetype: options?.archetype,
    source: options?.source,
    color: options?.color,
  });

  const hasMore = decks.length > pageSize;
  const limited = decks.slice(0, pageSize);
  const lastDeck = limited[limited.length - 1];

  return {
    decks: limited,
    nextCursor: hasMore && lastDeck ? lastDeck.id : null,
    hasMore,
  };
}

/** Fetch trending decks via RPC (time-decayed popularity score) */
export async function fetchTrendingDecks(limit = 20): Promise<PublicDeckRecord[]> {
  try {
    const { data, error } = await supabase.rpc('get_trending_decks', { lim: limit });
    if (error) {
      console.warn('[Decks] Trending RPC failed, falling back to popular:', error.message);
      return fetchPublicDecks({ limit, orderBy: 'view_count' });
    }

    return ((data as unknown as PublicDeckRecord[]) ?? []).map((d) => ({
      ...d,
      profiles: null,
      meta_tier: getMetaTierForColors(d.colors)?.tier,
      boss_card_ids: getBossCardIdsForDeck(d.id),
    }));
  } catch {
    return fetchPublicDecks({ limit, orderBy: 'view_count' });
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

/** Generate a simple viewer hash for anonymous view deduplication */
function getViewerHash(): string {
  let hash = sessionStorage.getItem('gf_viewer_hash');
  if (!hash) {
    hash = crypto.randomUUID();
    sessionStorage.setItem('gf_viewer_hash', hash);
  }
  return hash;
}

/** Increment view count for a public deck (rate-limited: 1 per viewer per 24h) */
export async function incrementDeckView(deckId: string): Promise<void> {
  await supabase.rpc('increment_deck_view', {
    p_deck_id: deckId,
    p_viewer_hash: getViewerHash(),
  });
}
