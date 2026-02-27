'use client';

import React, { useState, useMemo } from 'react';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const CARD_COLORS = ['All', 'Red', 'Blue', 'Green', 'White', 'Purple', 'Colorless'];
const SETS_LIST = ['All', ...allSets];

// EX tokens are generated at game time and are never in the catalog,
// but exclude any stray token-set cards from deck search.
const EXCLUDED_SETS = new Set(['Token']);

// EX Base (EXB-xxx, EXBP-xxx) and EX Resource (EXR-xxx) cards are placed in
// separate game zones — they must NOT appear in the main deck card search.
function isExCard(card: { id: string }): boolean {
  return card.id.startsWith('EXB') || card.id.startsWith('EXR');
}

const PAGE_SIZE = 40;

export interface CardSearchPanelProps {
  onSelect: (id: string) => void;
  /** Colors chosen for this deck — shown as a quick-filter toggle. */
  deckColors?: string[];
}

export function CardSearchPanel({ onSelect, deckColors = [] }: CardSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [setFilter, setSetFilter] = useState('All');
  const [page, setPage] = useState(0);
  // When true, restrict to deckColors (+ Colorless) only.
  const [deckColorOnly, setDeckColorOnly] = useState(false);

  // Auto-enable the deck-color filter the first time the deck's colors become known.
  // This handles the async localStorage load on mount (deckColors starts [] then updates).
  const prevDeckColorsLenRef = React.useRef(deckColors.length);
  React.useEffect(() => {
    if (prevDeckColorsLenRef.current === 0 && deckColors.length > 0) {
      setDeckColorOnly(true);
    }
    prevDeckColorsLenRef.current = deckColors.length;
  }, [deckColors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCards.filter((card) => {
      if (EXCLUDED_SETS.has(card.set)) return false;
      if (isExCard(card)) return false;
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (colorFilter !== 'All' && card.color !== colorFilter) return false;
      if (setFilter !== 'All' && card.set !== setFilter) return false;
      // Deck-color quick-filter: show only cards that fit the chosen deck colors.
      if (deckColorOnly && deckColors.length > 0) {
        const allowed = new Set([...deckColors, 'Colorless']);
        if (!allowed.has(card.color)) return false;
      }
      if (q) {
        const haystack = `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, typeFilter, colorFilter, setFilter, deckColorOnly, deckColors]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [query, typeFilter, colorFilter, setFilter, deckColorOnly]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <aside
      className="flex h-full w-72 flex-shrink-0 flex-col overflow-hidden border-r border-border bg-surface-elevated"
      aria-label="Card search panel"
    >
      {/* Search + filters */}
      <div className="flex-shrink-0 space-y-2 border-b border-border p-3">
        <label className="sr-only" htmlFor="card-search-input">Search cards</label>
        <input
          id="card-search-input"
          className="w-full rounded border border-border bg-surface p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder="Search cards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cards by name, ID, or text"
        />

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

        <p className="text-xs text-steel-500" aria-live="polite">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto" role="list" aria-label="Card results">
        {visible.length === 0 ? (
          <p className="p-4 text-center text-xs text-steel-600">
            No cards match your filters.
          </p>
        ) : (
          visible.map((card) => (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className="flex w-full cursor-pointer items-center gap-2 border-b border-border/50 p-2 text-left transition-colors hover:bg-surface-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt-500"
              onClick={() => onSelect(card.id)}
              aria-label={`Add ${card.name} (${card.type}, ${card.color}, cost ${card.cost ?? '–'}) to deck`}
            >
              <img
                src={getCardImage(card)}
                alt=""
                aria-hidden="true"
                className="h-10 w-8 flex-shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{card.name}</div>
                <div className="text-xs text-steel-500">
                  {card.type} · {card.color} · Cost {card.cost ?? '–'}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-shrink-0 items-center justify-between border-t border-border px-3 py-2">
          <button
            type="button"
            className="text-xs text-cobalt-400 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span className="text-xs text-steel-500" aria-live="polite">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="text-xs text-cobalt-400 disabled:opacity-40"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}
    </aside>
  );
}
