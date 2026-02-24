import { useDeferredValue, useMemo, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { filterCatalogCards, useCardsStore } from '../deckbuilder/cardsStore';
import { useDeckStore } from '../deckbuilder/deckStore';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { useUIStore } from '../../stores/uiStore';
import { resolveCardImage } from '../../utils/resolveCardImage';

interface CardDatabasePageProps {
  cards: CardDefinition[];
}

const colorOptions: { color: CardColor; bg: string; label: string }[] = [
  { color: 'Red', bg: 'bg-card-red', label: 'Red' },
  { color: 'Blue', bg: 'bg-card-blue', label: 'Blue' },
  { color: 'Green', bg: 'bg-card-green', label: 'Green' },
  { color: 'White', bg: 'bg-yellow-400', label: 'Yellow' },
  { color: 'Purple', bg: 'bg-purple-500', label: 'Purple' },
];

const typeOptions: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

// Column count mirrors the Tailwind grid breakpoints
function useColumnCount() {
  const [cols, setCols] = useState(2);
  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const update = () => {
      const w = node.clientWidth;
      if (w >= 1280) setCols(6);       // xl
      else if (w >= 1024) setCols(5);   // lg
      else if (w >= 768) setCols(4);    // md
      else if (w >= 640) setCols(3);    // sm
      else setCols(2);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);
  return { cols, ref };
}

export function CardDatabasePage({ cards }: CardDatabasePageProps) {
  const query = useCardsStore((s) => s.query);
  const filters = useCardsStore((s) => s.filters);
  const setQuery = useCardsStore((s) => s.setQuery);
  const setFilter = useCardsStore((s) => s.setFilter);
  const clearFilters = useCardsStore((s) => s.clearFilters);

  const brokenIds = useBrokenImageStore((s) => s.brokenIds);
  const markBroken = useBrokenImageStore((s) => s.markBroken);
  const addCard = useDeckStore((s) => s.addCard);
  const removeCard = useDeckStore((s) => s.removeCard);
  const deckEntries = useDeckStore((s) => s.entries);
  const openInspection = useUIStore((s) => s.openInspection);

  const deferredQuery = useDeferredValue(query);

  const filteredCards = useMemo(() => {
    return filterCatalogCards(cards, deferredQuery, filters)
      .filter((card) => !brokenIds[card.id]);
  }, [cards, deferredQuery, filters, brokenIds]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((c) => c.set))], [cards]);
  const qtyByCardId = useMemo(
    () => new Map(deckEntries.map((e) => [e.cardId, e.qty] as const)),
    [deckEntries],
  );

  const hasActiveFilters = query || filters.color !== 'All' || filters.type !== 'All' || filters.set !== 'All';

  const { cols, ref: gridContainerRef } = useColumnCount();

  // Group cards into rows based on column count
  const gridRows = useMemo(() => {
    const rows: CardDefinition[][] = [];
    for (let i = 0; i < filteredCards.length; i += cols) {
      rows.push(filteredCards.slice(i, i + cols));
    }
    return rows;
  }, [filteredCards, cols]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 260,
    overscan: 5,
  });

  return (
    <div
      ref={scrollRef}
      className="h-[calc(100vh-var(--gf-header-height))] overflow-y-auto bg-gf-light"
    >
      {/* Header + Filters */}
      <div className="border-b border-gf-border bg-gf-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gf-text">Card Database</h1>
            </div>
            <span className="text-xs text-gf-text-muted font-medium tabular-nums">
              {filteredCards.length} of {cards.length} cards
            </span>
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
                  placeholder="Search by name or ID..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
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
                    onClick={() => setFilter('color', filters.color === opt.color ? 'All' : opt.color)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${opt.bg} ${
                      filters.color === opt.color
                        ? 'ring-2 ring-gf-blue ring-offset-1 scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Type</label>
              <div className="flex flex-wrap gap-1">
                {typeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter('type', filters.type === type ? 'All' : type)}
                    className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      filters.type === type
                        ? 'border-gf-blue bg-gf-blue text-white'
                        : 'border-gf-border bg-gf-white text-gf-text-secondary hover:border-gf-blue hover:text-gf-blue'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Set */}
            <div className="min-w-[140px]">
              <label className="text-[10px] font-medium text-gf-text-muted uppercase tracking-wide mb-1 block">Set</label>
              <select
                value={(filters.set as string) || 'All'}
                onChange={(e) => setFilter('set', e.target.value)}
                className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
              >
                {setOptions.map((set) => (
                  <option key={set} value={set}>{set === 'All' ? 'All Sets' : set}</option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-md border border-gf-border bg-gf-white px-3 py-1.5 text-[11px] font-medium text-gf-text-muted hover:text-gf-text hover:border-gf-blue transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Virtualized Card Grid */}
      <div ref={gridContainerRef} className="mx-auto max-w-7xl px-6 py-6">
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="mb-3 h-12 w-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-gf-text">No cards found</p>
            <p className="text-xs text-gf-text-muted mt-1">Try adjusting your filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs font-medium text-gf-blue hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowCards = gridRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 right-0"
                  style={{
                    top: virtualRow.start,
                    height: virtualRow.size,
                  }}
                >
                  <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {rowCards.map((card) => {
                      const imageSrc = resolveCardImage(card);
                      const qty = qtyByCardId.get(card.id) ?? 0;
                      return (
                        <div
                          key={card.id}
                          className="cursor-pointer group"
                          onClick={() => openInspection(card.id)}
                        >
                          <div className="gf-card-tile bg-gf-white">
                            <div className="relative w-full" style={{ aspectRatio: '5/7' }}>
                              <img
                                src={imageSrc}
                                alt={card.name}
                                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
                                loading="lazy"
                                decoding="async"
                                onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                                onError={() => markBroken(card.id)}
                              />

                              {/* Type badge */}
                              <span className="gf-card-type-badge" data-type={card.type}>
                                {card.type}
                              </span>

                              {/* Qty + Cost badges */}
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-[3]">
                                {qty > 0 && (
                                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-gf-dark/80 px-1 text-[9px] font-bold text-white">
                                    {qty}x
                                  </span>
                                )}
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gf-gray-800/80 text-[9px] font-bold text-white">
                                  {card.cost}
                                </span>
                              </div>

                              {/* Floating action rail */}
                              <div className="gf-action-rail">
                                <button
                                  className="gf-action-rail-btn gf-rail-add"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addCard(card.id);
                                  }}
                                  aria-label={`Add ${card.name} to deck`}
                                >
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                </button>
                                {qty > 0 && (
                                  <button
                                    className="gf-action-rail-btn gf-rail-remove"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeCard(card.id);
                                    }}
                                    aria-label={`Remove ${card.name} from deck`}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  className="gf-action-rail-btn gf-rail-inspect"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openInspection(card.id);
                                  }}
                                  aria-label={`Inspect ${card.name}`}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="mt-1.5 truncate text-xs font-medium text-gf-text">{card.name}</p>
                          <p className="truncate text-[9px] text-gf-text-muted">{card.color} · {card.set}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
