'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { ChevronDown } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import type { DeckIntent, CardDefinition } from '@gundam-forge/shared';
import { sortCardsBySynergy, filterCardsByIntent } from '@gundam-forge/shared';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { cn } from '@/lib/utils/cn';

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const CARD_COLORS = ['All', 'Red', 'Blue', 'Green', 'White', 'Purple', 'Colorless'];
const SETS_LIST = ['All', ...allSets.filter((s) => s !== 'Token')];

// EX tokens are generated at game time and are never in the catalog,
// but exclude any stray token-set cards from deck search.
const EXCLUDED_SETS = new Set(['Token']);

// Number of cards shown per swiper slide (2 columns × 2 rows)
const SLIDE_SIZE = 4;

export interface CardSearchPanelProps {
  onSelect: (id: string) => void;
  /** Deck intent containing colors, series, packages, and EX preference */
  deckIntent?: DeckIntent;
  /** Set to pre-filter by (from deck creation). */
  initialSetId?: string;
}

export function CardSearchPanel({ onSelect, deckIntent, initialSetId }: CardSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [setFilter, setSetFilter] = useState(() => {
    // Pre-apply set filter from deck creation if provided
    if (initialSetId && SETS_LIST.includes(initialSetId)) return initialSetId;
    return 'All';
  });

  // Modal state for card preview
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const previewCard = previewCardId ? (allCards.find((c) => c.id === previewCardId) ?? null) : null;

  // Collapsible filter sections state
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Initialize filters from deckIntent
  const deckColors = deckIntent?.colors ?? [];
  const deckClans = deckIntent?.clans ?? [];
  const mechanicsPackages = deckIntent?.packages ?? [];
  const intentIncludeEX = deckIntent?.includeEX ?? false;

  // When true, restrict to deckColors (+ Colorless) only.
  const [deckColorOnly, setDeckColorOnly] = useState(() => deckColors.length > 0);
  // When true, include EX cards in results.
  const [includeEX, setIncludeEX] = useState(intentIncludeEX);

  // Auto-enable the deck-color filter the first time the deck's colors become known.
  // This handles the async localStorage load on mount (deckColors starts [] then updates).
  const prevDeckColorsLenRef = React.useRef(deckColors.length);
  React.useEffect(() => {
    if (prevDeckColorsLenRef.current === 0 && deckColors.length > 0) {
      setDeckColorOnly(true);
    }
    prevDeckColorsLenRef.current = deckColors.length;
  }, [deckColors]);

  // Also update includeEX if deckIntent changes
  React.useEffect(() => {
    if (deckIntent?.includeEX !== undefined) {
      setIncludeEX(deckIntent.includeEX);
    }
  }, [deckIntent?.includeEX]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    // Step 1: Filter by deck intent (colors, clans, zones) using enriched metadata
    let eligible = filterCardsByIntent(
      allCards,
      deckColors.length > 0 && deckColorOnly ? deckColors : undefined, // Only filter by colors if deckColorOnly is enabled
      deckClans.length > 0 ? deckClans : undefined,
      includeEX,
      true // onlyMainDeck = true (exclude EX/Resource cards by default unless includeEX is true)
    );

    // Step 2: Apply local filters (type, color, set)
    eligible = eligible.filter((card) => {
      if (EXCLUDED_SETS.has(card.set)) return false;
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (colorFilter !== 'All' && card.color !== colorFilter) return false;
      if (setFilter !== 'All' && card.set !== setFilter) return false;
      return true;
    });

    // Step 3: Apply search query filter
    if (q) {
      eligible = eligible.filter((card) => {
        const haystack = `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Step 4: Sort by synergy (if packages are selected)
    if (mechanicsPackages.length > 0) {
      const sorted = sortCardsBySynergy(
        eligible,
        mechanicsPackages,
        deckClans,
        deckColors,
        includeEX
      );
      return sorted;
    }

    // No packages selected: return cards unsorted with no synergy data
    return eligible;
  }, [query, typeFilter, colorFilter, setFilter, deckColorOnly, deckColors, includeEX, deckClans, mechanicsPackages]);

  // Group filtered results into slides of SLIDE_SIZE cards each
  const slides = useMemo(() => {
    const result: (typeof filtered)[] = [];
    for (let i = 0; i < filtered.length; i += SLIDE_SIZE) {
      result.push(filtered.slice(i, i + SLIDE_SIZE));
    }
    return result;
  }, [filtered]);

  // Build a key from all active filters — forces Swiper to remount and reset to slide 0
  // whenever any filter changes.
  const filterKey = `${query}|${typeFilter}|${colorFilter}|${setFilter}|${deckColorOnly}|${includeEX}`;

  return (
    <aside
      className="w-full max-w-full flex-shrink-0 overflow-y-auto border-r border-border bg-surface-elevated"
      style={{ minWidth: 0, height: '100%' }}
      aria-label="Card search panel"
    >
      {/* Search + filters */}
      <div className="space-y-2 border-b border-border p-3" style={{ maxWidth: '100%' }}>
        <label className="sr-only" htmlFor="card-search-input">Search cards</label>
        <input
          id="card-search-input"
          className="w-full rounded border border-border bg-surface p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder="Search cards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cards by name, ID, or text"
        />

        {/* Active Filters Summary */}
        {(query || typeFilter !== 'All' || colorFilter !== 'All' || setFilter !== 'All' || deckColorOnly || includeEX) && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300">Active Filters</span>
              <button
                type="button"
                className="text-xs text-steel-500 hover:text-purple-300 transition-colors"
                onClick={() => {
                  setQuery('');
                  setTypeFilter('All');
                  setColorFilter('All');
                  setSetFilter(initialSetId && SETS_LIST.includes(initialSetId) ? initialSetId : 'All');
                  setDeckColorOnly(false);
                  setIncludeEX(intentIncludeEX);
                }}
                title="Reset all filters"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {query && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Search: &quot;{query.slice(0, 15)}{query.length > 15 ? '…' : ''}&quot;
                  <button
                    type="button"
                    className="hover:text-cobalt-100 transition-colors"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </span>
              )}
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Type: {typeFilter}
                  <button
                    type="button"
                    className="hover:text-purple-100 transition-colors"
                    onClick={() => setTypeFilter('All')}
                    aria-label="Clear type filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {colorFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Color: {colorFilter}
                  <button
                    type="button"
                    className="hover:text-purple-100 transition-colors"
                    onClick={() => setColorFilter('All')}
                    aria-label="Clear color filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {setFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Set: {setFilter}
                  <button
                    type="button"
                    className="hover:text-purple-100 transition-colors"
                    onClick={() => setSetFilter('All')}
                    aria-label="Clear set filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {deckColorOnly && deckColors.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Deck colors only
                  <button
                    type="button"
                    className="hover:text-cobalt-100 transition-colors"
                    onClick={() => setDeckColorOnly(false)}
                    aria-label="Disable deck colors filter"
                  >
                    ×
                  </button>
                </span>
              )}
              {includeEX && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                  EX cards shown
                  <button
                    type="button"
                    className="hover:text-amber-100 transition-colors"
                    onClick={() => setIncludeEX(false)}
                    aria-label="Exclude EX cards"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Intent Summary with Clans/Colors */}
        {(deckColors.length > 0 || deckClans.length > 0) && (
          <div className="rounded-lg border border-steel-700/50 bg-steel-900/20 p-2 space-y-1.5">
            <div className="text-xs font-semibold text-steel-400 uppercase tracking-wider">Deck Intent</div>
            <div className="flex flex-wrap gap-1.5">
              {deckClans.map((clan) => (
                <span
                  key={clan}
                  className="inline-flex items-center rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30"
                >
                  {clan}
                </span>
              ))}
              {deckColors.map((color) => (
                <span
                  key={color}
                  className="inline-flex items-center rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Deck-color quick filter (only shown when deck has colors set) */}
        {deckColors.length > 0 && (
          <button
            type="button"
            className={`w-full rounded border px-2 py-1 text-xs font-semibold transition-colors ${
              deckColorOnly
                ? 'border-cobalt-600 bg-cobalt-600 text-white'
                : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
            }`}
            onClick={() => setDeckColorOnly((v) => !v)}
            aria-pressed={deckColorOnly}
            title="Restrict results to your deck's colors"
          >
            {deckColorOnly ? '✓ Deck colors only' : 'Show deck colors only'}
          </button>
        )}

        {/* Include EX toggle */}
        <button
          type="button"
          className={`w-full rounded border px-2 py-1 text-xs font-semibold transition-colors ${
            includeEX
              ? 'border-amber-600 bg-amber-600/20 text-amber-300'
              : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
          }`}
          onClick={() => setIncludeEX((v) => !v)}
          aria-pressed={includeEX}
          title="Include EX Base and EX Resource cards in search results"
        >
          {includeEX ? '✓ EX cards shown' : 'Include EX cards'}
        </button>

        {/* Advanced Filters Collapsible Section */}
        <div className="rounded-lg border border-border bg-surface-interactive/30">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-interactive/50 transition-colors"
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            <span className="text-xs font-semibold text-steel-400">Advanced Filters</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-steel-500 transition-transform duration-200',
                filtersExpanded ? 'rotate-180' : '',
              )}
            />
          </button>

          {filtersExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              {/* Type filter */}
              <div>
                <span className="mb-1 block text-xs text-steel-500" id="type-filter-label">Type</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="type-filter-label">
                  {CARD_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                        typeFilter === t
                          ? 'border-cobalt-600 bg-cobalt-600 text-white'
                          : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
                      }`}
                      onClick={() => setTypeFilter(t)}
                      aria-pressed={typeFilter === t}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color filter */}
              <div>
                <span className="mb-1 block text-xs text-steel-500" id="color-filter-label">Color</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="color-filter-label">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                        colorFilter === c
                          ? 'border-cobalt-600 bg-cobalt-600 text-white'
                          : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
                      }`}
                      onClick={() => setColorFilter(c)}
                      aria-pressed={colorFilter === c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set filter */}
              <div>
                <label className="mb-1 block text-xs text-steel-500" htmlFor="set-filter-select">Set</label>
                <select
                  id="set-filter-select"
                  className="w-full rounded border border-border bg-surface p-1 text-xs outline-none focus-visible:border-ring"
                  value={setFilter}
                  onChange={(e) => setSetFilter(e.target.value)}
                >
                  {SETS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-steel-500" aria-live="polite">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Card grid swiper */}
      <div className="min-h-[400px] overflow-hidden" style={{ minWidth: 0 }} aria-label="Card results">
        {slides.length === 0 ? (
          <p className="p-4 text-center text-xs text-steel-600">
            No cards match your filters.
          </p>
        ) : (
          <Swiper
            key={filterKey}
            modules={[Pagination]}
            pagination={{ type: 'progressbar' }}
            className="h-full w-full"
            style={{ maxWidth: '100%', overflowX: 'hidden' }}
          >
            {slides.map((slideCards, slideIdx) => (
              <SwiperSlide key={slideIdx}>
                <div className="grid grid-cols-2 gap-1.5 p-1.5" style={{ maxWidth: '100%' }}>
                  {slideCards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        className="group relative aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-black transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
                        onClick={() => setPreviewCardId(card.id)}
                        onDoubleClick={() => {
                          // Double-click to quick-add without modal
                          setPreviewCardId(null);
                          onSelect(card.id);
                        }}
                        aria-label={`Preview ${card.name} (click to preview, double-click to add)`}
                        title="Click to preview • Double-click to add"
                      >
                        <img
                          src={getCardImage(card)}
                          alt={card.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-125"
                          loading="lazy"
                        />
                        
                        {/* Hover magnification overlay */}
                        <div className="pointer-events-none absolute inset-0 hidden bg-black/40 opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100" />
                        
                        {/* Hover hint */}
                        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 transform rounded bg-black/70 px-2 py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          Click to Preview
                        </div>
                      </button>
                    ))}
                  </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>

      {/* Card Detail Modal - for previewing before adding */}
      <CardDetailModal
        card={previewCard}
        open={previewCardId !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewCardId(null);
        }}
        context="deckbuilder"
        allCards={filtered}
        onSelectCard={(cardId) => setPreviewCardId(cardId)}
        onAdd={() => {
          if (previewCard) {
            onSelect(previewCard.id);
            setPreviewCardId(null);
          }
        }}
      />
    </aside>
  );
}
