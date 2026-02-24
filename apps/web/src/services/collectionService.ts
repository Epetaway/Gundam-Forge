import { supabase } from '../lib/supabase';

export interface CollectionRecord {
  card_id: string;
  qty: number;
}

/** Fetch all cards in the current user's collection */
export async function fetchCollection(): Promise<CollectionRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_collections')
      .select('card_id, qty');

    if (error) {
      // Table may not exist yet — fail silently
      console.warn('[Collection] Failed to load:', error.message);
      return [];
    }
    return data ?? [];
  } catch {
    return [];
  }
}

/** Add a card to the collection (or increment qty if it exists) */
export async function addToCollection(cardId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_collections')
    .select('id, qty')
    .eq('card_id', cardId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_collections')
      .update({ qty: existing.qty + 1 })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_collections')
      .insert({ user_id: user.id, card_id: cardId, qty: 1 });
    if (error) throw error;
  }
}

/** Remove a card from the collection (decrement qty or delete) */
export async function removeFromCollection(cardId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_collections')
    .select('id, qty')
    .eq('card_id', cardId)
    .maybeSingle();

  if (!existing) return;

  if (existing.qty <= 1) {
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_collections')
      .update({ qty: existing.qty - 1 })
      .eq('id', existing.id);
    if (error) throw error;
  }
}

/** Set exact qty for a card in collection (0 = remove) */
export async function setCollectionQty(cardId: string, qty: number): Promise<void> {
  if (qty <= 0) {
    await supabase
      .from('user_collections')
      .delete()
      .eq('card_id', cardId);
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_collections')
    .upsert(
      { user_id: user.id, card_id: cardId, qty },
      { onConflict: 'user_id,card_id' }
    );
  if (error) throw error;
}
