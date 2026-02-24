import { useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import { useMetaDeckStore, type ExplorerTab, type SortOption } from '../../stores/metaDeckStore';
import { useAuthStore } from '../../stores/authStore';
import { PREDEFINED_ARCHETYPES } from '../../data/archetypes';
import { TIER_LABELS, TIER_COLORS, META_TIER_LIST } from '../../data/metaTierList';
import { TopDeckCard } from '../../components/deck/TopDeckCard';

const colorOptions: { color: string; bg: string; label: string }[] = [
  { color: 'Red', bg: 'bg-card-red', label: 'Red' },
  { color: 'Blue', bg: 'bg-card-blue', label: 'Blue' },
  { color: 'Green', bg: 'bg-card-green', label: 'Green' },
  { color: 'White', bg: 'bg-yellow-400', label: 'Yellow' },
  { color: 'Purple', bg: 'bg-purple-500', label: 'Purple' },
];

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
    decks, loading, error,
    setTab, setSearch, setArchetype, setColorFilter, setSort, loadDecks,
  } = useMetaDeckStore();

  const searchTimerRef = useRef<number>();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      const urlQuery = searchParams.get('q');
      if (urlQuery) {
        setSearch(urlQuery);
        setSearchParams({}, { replace: true });
      }
      loadDecks();
    }
  }, [loadDecks, searchParams, setSearch, setSearchParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      loadDecks();
    }, 400);
  }, [setSearch, loadDecks]);

  const hasActiveFilters = search || archetype || colorFilter || tab !== 'all';

  const handleClearFilters = () => {
    setSearch('');
    setArchetype(null);
    setColorFilter(null);
    setTab('all');
    loadDecks();
  };

  return (
    <div className="min-h-[calc(100vh-var(--gf-header-height))] bg-gf-light">
      {/* ── Header + Filters (matches CardDatabasePage chrome) ── */}
      <div className="border-b border-gf-border bg-gf-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-gf-text">Deck Database</h1>
            <span className="text-xs text-gf-text-muted font-medium tabular-nums">
              {decks.length} decks
            </span>
          </div>

          {/* Meta Tier Strip */}
          <div className="mb-4">
            <Swiper
              modules={[FreeMode]}
              spaceBetween={8}
              slidesPerView="auto"
              freeMode={{ enabled: true, sticky: false }}
            >
              {META_TIER_LIST.map((m) => (
                <SwiperSlide key={m.name} style={{ width: 'auto' }}>
                  <div className="flex items-center gap-1.5 rounded-md border border-gf-border px-2.5 py-1.5 bg-gf-light whitespace-nowrap">
                    <span className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold border ${TIER_COLORS[m.tier]}`}>
                      {TIER_LABELS[m.tier]}
                    </span>
                    <span className="text-[10px] font-medium text-gf-text">{m.name}</span>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-sm">
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  className="w-full rounded-lg border border-gf-border bg-gf-light py-2 pl-9 pr-9 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:bg-gf-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
                  placeholder="Search by name or archetype..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); loadDecks(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gf-text-muted hover:bg-gray-200 hover:text-gf-text transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Color</label>
              <div className="flex items-center gap-1.5">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.color}
                    onClick={() => setColorFilter(colorFilter === opt.color ? null : opt.color)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${opt.bg} ${
                      colorFilter === opt.color
                        ? 'ring-2 ring-gf-blue ring-offset-1 scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Source</label>
              <div className="flex flex-wrap gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      tab === t.key
                        ? 'border-gf-blue bg-gf-blue text-white'
                        : 'border-gf-border bg-gf-white text-gf-text-secondary hover:border-gf-blue hover:text-gf-blue'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Archetype */}
            <div className="min-w-[140px]">
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Archetype</label>
              <select
                value={archetype ?? ''}
                onChange={(e) => setArchetype(e.target.value || null)}
                className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
              >
                <option value="">All Archetypes</option>
                {PREDEFINED_ARCHETYPES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="min-w-[120px]">
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
              >
                <option value="popular">Most Popular</option>
                <option value="most_liked">Most Liked</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="rounded-md border border-gf-border bg-gf-white px-3 py-1.5 text-[11px] font-medium text-gf-text-muted hover:text-gf-text hover:border-gf-blue transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Deck Grid ── */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="rounded-xl bg-gf-border/20 animate-pulse" style={{ aspectRatio: '5/7' }} />
                <div className="mt-1.5 h-3 w-2/3 rounded bg-gf-border/20 animate-pulse" />
              </div>
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-gf-text">No decks found</p>
            <p className="text-xs text-gf-text-muted mt-1">Try adjusting your filters.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-3 text-xs font-medium text-gf-blue hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {decks.map((deck) => (
              <TopDeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="mt-10 rounded-xl bg-gf-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] p-8 text-center">
            <p className="text-sm font-medium text-gf-text">Want to share your deck?</p>
            <p className="text-xs text-gf-text-secondary mt-1">
              Build a deck in the Forge and publish it for the community to discover.
            </p>
            <Link to="/forge" className="inline-block mt-3 gf-btn gf-btn-primary text-xs py-2 px-4">
              Open Forge
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
