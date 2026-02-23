import { useState } from 'react';
import { Link } from 'react-router-dom';

type SortOption = 'popular' | 'newest' | 'viewed';
type ColorFilter = 'all' | 'Blue' | 'Red' | 'Green' | 'White' | 'Purple';

// Placeholder deck data until Supabase public decks are wired
const PLACEHOLDER_DECKS = [
  { id: 'demo-1', name: 'Blue Tempo Rush', author: 'Pilot_Alpha', colors: ['Blue'], cards: 50, views: 342, updated: '2026-02-20', is_public: true },
  { id: 'demo-2', name: 'Red Aggro Blitz', author: 'Commander_Z', colors: ['Red'], cards: 50, views: 289, updated: '2026-02-19', is_public: true },
  { id: 'demo-3', name: 'Green Ramp Control', author: 'NewtypeAce', colors: ['Green'], cards: 50, views: 215, updated: '2026-02-18', is_public: true },
  { id: 'demo-4', name: 'Purple Disruption', author: 'ZakuPilot', colors: ['Purple'], cards: 50, views: 178, updated: '2026-02-17', is_public: true },
  { id: 'demo-5', name: 'White Weenie Swarm', author: 'FeddiePilot', colors: ['White'], cards: 50, views: 156, updated: '2026-02-16', is_public: true },
  { id: 'demo-6', name: 'Blue-Red Midrange', author: 'AceCustom', colors: ['Blue', 'Red'], cards: 50, views: 134, updated: '2026-02-15', is_public: true },
];

const COLOR_DOT: Record<string, string> = {
  Blue: 'bg-blue-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  White: 'bg-gray-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-gray-400',
};

export function DeckExplorerPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('popular');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');

  const filtered = PLACEHOLDER_DECKS
    .filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (colorFilter !== 'all' && !d.colors.includes(colorFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'popular') return b.views - a.views;
      if (sort === 'newest') return b.updated.localeCompare(a.updated);
      if (sort === 'viewed') return b.views - a.views;
      return 0;
    });

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gf-text">Deck Explorer</h1>
        <p className="text-sm text-gf-text-secondary mt-1">
          Browse community decks and find your next build
        </p>
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Color Filter */}
        <div className="flex items-center gap-1.5">
          {(['all', 'Blue', 'Red', 'Green', 'White', 'Purple'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setColorFilter(c)}
              className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-medium transition-colors ${
                colorFilter === c
                  ? 'bg-gf-blue text-white'
                  : 'bg-white border border-gf-border text-gf-text-secondary hover:border-gf-blue/30'
              }`}
            >
              {c !== 'all' && <span className={`h-2 w-2 rounded-full ${COLOR_DOT[c]}`} />}
              {c === 'all' ? 'All Colors' : c}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-gf-border bg-white px-3 py-2 text-xs text-gf-text outline-none focus:border-gf-blue"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="viewed">Most Viewed</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gf-border bg-white p-12 text-center">
          <p className="text-sm text-gf-text-secondary">No decks match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((deck) => (
            <Link
              key={deck.id}
              to={`/decks/${deck.id}`}
              className="group rounded-xl border border-gf-border bg-white p-4 hover:border-gf-blue/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gf-light group-hover:bg-gf-blue-light transition-colors">
                  <svg className="h-5 w-5 text-gf-text-muted group-hover:text-gf-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gf-text group-hover:text-gf-blue transition-colors truncate">
                    {deck.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gf-text-muted">by {deck.author}</span>
                    <span className="text-[10px] text-gf-text-muted">·</span>
                    <span className="text-[10px] text-gf-text-muted">{deck.cards} cards</span>
                    <span className="text-[10px] text-gf-text-muted">·</span>
                    <span className="text-[10px] text-gf-text-muted">{deck.views} views</span>
                  </div>
                </div>

                {/* Colors */}
                <div className="flex items-center gap-1.5">
                  {deck.colors.map((c) => (
                    <span key={c} className={`h-3.5 w-3.5 rounded-full ${COLOR_DOT[c] || 'bg-gray-400'}`} />
                  ))}
                </div>

                {/* Arrow */}
                <svg className="h-4 w-4 text-gf-text-muted group-hover:text-gf-blue transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
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
