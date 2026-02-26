'use client';

import * as React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { searchCards, type CardSummary, type CardSearchParams } from '@/lib/api/cardSearch';
import { queryKeys } from '@/lib/query/keys';
import { withBasePath } from '@/lib/utils/basePath';
import type { CardSummaryForDeck } from './useDeckBuilder';

// ─── constants ───────────────────────────────────────────────────────────────

const COLORS = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'] as const;
const TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'] as const;
const LIMIT = 25;

const COLOR_SWATCH: Record<string, string> = {
  Blue: 'bg-blue-500',
  Green: 'bg-green-500',
  Red: 'bg-red-500',
  White: 'bg-slate-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-steel-500',
};

// ─── debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ─── main panel ──────────────────────────────────────────────────────────────

interface CardSearchPanelProps {
  /** Called when user clicks + on a result row */
  onAddCard: (card: CardSummaryForDeck) => void;
  /** Returns current deck qty for a given cardId */
  deckQty: (cardId: string) => number;
}

export function CardSearchPanel({ onAddCard, deckQty }: CardSearchPanelProps): JSX.Element {
  const [rawQuery, setRawQuery] = React.useState('');
  const [color, setColor] = React.useState<string>('All');
  const [type, setType] = React.useState<string>('All');
  const [cursor, setCursor] = React.useState(0);

  // Accumulated results across pages (cleared on filter change)
  const [accumulated, setAccumulated] = React.useState<CardSummary[]>([]);

  const query = useDebounce(rawQuery, 300);

  const hasFilter =
    query.trim().length > 0 || color !== 'All' || type !== 'All';

  // Reset pagination when filters change
  React.useEffect(() => {
    setAccumulated([]);
    setCursor(0);
  }, [query, color, type]);

  const searchParams: CardSearchParams = React.useMemo(
    () => ({
      q: query.trim() || undefined,
      color: color !== 'All' ? color : undefined,
      type: type !== 'All' ? type : undefined,
      cursor,
      limit: LIMIT,
    }),
    [query, color, type, cursor],
  );

  const { data, isFetching, isError } = useQuery({
    queryKey: queryKeys.cards.search(searchParams),
    queryFn: () => searchCards(searchParams),
    enabled: hasFilter,
    staleTime: 30_000,
  });

  // Append new page results; replace entirely on filter reset (cursor === 0)
  React.useEffect(() => {
    if (!data) return;
    if (cursor === 0) {
      setAccumulated(data.cards);
    } else {
      setAccumulated((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...data.cards.filter((c) => !seen.has(c.id))];
      });
    }
  }, [data, cursor]);

  const loadMore = () => {
    if (data?.hasMore && !isFetching) setCursor(data.cursor);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Inputs ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 space-y-2 border-b border-border p-3">
        {/* Search input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
          <input
            aria-label="Search cards by name or ID"
            className="h-8 w-full rounded-md border border-border bg-surface-interactive pl-8 pr-7 text-xs text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search by name, ID…"
            type="search"
            value={rawQuery}
          />
          {rawQuery && (
            <button
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-steel-500 hover:text-foreground"
              onClick={() => setRawQuery('')}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Filter chips row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterSelect
            label="Color"
            onChange={setColor}
            options={COLORS as readonly string[]}
            value={color}
          />
          <FilterSelect
            label="Type"
            onChange={setType}
            options={TYPES as readonly string[]}
            value={type}
          />
          {(color !== 'All' || type !== 'All') && (
            <button
              className="inline-flex items-center gap-0.5 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-steel-600 hover:border-foreground/30 hover:text-foreground"
              onClick={() => { setColor('All'); setType('All'); }}
              type="button"
            >
              Clear
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Results ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!hasFilter ? (
          <EmptyPrompt />
        ) : isFetching && accumulated.length === 0 ? (
          <SkeletonList />
        ) : isError ? (
          <p className="p-6 text-center text-xs text-red-400">Search failed — check your connection.</p>
        ) : accumulated.length === 0 ? (
          <p className="p-6 text-center text-xs text-steel-600">No cards matched your search.</p>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
              <span className="text-[10px] text-steel-600">
                <span className="font-semibold text-foreground">{data?.total ?? accumulated.length}</span>
                {' '}result{(data?.total ?? accumulated.length) !== 1 ? 's' : ''}
              </span>
              {isFetching && (
                <span className="text-[10px] text-steel-500 animate-pulse">Loading…</span>
              )}
            </div>

            {/*
              CSS-based virtualization: content-visibility skips paint/layout
              for offscreen list items, making long lists smooth without a JS
              virtualization library. Works natively in modern browsers.
            */}
            <ul className="divide-y divide-border" role="list">
              {accumulated.map((card) => (
                <SearchResultRow
                  card={card}
                  key={card.id}
                  onAdd={() =>
                    onAddCard({
                      id: card.id,
                      name: card.name,
                      cost: card.cost,
                      type: card.type,
                      color: card.color,
                      set: card.set,
                      imageUrl: card.imageUrl,
                    })
                  }
                  qty={deckQty(card.id)}
                />
              ))}
            </ul>

            {data?.hasMore && (
              <div className="p-3">
                <button
                  className="w-full rounded-md border border-border bg-surface-interactive py-1.5 text-xs font-semibold text-steel-600 transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isFetching}
                  onClick={loadMore}
                  type="button"
                >
                  {isFetching
                    ? 'Loading…'
                    : `Load more  (${data.total - accumulated.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function EmptyPrompt(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <Search className="h-7 w-7 text-steel-600 opacity-40" />
      <div>
        <p className="text-xs font-semibold text-foreground">Search the card pool</p>
        <p className="mt-0.5 text-[11px] text-steel-600">Type a name or apply a filter to find cards</p>
      </div>
    </div>
  );
}

function SkeletonList(): JSX.Element {
  return (
    <div className="space-y-px p-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div className="h-9 animate-pulse rounded-sm bg-surface-interactive" key={i} />
      ))}
    </div>
  );
}

interface SearchResultRowProps {
  card: CardSummary;
  qty: number;
  onAdd: () => void;
}

function SearchResultRow({ card, qty, onAdd }: SearchResultRowProps): JSX.Element {
  const atMax = qty >= 4;
  const imageUrl = card.imageUrl
    ? card.imageUrl.startsWith('/') ? withBasePath(card.imageUrl) : card.imageUrl
    : null;

  return (
    <li
      className="group flex items-center gap-2 px-3 py-1.5 hover:bg-surface-interactive"
      // CSS containment + content-visibility for off-screen rows
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 44px' } as React.CSSProperties}
    >
      {/* Thumbnail — lazy loaded */}
      {imageUrl ? (
        <img
          alt=""
          className="h-8 w-[22px] flex-shrink-0 rounded-sm object-cover object-top"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <div
          className={cn(
            'h-8 w-[22px] flex-shrink-0 rounded-sm',
            COLOR_SWATCH[card.color] ?? 'bg-steel-600',
          )}
        />
      )}

      {/* Card info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold leading-tight text-foreground">{card.name}</p>
        <p className="text-[10px] leading-tight text-steel-600">
          {card.type} · Cost {card.cost}
        </p>
      </div>

      {/* Deck qty badge */}
      {qty > 0 && (
        <span className="flex-shrink-0 rounded-sm bg-cobalt-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none text-cobalt-300">
          {qty}
        </span>
      )}

      {/* Add button */}
      <button
        aria-label={`Add ${card.name} to deck`}
        className={cn(
          'flex-shrink-0 rounded-sm border px-2 py-0.5 text-[11px] font-bold leading-none transition-all',
          atMax
            ? 'cursor-not-allowed border-steel-600/30 text-steel-700 opacity-40'
            : 'border-cobalt-500/40 text-cobalt-300 hover:border-cobalt-400 hover:bg-cobalt-500/20',
        )}
        disabled={atMax}
        onClick={onAdd}
        title={atMax ? 'Max 4 copies per card' : `Add ${card.name}`}
        type="button"
      >
        +
      </button>
    </li>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

interface FilterSelectProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}

function FilterSelect({ label, options, value, onChange }: FilterSelectProps): JSX.Element {
  const active = value !== 'All' && value !== '';
  return (
    <div className="relative">
      <select
        aria-label={label}
        className={cn(
          'h-7 cursor-pointer appearance-none rounded-sm border pl-2 pr-6 text-[11px] font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/20',
          active
            ? 'border-cobalt-500/50 bg-cobalt-500/10 text-cobalt-300'
            : 'border-border bg-surface-interactive text-steel-600 hover:border-foreground/20',
        )}
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? `${label}: All` : opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-steel-500" />
    </div>
  );
}
