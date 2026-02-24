import { useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMetaDeckStore, type ExplorerTab, type SortOption } from '../../stores/metaDeckStore';
import { useAuthStore } from '../../stores/authStore';
import { PREDEFINED_ARCHETYPES } from '../../data/archetypes';

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-blue-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  White: 'bg-gray-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-gray-400',
};

const TABS: { key: ExplorerTab; label: string }[] = [
  { key: 'all', label: 'All Decks' },
  { key: 'official', label: 'Official' },
  { key: 'community', label: 'Community' },
];

export function DeckExplorerPage() {
  const authUser = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    tab, search, archetype, colorFilter, sort,
    decks, likedDeckIds, loading, error,
    setTab, setSearch, setArchetype, setColorFilter, setSort, loadDecks, toggleLike,
  } = useMetaDeckStore();

  const searchTimerRef = useRef<number>();
  const initialLoadDone = useRef(false);

  // On mount, read ?q from URL (e.g. navigated from HomePage search) and load decks
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      const urlQuery = searchParams.get('q');
      if (urlQuery) {
        setSearch(urlQuery);
        // Clear the param from URL so it doesn't persist on filter changes
        setSearchParams({}, { replace: true });
      }
      loadDecks();
    }
  }, [loadDecks, searchParams, setSearch, setSearchParams]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      loadDecks();
    }, 400);
  }, [setSearch, loadDecks]);

  const handleToggleLike = useCallback((e: React.MouseEvent, deckId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!authUser) return;
    toggleLike(deckId);
  }, [authUser, toggleLike]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-gf-text">Deck Explorer</h1>
        <p className="text-sm text-gf-text-secondary mt-1">
          Browse official and community decks. Find your next build.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gf-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-gf-blue text-gf-blue'
                : 'border-transparent text-gf-text-muted hover:text-gf-text hover:border-gf-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="w-full rounded-lg border border-gf-border bg-white py-2 pl-9 pr-3 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:ring-1 focus:ring-gf-blue/30 transition-colors"
            placeholder="Search decks..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Color Filter */}
        <div className="flex items-center gap-1.5">
          {(['all', 'Blue', 'Red', 'Green', 'White', 'Purple'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColorFilter(c === 'all' ? null : c)}
              className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-medium transition-colors ${
                (c === 'all' && !colorFilter) || colorFilter === c
                  ? 'bg-gf-blue text-white'
                  : 'bg-white border border-gf-border text-gf-text-secondary hover:border-gf-blue/30'
              }`}
            >
              {c !== 'all' && <span className={`h-2 w-2 rounded-full ${COLOR_DOT[c]}`} />}
              {c === 'all' ? 'All Colors' : c}
            </button>
          ))}
        </div>

        {/* Archetype Filter */}
        <select
          value={archetype ?? ''}
          onChange={(e) => setArchetype(e.target.value || null)}
          className="rounded-lg border border-gf-border bg-white px-3 py-2 text-xs text-gf-text outline-none focus:border-gf-blue"
        >
          <option value="">All Archetypes</option>
          {PREDEFINED_ARCHETYPES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-gf-border bg-white px-3 py-2 text-xs text-gf-text outline-none focus:border-gf-blue"
        >
          <option value="popular">Most Popular</option>
          <option value="most_liked">Most Liked</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gf-blue border-t-transparent" />
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-xl border border-gf-border bg-white p-12 text-center">
          <p className="text-sm text-gf-text-secondary">No decks match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map((deck) => {
            const isLiked = likedDeckIds.has(deck.id);
            return (
              <Link
                key={deck.id}
                to={`/decks/${deck.id}`}
                className="group rounded-xl border border-gf-border bg-white p-4 hover:border-gf-blue/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gf-light group-hover:bg-gf-blue-light transition-colors">
                    {deck.source === 'official' ? (
                      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gf-text-muted group-hover:text-gf-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gf-text group-hover:text-gf-blue transition-colors truncate">
                        {deck.name}
                      </h3>
                      {deck.source === 'official' && (
                        <span className="flex-shrink-0 rounded-full bg-yellow-50 border border-yellow-200 px-2 py-0.5 text-[9px] font-bold text-yellow-700">
                          Official
                        </span>
                      )}
                      {deck.archetype && (
                        <span className="flex-shrink-0 rounded-full bg-gf-blue/5 border border-gf-blue/20 px-2 py-0.5 text-[9px] font-medium text-gf-blue">
                          {deck.archetype}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {deck.profiles && (
                        <>
                          <span className="text-[10px] text-gf-text-muted">
                            by {deck.profiles.display_name || deck.profiles.username || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-gf-text-muted">&middot;</span>
                        </>
                      )}
                      {deck.source === 'official' && !deck.profiles && (
                        <>
                          <span className="text-[10px] text-gf-text-muted">by Official GCG</span>
                          <span className="text-[10px] text-gf-text-muted">&middot;</span>
                        </>
                      )}
                      <span className="text-[10px] text-gf-text-muted">{deck.view_count} views</span>
                      <span className="text-[10px] text-gf-text-muted">&middot;</span>
                      <span className="text-[10px] text-gf-text-muted flex items-center gap-0.5">
                        <svg className="h-3 w-3" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {deck.like_count}
                      </span>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="flex items-center gap-1.5">
                    {deck.colors.map((c) => (
                      <span key={c} className={`h-3.5 w-3.5 rounded-full ${COLOR_DOT[c] || 'bg-gray-400'}`} />
                    ))}
                  </div>

                  {/* Like button */}
                  {authUser && (
                    <button
                      onClick={(e) => handleToggleLike(e, deck.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isLiked
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-white text-gf-text-muted hover:bg-gf-light hover:text-red-400'
                      }`}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <svg className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}

                  {/* Arrow */}
                  <svg className="h-4 w-4 text-gf-text-muted group-hover:text-gf-blue transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Community callout */}
      <div className="mt-8 rounded-xl border border-dashed border-gf-border bg-gf-light/50 p-8 text-center">
        <p className="text-sm font-medium text-gf-text">Want to share your deck?</p>
        <p className="text-xs text-gf-text-secondary mt-1">
          Build a deck in the Forge and publish it for the community to discover.
        </p>
        <Link to="/forge" className="inline-block mt-3 gf-btn gf-btn-primary text-xs py-2 px-4">
          Open Forge
        </Link>
      </div>
    </div>
  );
}
