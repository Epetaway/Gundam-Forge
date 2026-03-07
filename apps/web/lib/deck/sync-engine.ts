import type { DeckRecord } from '@/lib/data/decks';
import { supabase } from '@/lib/supabase/client';

const LOCAL_DECKS_KEY = 'gundam-forge-local-decks';
const SYNC_STATUS_KEY = 'gundam-forge-sync-status';

export interface LocalDeck extends Omit<DeckRecord, 'likes' | 'views' | 'owner'> {
  localId: string;
  createdAt: string;
  synced?: boolean;
  syncedAt?: string;
  serverId?: string;
}

export interface SyncStatus {
  lastSyncAt: string;
  totalDecks: number;
  syncedDecks: number;
  pendingDecks: number;
}

export interface SyncProgress {
  current: number;
  total: number;
  deckName: string;
}

/**
 * Get all local decks from localStorage
 */
export function getLocalDecks(): LocalDeck[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(LOCAL_DECKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local decks:', error);
    return [];
  }
}

/**
 * Get decks that haven't been synced yet
 */
export function getUnsyncedDecks(): LocalDeck[] {
  const decks = getLocalDecks();
  return decks.filter(deck => !deck.synced);
}

/**
 * Save local decks to localStorage
 */
function saveLocalDecks(decks: LocalDeck[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LOCAL_DECKS_KEY, JSON.stringify(decks));
  } catch (error) {
    console.error('Error saving local decks:', error);
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): SyncStatus | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(SYNC_STATUS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading sync status:', error);
    return null;
  }
}

/**
 * Update sync status
 */
function updateSyncStatus(status: SyncStatus): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

/**
 * Mark a local deck as synced
 */
function markDeckAsSynced(localId: string, serverId: string): void {
  const decks = getLocalDecks();
  const updatedDecks = decks.map(deck =>
    deck.localId === localId
      ? { ...deck, synced: true, syncedAt: new Date().toISOString(), serverId }
      : deck
  );
  saveLocalDecks(updatedDecks);
}

/**
 * Sync a single deck to the server
 */
async function syncDeckToServer(deck: LocalDeck, userId: string): Promise<{ success: boolean; serverId?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Insert deck
    const { data: deckData, error: deckError } = await supabase
      .from('decks')
      .insert({
        user_id: userId,
        name: deck.name,
        description: deck.description || '',
        archetype: deck.archetype || null,
        colors: deck.colors,
        is_public: false, // Default to private
        source: 'user',
        slug: deck.id, // Use local ID as slug initially
      })
      .select('id')
      .single();

    if (deckError) {
      console.error('Error inserting deck:', deckError);
      return { success: false, error: deckError.message };
    }

    const serverId = deckData.id;

    // Insert deck cards
    const deckCards = deck.entries.map(entry => ({
      deck_id: serverId,
      card_id: entry.cardId,
      qty: entry.qty,
      is_boss: false,
    }));

    const { error: cardsError } = await supabase
      .from('deck_cards')
      .insert(deckCards);

    if (cardsError) {
      console.error('Error inserting deck cards:', cardsError);
      // Try to clean up the deck
      await supabase.from('decks').delete().eq('id', serverId);
      return { success: false, error: cardsError.message };
    }

    return { success: true, serverId };
  } catch (error) {
    console.error('Error syncing deck:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Sync all unsynced decks to the server
 */
export async function syncDecksToServer(
  onProgress?: (progress: SyncProgress) => void
): Promise<{ success: boolean; syncedCount: number; failedCount: number; errors: string[] }> {
  if (!supabase) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: ['Supabase not configured'] };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, syncedCount: 0, failedCount: 0, errors: ['Not authenticated'] };
  }

  const unsyncedDecks = getUnsyncedDecks();
  if (unsyncedDecks.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < unsyncedDecks.length; i++) {
    const deck = unsyncedDecks[i];
    
    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: unsyncedDecks.length,
        deckName: deck.name,
      });
    }

    const result = await syncDeckToServer(deck, user.id);
    
    if (result.success && result.serverId) {
      markDeckAsSynced(deck.localId, result.serverId);
      syncedCount++;
    } else {
      failedCount++;
      errors.push(`${deck.name}: ${result.error || 'Unknown error'}`);
    }
  }

  // Update sync status
  const allDecks = getLocalDecks();
  const syncedDecks = allDecks.filter(d => d.synced);
  updateSyncStatus({
    lastSyncAt: new Date().toISOString(),
    totalDecks: allDecks.length,
    syncedDecks: syncedDecks.length,
    pendingDecks: allDecks.length - syncedDecks.length,
  });

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
    errors,
  };
}

/**
 * Download user decks from server to local storage
 */
export async function downloadDecksFromServer(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!supabase) {
    return { success: false, count: 0, error: 'Supabase not configured' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, count: 0, error: 'Not authenticated' };
    }

    // Fetch user decks with cards
    const { data: decks, error: decksError } = await supabase
      .from('decks')
      .select(`
        id,
        name,
        description,
        archetype,
        colors,
        created_at,
        updated_at,
        deck_cards (
          card_id,
          qty
        )
      `)
      .eq('user_id', user.id);

    if (decksError) {
      console.error('Error fetching decks:', decksError);
      return { success: false, count: 0, error: decksError.message };
    }

    if (!decks || decks.length === 0) {
      return { success: true, count: 0 };
    }

    // Convert to LocalDeck format
    const localDecks = getLocalDecks();
    const existingServerIds = new Set(localDecks.map(d => d.serverId).filter(Boolean));

    const newDecks: LocalDeck[] = decks
      .filter(deck => !existingServerIds.has(deck.id))
      .map(deck => ({
        localId: `server-${deck.id}`,
        id: deck.id,
        name: deck.name,
        description: deck.description || '',
        archetype: deck.archetype || 'Custom',
        colors: deck.colors || [],
        entries: (deck.deck_cards || []).map((dc: any) => ({
          cardId: dc.card_id,
          qty: dc.qty,
        })),
        createdAt: deck.created_at,
        updatedAt: deck.updated_at,
        synced: true,
        syncedAt: deck.created_at,
        serverId: deck.id,
      }));

    if (newDecks.length > 0) {
      saveLocalDecks([...localDecks, ...newDecks]);
    }

    return { success: true, count: newDecks.length };
  } catch (error) {
    console.error('Error downloading decks:', error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if sync is needed (has unsynced decks)
 */
export function needsSync(): boolean {
  return getUnsyncedDecks().length > 0;
}
