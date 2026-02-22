import { useDeferredValue, useMemo, useState } from 'react';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { filterCatalogCards, useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';

interface ModernCardCatalogProps {
  cards: CardDefinition[];
}

const colorOptions: { color: CardColor; bg: string; border: string; label: string }[] = [
  { color: 'Red', bg: 'bg-card-red', border: 'border-red-700', label: 'Red' },
  { color: 'Blue', bg: 'bg-card-blue', border: 'border-blue-700', label: 'Blue' },
  { color: 'Green', bg: 'bg-card-green', border: 'border-green-700', label: 'Green' },
  { color: 'White', bg: 'bg-yellow-400', border: 'border-yellow-500', label: 'Yellow' },
  { color: 'Black', bg: 'bg-card-black', border: 'border-gray-700', label: 'Black' },
];

const typeOptions: CardType[] = ['Unit', 'Pilot', 'Command', 'Base'];
const costOptions = [1, 2, 3, 4, 5];

export function ModernCardCatalog({ cards }: ModernCardCatalogProps) {
  const query = useCardsStore((state) => state.query);
  const filters = useCardsStore((state) => state.filters);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const setQuery = useCardsStore((state) => state.setQuery);
  const setFilter = useCardsStore((state) => state.setFilter);
  const clearFilters = useCardsStore((state) => state.clearFilters);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const addCard = useDeckStore((state) => state.addCard);
  const deckEntries = useDeckStore((state) => state.entries);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const deferredQuery = useDeferredValue(query);
  const filteredCards = useMemo(() => {
    return filterCatalogCards(cards, deferredQuery, filters);
  }, [cards, deferredQuery, filters]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.set))], [cards]);

  const qtyByCardId = new Map(deckEntries.map((entry) => [entry.cardId, entry.qty] as const));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
          <h2 className="font-heading text-base font-bold text-gf-text">Card Catalog</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gf-border px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="w-full rounded-lg border border-gf-border bg-white py-2 pl-9 pr-9 text-sm text-gf-text placeholder-gf-text-secondary outline-none focus:border-gf-blue focus:ring-1 focus:ring-gf-blue"
            placeholder="Search cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-gf-text-secondary hover:bg-gray-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.586a1 1 0 0 1-.293.707l-6.414 6.414a1 1 0 0 0-.293.707V17l-4 4v-6.586a1 1 0 0 0-.293-.707L3.293 7.293A1 1 0 0 1 3 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Color Filter - Dots */}
        <div className="flex items-center gap-2">
          {colorOptions.map((opt) => (
            <button
              key={opt.color}
              onClick={() => setFilter('color', filters.color === opt.color ? 'All' : opt.color)}
              className={`flex h-6 w-6 items-center justify-center rounded-sm transition-all ${opt.bg} ${
                filters.color === opt.color
                  ? 'ring-2 ring-gf-blue ring-offset-1 scale-110'
                  : 'opacity-80 hover:opacity-100'
              }`}
              title={opt.label}
            />
          ))}
        </div>

        {/* Type Filter - Pills */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-gf-text-secondary">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {typeOptions.map((type) => (
              <button
                key={type}
                onClick={() => setFilter('type', filters.type === type ? 'All' : type)}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                  filters.type === type
                    ? 'border-gf-blue bg-gf-blue text-white'
                    : 'border-gf-border bg-white text-gf-text hover:border-gf-blue hover:text-gf-blue'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Filter - Buttons */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-gf-text-secondary">Cost</p>
          <div className="flex gap-1.5">
            {costOptions.map((cost) => (
              <button
                key={cost}
                onClick={() => setFilter('cost', filters.cost === cost ? 'All' : cost)}
                className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-bold transition-all ${
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
              className={`flex h-8 items-center justify-center rounded-md border px-2 text-xs font-bold transition-all ${
                filters.cost === 6
                  ? 'border-gf-blue bg-gf-blue text-white'
                  : 'border-gf-border bg-white text-gf-text hover:border-gf-blue'
              }`}
            >
              5+
            </button>
          </div>
        </div>

        {/* Set Dropdown */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-gf-text-secondary">Set</p>
          <select
            value={(filters.set as string) || 'All'}
            onChange={(e) => setFilter('set', e.target.value)}
            className="w-full rounded-lg border border-gf-border bg-white px-3 py-1.5 text-sm text-gf-text outline-none focus:border-gf-blue"
          >
            {setOptions.map((set) => (
              <option key={set} value={set}>{set === 'All' ? 'All Sets' : set}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-2">
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-xs text-gf-text-secondary ml-1">{viewMode === 'grid' ? 'Grid' : 'List'}</span>
        </div>
        <div className="flex rounded-md border border-gf-border overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-gf-blue text-white' : 'bg-white text-gf-text-secondary hover:bg-gray-50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 text-xs font-medium transition-colors border-l border-gf-border ${
              viewMode === 'list' ? 'bg-gf-blue text-white' : 'bg-white text-gf-text-secondary hover:bg-gray-50'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Card Grid/List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredCards.map((card) => {
              const qty = qtyByCardId.get(card.id) ?? 0;
              const isSelected = selectedCardId === card.id;
              const imageSrc = card.imageUrl || card.placeholderArt;

              return (
                <div
                  key={card.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div className={`relative overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? 'border-gf-blue shadow-md ring-2 ring-gf-blue/30'
                      : 'border-gf-border hover:border-gf-blue hover:shadow-sm'
                  }`}>
                    <div className="relative w-full pb-[140%] bg-gray-100">
                      <img
                        src={imageSrc}
                        alt={card.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://via.placeholder.com/300x420/f5f5f5/333333?text=${encodeURIComponent(card.name)}`;
                        }}
                      />
                      {/* Cost Badge */}
                      <div className="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white shadow">
                        {card.cost}
                      </div>
                      {/* Qty Badge */}
                      {qty > 0 && (
                        <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white shadow">
                          x{qty}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 truncate text-[11px] font-medium text-gf-text leading-tight">{card.name}</p>
                  {qty > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(qty, 4) }).map((_, i) => (
                        <svg key={i} className="h-2.5 w-2.5 text-gf-orange" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCards.map((card) => {
              const qty = qtyByCardId.get(card.id) ?? 0;
              const isSelected = selectedCardId === card.id;
              const imageSrc = card.imageUrl || card.placeholderArt;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`flex items-center gap-3 rounded-lg border p-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-gf-blue bg-gf-blue-light'
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={imageSrc}
                    alt={card.name}
                    className="h-10 w-7 rounded object-cover"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gf-text">{card.name}</p>
                    <p className="text-xs text-gf-text-secondary">{card.type} · Cost {card.cost}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-xs font-bold text-white">
                    {card.cost}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="mb-3 h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-gf-text-secondary">No cards found</p>
          </div>
        )}
      </div>
    </div>
  );
}
