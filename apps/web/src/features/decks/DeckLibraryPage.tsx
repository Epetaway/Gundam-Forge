import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  fetchUserDecks,
  createDeck,
  deleteDeck,
  duplicateDeck,
  updateDeck,
  type DeckRecord,
} from '../../services/deckService';

export function DeckLibraryPage() {
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabaseConfigured =
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  const loadDecks = useCallback(async () => {
    if (!supabaseConfigured || !authUser) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await fetchUserDecks();
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
    } finally {
      setLoading(false);
    }
  }, [supabaseConfigured, authUser]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const filteredDecks = useMemo(() => {
    if (!searchQuery.trim()) return decks;
    const q = searchQuery.toLowerCase();
    return decks.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.archetype && d.archetype.toLowerCase().includes(q))
    );
  }, [decks, searchQuery]);

  const handleCreate = async () => {
    setCreatingDeck(true);
    try {
      const deck = await createDeck('Untitled Deck');
      navigate(`/builder?deck=${deck.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleDuplicate = async (deckId: string) => {
    try {
      const newDeck = await duplicateDeck(deckId);
      setDecks((prev) => [newDeck, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate deck');
    }
  };

  const handleDelete = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
    }
  };

  const handleRename = async (deckId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await updateDeck(deckId, { name: trimmed });
      setDecks((prev) =>
        prev.map((d) => (d.id === deckId ? { ...d, name: trimmed } : d))
      );
      setRenamingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename deck');
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  // Local-only mode: no Supabase
  if (!supabaseConfigured || !authUser) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-xl font-bold text-gf-text">My Decks</h1>
        </div>
        <div className="rounded-xl border border-gf-border bg-gf-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gf-light mx-auto mb-4">
            <svg className="h-7 w-7 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-gf-text mb-1">Local Mode</h2>
          <p className="text-xs text-gf-text-secondary mb-4">
            You're running in local mode. Your current deck is saved in browser storage.
          </p>
          <div className="flex justify-center gap-2">
            <Link to="/builder" className="gf-btn gf-btn-primarytext-xs py-2 px-4">
              Open Deck Builder
            </Link>
            {!authUser && supabaseConfigured === false && (
              <p className="text-[10px] text-gf-text-muted mt-2">
                Connect Supabase to save multiple decks in the cloud.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-gf-text">My Decks</h1>
          <p className="text-xs text-gf-text-secondary mt-0.5">
            {filteredDecks.length} deck{filteredDecks.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creatingDeck}
          className="gf-btn gf-btn-primarytext-sm py-2 px-4 disabled:opacity-60"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {creatingDeck ? 'Creating...' : 'New Deck'}
        </button>
      </div>

      {/* Search */}
      {decks.length > 0 && (
        <div className="relative max-w-sm mb-4">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="w-full rounded-lg border border-gf-border bg-gf-white py-2 pl-9 pr-9 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:ring-1 focus:ring-gf-blue/30 transition-colors"
            placeholder="Search your decks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gf-text-muted hover:bg-gray-200 hover:text-gf-text transition-colors"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 ml-2">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gf-blue border-t-transparent" />
        </div>
      ) : filteredDecks.length === 0 && !searchQuery ? (
        /* Empty state */
        <div className="rounded-xl border border-gf-border bg-gf-white p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gf-light mx-auto mb-4">
            <svg className="h-8 w-8 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="font-heading text-sm font-bold text-gf-text mb-1">No Decks Yet</h2>
          <p className="text-xs text-gf-text-secondary mb-4">
            Create your first deck to start building.
          </p>
          <button
            onClick={handleCreate}
            disabled={creatingDeck}
            className="gf-btn gf-btn-primarytext-sm py-2 px-4"
          >
            Create First Deck
          </button>
        </div>
      ) : filteredDecks.length === 0 && searchQuery ? (
        <div className="rounded-xl border border-gf-border bg-gf-white p-8 text-center">
          <p className="text-sm text-gf-text-secondary">No decks match your search.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-medium text-gf-blue hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        /* Deck Grid */
        <div className="grid gap-3">
          {filteredDecks.map((deck) => (
            <div
              key={deck.id}
              className="group rounded-xl border border-gf-border bg-gf-white hover:border-gf-blue/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 p-4">
                {/* Deck icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gf-blue-light">
                  <svg className="h-5 w-5 text-gf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {renamingId === deck.id ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleRename(deck.id); }}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        className="flex-1 rounded border border-gf-blue bg-gf-white px-2 py-1 text-sm text-gf-text outline-none"
                        onKeyDown={(e) => { if (e.key === 'Escape') setRenamingId(null); }}
                      />
                      <button type="submit" className="text-xs text-gf-blue font-medium hover:underline">
                        Save
                      </button>
                      <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-gf-text-muted hover:underline">
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-gf-text truncate">
                        {deck.name}
                        {deck.archetype && (
                          <span className="ml-2 rounded-full bg-gf-blue/5 border border-gf-blue/20 px-2 py-0.5 text-[9px] font-medium text-gf-blue">
                            {deck.archetype}
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-gf-text-muted mt-0.5">
                        Updated {formatDate(deck.updated_at)}
                        {deck.is_public && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                            Public
                          </span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/builder?deck=${deck.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light hover:text-gf-blue transition-colors"
                    title="Edit"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link
                    to={`/sim?deck=${deck.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light hover:text-gf-blue transition-colors"
                    title="Simulate"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </Link>
                  <Link
                    to={`/diagnostics?deck=${deck.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light hover:text-gf-blue transition-colors"
                    title="Analytics"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>

                  {/* More actions: rename, duplicate, delete */}
                  <button
                    onClick={() => { setRenamingId(deck.id); setRenameValue(deck.name); }}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light hover:text-gf-text transition-colors"
                    title="Rename"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDuplicate(deck.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-gf-light hover:text-gf-text transition-colors"
                    title="Duplicate"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingId(deck.id)}
                    className="flex h-7 w-7 items-center justify-center rounded text-gf-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {deletingId === deck.id && (
                <div className="border-t border-gf-border bg-red-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-red-700">
                    Delete <strong>{deck.name}</strong>? This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-xs text-gf-text-muted hover:text-gf-text"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deck.id)}
                      className="gf-btn gf-btn-destructive text-xs py-1 px-3"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
