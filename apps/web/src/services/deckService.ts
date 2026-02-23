import { supabase } from '../lib/supabase';
import type { DeckEntry } from '../features/deckbuilder/deckStore';

export interface DeckRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeckCardRecord {
  card_id: string;
  qty: number;
}

/** Fetch all decks for the current user */
export async function fetchUserDecks(): Promise<DeckRecord[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Fetch a single deck with its cards */
export async function fetchDeck(deckId: string): Promise<{ deck: DeckRecord; cards: DeckEntry[] }> {
  const [deckRes, cardsRes] = await Promise.all([
    supabase.from('decks').select('*').eq('id', deckId).single(),
    supabase.from('deck_cards').select('card_id, qty').eq('deck_id', deckId),
  ]);

  if (deckRes.error) throw deckRes.error;
  if (cardsRes.error) throw cardsRes.error;

  return {
    deck: deckRes.data,
    cards: (cardsRes.data ?? []).map((c) => ({ cardId: c.card_id, qty: c.qty })),
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
export async function updateDeck(deckId: string, updates: { name?: string; description?: string; is_public?: boolean }) {
  const { error } = await supabase
    .from('decks')
    .update(updates)
    .eq('id', deckId);

  if (error) throw error;
}

/** Save deck cards (replace all) */
export async function saveDeckCards(deckId: string, entries: DeckEntry[]) {
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
