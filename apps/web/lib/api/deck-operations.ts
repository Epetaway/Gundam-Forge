import { supabase } from '@/lib/supabase/client';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  colors: string[];
  archetype: string | null;
  slug: string;
  source: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  like_count: number;
}

export interface DeckCard {
  deck_id: string;
  card_id: string;
  qty: number;
  is_boss: boolean;
}

export interface DeckWithCards extends Deck {
  deck_cards: DeckCard[];
}

/**
 * Get a single deck by ID
 */
export async function getDeckById(id: string): Promise<{ data: DeckWithCards | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .select(`
        *,
        deck_cards (
          card_id,
          qty,
          is_boss
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching deck:', error);
      return { data: null, error: error.message };
    }

    return { data: data as DeckWithCards, error: null };
  } catch (error) {
    console.error('Error fetching deck:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get user's decks (both public and private)
 */
export async function getUserDecks(userId: string): Promise<{ data: Deck[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user decks:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Deck[], error: null };
  } catch (error) {
    console.error('Error fetching user decks:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get public decks for Explore page
 */
export async function getPublicDecks(limit: number = 50): Promise<{ data: Deck[] | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching public decks:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Deck[], error: null };
  } catch (error) {
    console.error('Error fetching public decks:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Toggle deck visibility (public/private)
 */
export async function toggleDeckVisibility(deckId: string): Promise<{ success: boolean; isPublic?: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current deck to check ownership and flip visibility
    const { data: deck, error: fetchError } = await supabase
      .from('decks')
      .select('id, user_id, is_public')
      .eq('id', deckId)
      .single();

    if (fetchError) {
      console.error('Error fetching deck:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!deck) {
      return { success: false, error: 'Deck not found' };
    }

    if (deck.user_id !== user.id) {
      return { success: false, error: 'Not authorized to modify this deck' };
    }

    // Toggle visibility
    const newVisibility = !deck.is_public;
    const { error: updateError } = await supabase
      .from('decks')
      .update({ is_public: newVisibility })
      .eq('id', deckId);

    if (updateError) {
      console.error('Error updating deck visibility:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, isPublic: newVisibility };
  } catch (error) {
    console.error('Error toggling deck visibility:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Clone a deck (create a copy for the current user)
 */
export async function cloneDeck(sourceDeckId: string, newName?: string): Promise<{ success: boolean; deckId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Fetch source deck with cards
    const { data: sourceDeck, error: fetchError } = await supabase
      .from('decks')
      .select(`
        *,
        deck_cards (
          card_id,
          qty,
          is_boss
        )
      `)
      .eq('id', sourceDeckId)
      .single();

    if (fetchError) {
      console.error('Error fetching source deck:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!sourceDeck) {
      return { success: false, error: 'Source deck not found' };
    }

    // Check if deck is public or owned by user
    if (!sourceDeck.is_public && sourceDeck.user_id !== user.id) {
      return { success: false, error: 'Deck is private and you do not have access' };
    }

    // Determine new deck name
    const deckName = newName || `${sourceDeck.name} (Copy)`;

    // Create new deck
    const { data: newDeck, error: createError } = await supabase
      .from('decks')
      .insert({
        user_id: user.id,
        name: deckName,
        description: sourceDeck.description,
        archetype: sourceDeck.archetype,
        colors: sourceDeck.colors,
        is_public: false, // Default to private
        source: 'cloned',
        slug: `${sourceDeckId}-${Date.now()}`, // Generate unique slug
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating deck:', createError);
      return { success: false, error: createError.message };
    }

    const newDeckId = newDeck.id;

    // Copy deck cards
    const cards = (sourceDeck as any).deck_cards.map((card: DeckCard) => ({
      deck_id: newDeckId,
      card_id: card.card_id,
      qty: card.qty,
      is_boss: card.is_boss,
    }));

    const { error: cardsError } = await supabase
      .from('deck_cards')
      .insert(cards);

    if (cardsError) {
      console.error('Error copying deck cards:', cardsError);
      // Try to clean up the deck
      await supabase.from('decks').delete().eq('id', newDeckId);
      return { success: false, error: cardsError.message };
    }

    return { success: true, deckId: newDeckId };
  } catch (error) {
    console.error('Error cloning deck:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Increment deck view count
 */
export async function incrementDeckViews(deckId: string): Promise<void> {
  if (!supabase) return;

  // Fire-and-forget RPC call to increment views
  void supabase.rpc('increment_deck_views', { p_deck_id: deckId });
}

/**
 * Get shareable link for a deck
 */
export function getDeckShareUrl(deckId: string): string {
  if (typeof window === 'undefined') {
    return `https://gundam-forge.example.com/decks/${deckId}`;
  }
  return `${window.location.origin}/decks/${deckId}`;
}
