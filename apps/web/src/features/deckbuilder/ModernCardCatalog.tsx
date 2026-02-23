import { useDeferredValue, useMemo, useState, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { useBrokenImageStore } from '../../utils/brokenImageStore';
import { filterCatalogCards, useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';

interface ModernCardCatalogProps {
  cards: CardDefinition[];
  onInspect?: (cardId: string) => void;
}

const colorOptions: { color: CardColor; bg: string; label: string }[] = [
  { color: 'Red', bg: 'bg-card-red', label: 'Red' },
  { color: 'Blue', bg: 'bg-card-blue', label: 'Blue' },
  { color: 'Green', bg: 'bg-card-green', label: 'Green' },
  { color: 'White', bg: 'bg-yellow-400', label: 'Yellow' },
  { color: 'Purple', bg: 'bg-purple-500', label: 'Purple' },
];

const typeOptions: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const costOptions = [1, 2, 3, 4, 5];

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

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const deferredQuery = useDeferredValue(query);
  const filteredCards = useMemo(() => {
    return filterCatalogCards(cards, deferredQuery, filters)
      .filter((card) => !brokenIds[card.id]);
  }, [cards, deferredQuery, filters, brokenIds]);

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
    count: viewMode === 'grid' ? gridRows.length : filteredCards.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => viewMode === 'grid' ? 200 : 48,
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
          <h2 className="font-heading text-sm font-bold text-gf-text tracking-wide uppercase">Card Catalog</h2>
        </div>
        <span className="text-[10px] text-gf-text-muted font-medium">
          {filteredCards.length} cards
        </span>
      </div>

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
            placeholder="Search cards..."
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

        {/* Cost Chips */}
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Cost</p>
          <div className="flex gap-1">
            {costOptions.map((cost) => (
              <button
                key={cost}
                onClick={() => setFilter('cost', filters.cost === cost ? 'All' : cost)}
                className={`flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-bold transition-all ${
                  filters.cost === cost
                    ? 'border-gf-blue bg-gf-blue text-white'
                    : 'border-gf-border bg-white text-gf-text hover:border-gf-blue'
                }`}
              >
                {cost}
              </button>
            ))}
            <button
              onClick={() => setFilter('cost', filters.cost === 6 ? 'All' : 6)}
              className={`flex h-7 items-center justify-center rounded-md border px-2 text-[11px] font-bold transition-all ${
                filters.cost === 6
                  ? 'border-gf-blue bg-gf-blue text-white'
                  : 'border-gf-border bg-white text-gf-text hover:border-gf-blue'
              }`}
            >
              6+
            </button>
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

      {/* View Toggle */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-2">
        <span className="text-[10px] text-gf-text-muted font-medium">
          {viewMode === 'grid' ? 'Grid' : 'List'} View
        </span>
        <div className="flex rounded-md border border-gf-border overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2 py-1 text-[10px] font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-gf-blue text-white' : 'bg-white text-gf-text-secondary hover:bg-gray-50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-1 text-[10px] font-medium transition-colors border-l border-gf-border ${
              viewMode === 'list' ? 'bg-gf-blue text-white' : 'bg-white text-gf-text-secondary hover:bg-gray-50'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Virtualized Card Grid/List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-gf-text-secondary">No cards found</p>
          </div>
        ) : viewMode === 'grid' ? (
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
        ) : (
          <div
            className="relative"
            style={{ height: virtualizer.getTotalSize(), width: '100%' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const card = filteredCards[virtualRow.index];
              const qty = qtyByCardId.get(card.id) ?? 0;
              const isSelected = selectedCardId === card.id;
              const imageSrc = resolveCardImage(card);

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 right-0 px-3"
                  style={{
                    top: virtualRow.start,
                    height: virtualRow.size,
                  }}
                >
                  <div
                    onClick={() => setSelectedCardId(card.id)}
                    onDoubleClick={() => onInspect?.(card.id)}
                    className={`flex items-center gap-3 rounded-lg border p-2 cursor-pointer gf-transition ${
                      isSelected
                        ? 'border-gf-blue bg-gf-blue-light'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt={card.name}
                      className="h-10 w-7 rounded object-cover flex-shrink-0"
                      loading="lazy"
                      onError={() => markBroken(card.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-medium text-gf-text">{card.name}</p>
                      <p className="text-[10px] text-gf-text-secondary">{card.type} · Cost {card.cost}</p>
                    </div>
                    {qty > 0 && (
                      <span className="text-[10px] font-bold text-gf-blue">{qty}x</span>
                    )}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white flex-shrink-0">
                      {card.cost}
                    </div>
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
   Card Tile — isolated for memoization
   -------------------------------------------------------- */
interface CardTileProps {
  card: CardDefinition;
  qty: number;
  isSelected: boolean;
  onSelect: () => void;
  onQuickAdd: (e: React.MouseEvent, cardId: string) => void;
  onInspect?: (cardId: string) => void;
  onBroken: (cardId: string) => void;
}

function CardTile({ card, qty, isSelected, onSelect, onQuickAdd, onInspect, onBroken }: CardTileProps) {
  const imageSrc = resolveCardImage(card);

  const rarityStars = getRarityStars(card);

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
            onLoad={(e) => {
              (e.target as HTMLImageElement).classList.add('fade-in');
            }}
          />
          {/* Cost Badge */}
          <div className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white shadow-sm">
            {card.cost}
          </div>
          {/* Qty Badge */}
          {qty > 0 && (
            <div className="absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gf-dark/80 px-1 text-[9px] font-bold text-white">
              {qty}x
            </div>
          )}
        </div>
        {/* Quick add button */}
        <button
          className="gf-quick-add"
          onClick={(e) => onQuickAdd(e, card.id)}
          aria-label={`Add ${card.name} to deck`}
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-gf-text leading-tight">{card.name}</p>
      {/* Rarity stars */}
      {rarityStars > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {Array.from({ length: rarityStars }).map((_, i) => (
            <svg key={i} className="h-2.5 w-2.5 text-gf-orange" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
}

function getRarityStars(card: CardDefinition): number {
  const rarity = (card as any).rarity as string | undefined;
  if (!rarity) return 1;
  switch (rarity) {
    case 'Common': return 1;
    case 'Uncommon': return 2;
    case 'Rare': return 3;
    case 'Special Rare':
    case 'Super Rare': return 4;
    case 'Promo': return 4;
    default: return 1;
  }
}
