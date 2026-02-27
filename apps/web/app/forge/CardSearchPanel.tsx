'use client';

import React, { useState, useMemo } from 'react';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const CARD_COLORS = ['All', 'Red', 'Blue', 'Green', 'Yellow', 'Colorless'];
const SETS_LIST = ['All', ...allSets];

// EX tokens are generated at game time and are never in the catalog,
// but exclude any stray token-set cards from deck search.
const EXCLUDED_SETS = new Set(['Token']);

const PAGE_SIZE = 40;

export function CardSearchPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [setFilter, setSetFilter] = useState('All');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCards.filter((card) => {
      if (EXCLUDED_SETS.has(card.set)) return false;
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (colorFilter !== 'All' && card.color !== colorFilter) return false;
      if (setFilter !== 'All' && card.set !== setFilter) return false;
      if (q) {
        const haystack = `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, typeFilter, colorFilter, setFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(0);
  }, [query, typeFilter, colorFilter, setFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col overflow-hidden border-r border-border bg-surface-elevated">
      {/* Search + filters */}
      <div className="flex-shrink-0 space-y-2 border-b border-border p-3">
        <input
          className="w-full rounded border border-border bg-surface p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder="Search cards…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {/* Type filter */}
        <div>
          <span className="mb-1 block text-xs text-steel-500">Type</span>
          <div className="flex flex-wrap gap-1">
            {CARD_TYPES.map((t) => (
              <button
                key={t}
                className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                  typeFilter === t
                    ? 'border-cobalt-600 bg-cobalt-600 text-white'
                    : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
                }`}
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Color filter */}
        <div>
          <span className="mb-1 block text-xs text-steel-500">Color</span>
          <div className="flex flex-wrap gap-1">
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                  colorFilter === c
                    ? 'border-cobalt-600 bg-cobalt-600 text-white'
                    : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
                }`}
                onClick={() => setColorFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Set filter */}
        <div>
          <span className="mb-1 block text-xs text-steel-500">Set</span>
          <select
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

        <p className="text-xs text-steel-500">
          {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="p-4 text-center text-xs text-steel-600">
            No cards match your filters.
          </p>
        ) : (
          visible.map((card) => (
            <button
              key={card.id}
              className="flex w-full cursor-pointer items-center gap-2 border-b border-border/50 p-2 text-left transition-colors hover:bg-surface-interactive"
              onClick={() => onSelect(card.id)}
            >
              <img
                src={getCardImage(card)}
                alt={card.name}
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
            className="text-xs text-cobalt-400 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="text-xs text-steel-500">
            {page + 1} / {totalPages}
          </span>
          <button
            className="text-xs text-cobalt-400 disabled:opacity-40"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </aside>
  );
}
