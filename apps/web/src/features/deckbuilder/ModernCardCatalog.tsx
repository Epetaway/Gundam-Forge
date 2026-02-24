import { useDeferredValue, useMemo, useState, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { filterCatalogCards, useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';
import { useAuthStore } from '../../stores/authStore';
import { useCollectionStore } from '../../stores/collectionStore';

interface ModernCardCatalogProps {
  cards: CardDefinition[];
  onInspect?: (cardId: string) => void;
}

type CatalogTab = 'catalog' | 'collection';

const colorOptions: { color: CardColor; bg: string; label: string }[] = [
  { color: 'Red', bg: 'bg-card-red', label: 'Red' },
  { color: 'Blue', bg: 'bg-card-blue', label: 'Blue' },
  { color: 'Green', bg: 'bg-card-green', label: 'Green' },
  { color: 'White', bg: 'bg-yellow-400', label: 'Yellow' },
  { color: 'Purple', bg: 'bg-purple-500', label: 'Purple' },
];

const typeOptions: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

export function ModernCardCatalog({ cards, onInspect }: ModernCardCatalogProps) {
  const query = useCardsStore((state) => state.query);
  const filters = useCardsStore((state) => state.filters);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const setQuery = useCardsStore((state) => state.setQuery);
  const setFilter = useCardsStore((state) => state.setFilter);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const addCard = useDeckStore((state) => state.addCard);
  const deckEntries = useDeckStore((state) => state.entries);
  const brokenIds = useBrokenImageStore((state) => state.brokenIds);
  const markBroken = useBrokenImageStore((state) => state.markBroken);

  const authUser = useAuthStore((state) => state.user);
  const collectionCardIds = useCollectionStore((state) => state.ownedCardIds);

  const [activeTab, setActiveTab] = useState<CatalogTab>('catalog');

  const deferredQuery = useDeferredValue(query);
  const filteredCards = useMemo(() => {
    let result = filterCatalogCards(cards, deferredQuery, filters)
      .filter((card) => !brokenIds[card.id]);

    // When viewing collection, only show owned cards
    if (activeTab === 'collection' && authUser) {
      result = result.filter((card) => collectionCardIds.has(card.id));
    }

    return result;
  }, [cards, deferredQuery, filters, brokenIds, activeTab, authUser, collectionCardIds]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.set))], [cards]);
  const qtyByCardId = useMemo(
    () => new Map(deckEntries.map((entry) => [entry.cardId, entry.qty] as const)),
    [deckEntries]
  );

  // Virtualized grid: 2 columns, rows of card pairs
  const gridRows = useMemo(() => {
    const rows: CardDefinition[][] = [];
    for (let i = 0; i < filteredCards.length; i += 2) {
      rows.push(filteredCards.slice(i, i + 2));
    }
    return rows;
  }, [filteredCards]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: gridRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const handleQuickAdd = useCallback((e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    addCard(cardId);
  }, [addCard]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
          <h2 className="font-heading text-sm font-bold text-gf-text tracking-wide uppercase">
            {activeTab === 'collection' ? 'My Collection' : 'Card Catalog'}
          </h2>
        </div>
        <span className="text-[10px] text-gf-text-muted font-medium">
          {filteredCards.length} cards
        </span>
      </div>

      {/* Collection / Catalog Toggle (logged-in users) */}
      {authUser && (
        <div className="flex border-b border-gf-border">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide text-center transition-colors ${
              activeTab === 'catalog'
                ? 'text-gf-blue border-b-2 border-gf-blue bg-gf-blue-light/30'
                : 'text-gf-text-muted hover:text-gf-text hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
              Catalog
            </span>
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide text-center transition-colors ${
              activeTab === 'collection'
                ? 'text-gf-blue border-b-2 border-gf-blue bg-gf-blue-light/30'
                : 'text-gf-text-muted hover:text-gf-text hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Collection
            </span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="border-b border-gf-border px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="w-full rounded-lg border border-gf-border bg-gf-light py-2 pl-9 pr-9 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:bg-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
            placeholder={activeTab === 'collection' ? 'Search collection...' : 'Search cards...'}
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

        {/* Color Filter Chips */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-gf-text-muted mr-1">Color</span>
          {colorOptions.map((opt) => (
            <button
              key={opt.color}
              onClick={() => setFilter('color', filters.color === opt.color ? 'All' : opt.color)}
              className={`flex h-6 w-6 items-center justify-center rounded transition-all ${opt.bg} ${
                filters.color === opt.color
                  ? 'ring-2 ring-gf-blue ring-offset-1 scale-110'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              title={opt.label}
            />
          ))}
        </div>

        {/* Type Chips */}
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Type</p>
          <div className="flex flex-wrap gap-1">
            {typeOptions.map((type) => (
              <button
                key={type}
                onClick={() => setFilter('type', filters.type === type ? 'All' : type)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all ${
                  filters.type === type
                    ? 'border-gf-blue bg-gf-blue text-white'
                    : 'border-gf-border bg-white text-gf-text-secondary hover:border-gf-blue hover:text-gf-blue'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Set Dropdown */}
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Set</p>
          <select
            value={(filters.set as string) || 'All'}
            onChange={(e) => setFilter('set', e.target.value)}
            className="w-full rounded-lg border border-gf-border bg-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
          >
            {setOptions.map((set) => (
              <option key={set} value={set}>{set === 'All' ? 'All Sets' : set}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Virtualized Card Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto gf-scroll">
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {activeTab === 'collection' && authUser ? (
              <>
                <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium text-gf-text">No cards in collection</p>
                <p className="text-xs text-gf-text-muted mt-1">
                  Switch to Catalog and add cards you own.
                </p>
              </>
            ) : (
              <>
                <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-gf-text-secondary">No cards found</p>
              </>
            )}
          </div>
        ) : (
          <div
            className="relative p-3"
            style={{ height: virtualizer.getTotalSize() + 24, width: '100%' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowCards = gridRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 right-0 px-3"
                  style={{
                    top: virtualRow.start + 12,
                    height: virtualRow.size,
                  }}
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    {rowCards.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        qty={qtyByCardId.get(card.id) ?? 0}
                        isSelected={selectedCardId === card.id}
                        isOwned={collectionCardIds.has(card.id)}
                        showOwned={activeTab === 'catalog' && !!authUser}
                        onSelect={() => setSelectedCardId(card.id)}
                        onQuickAdd={handleQuickAdd}
                        onInspect={onInspect}
                        onBroken={markBroken}
                      />
                    ))}
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

/* --------------------------------------------------------
   Card Tile — Moxfield-style with floating action rail
   -------------------------------------------------------- */
interface CardTileProps {
  card: CardDefinition;
  qty: number;
  isSelected: boolean;
  isOwned: boolean;
  showOwned: boolean;
  onSelect: () => void;
  onQuickAdd: (e: React.MouseEvent, cardId: string) => void;
  onInspect?: (cardId: string) => void;
  onBroken: (cardId: string) => void;
}

function CardTile({ card, qty, isSelected, isOwned, showOwned, onSelect, onQuickAdd, onInspect, onBroken }: CardTileProps) {
  const imageSrc = resolveCardImage(card);

  return (
    <div className="cursor-pointer group" onClick={onSelect} onDoubleClick={() => onInspect?.(card.id)}>
      <div
        className="gf-card-tile bg-white"
        data-selected={isSelected ? 'true' : undefined}
      >
        <div className="relative w-full pb-[140%] bg-gradient-to-b from-gray-100 to-gray-200">
          <img
            src={imageSrc}
            alt={card.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => onBroken(card.id)}
          />

          {/* Type badge (Moxfield-style) */}
          <span className="gf-card-type-badge" data-type={card.type}>
            {card.type}
          </span>

          {/* Qty + Cost badges (top right) */}
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

          {/* Owned indicator (small checkmark in catalog mode) */}
          {showOwned && isOwned && (
            <div className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/90 z-[3]">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Floating action rail (Moxfield-style: green +, red -, expand) */}
          <div className="gf-action-rail">
            <button
              className="gf-action-rail-btn gf-rail-add"
              onClick={(e) => onQuickAdd(e, card.id)}
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
                  const { removeCard } = useDeckStore.getState();
                  removeCard(card.id);
                }}
                aria-label={`Remove ${card.name} from deck`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {onInspect && (
              <button
                className="gf-action-rail-btn gf-rail-inspect"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect(card.id);
                }}
                aria-label={`Inspect ${card.name}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-gf-text leading-tight">{card.name}</p>
      <p className="truncate text-[9px] text-gf-text-muted">{card.color} · {card.set}</p>
    </div>
  );
}
