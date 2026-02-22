import { useDeferredValue, useMemo, useState } from 'react';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { filterCatalogCards, useCardsStore } from './cardsStore';
import { CardGrid } from './CardGrid';

interface ModernCardCatalogProps {
  cards: CardDefinition[];
}

export function ModernCardCatalog({ cards }: ModernCardCatalogProps) {
  const query = useCardsStore((state) => state.query);
  const filters = useCardsStore((state) => state.filters);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const setQuery = useCardsStore((state) => state.setQuery);
  const setFilter = useCardsStore((state) => state.setFilter);
  const clearFilters = useCardsStore((state) => state.clearFilters);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'power' | 'type' | 'color'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const colors: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Black', 'Colorless'];
  const types: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base'];

  const deferredQuery = useDeferredValue(query);
  const filteredAndSortedCards = useMemo(() => {
    const filtered = filterCatalogCards(cards, deferredQuery, filters);
    
    // Sort cards
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'cost':
          comparison = a.cost - b.cost;
          break;
        case 'power':
          comparison = (a.power ?? 0) - (b.power ?? 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'color':
          comparison = a.color.localeCompare(b.color);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [cards, deferredQuery, filters, sortBy, sortOrder]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.set))], [cards]);
  const costOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.cost).sort((a, b) => a - b))], [cards]);

  const onFilterChange = <K extends 'color' | 'cost' | 'type' | 'set'>(key: K, value: string) => {
    const parsedValue = key === 'cost' && value !== 'All' ? Number(value) : value;
    setFilter(key, parsedValue as never);
  };

  return (
    <section className="rounded-lg border border-gcg-border bg-white p-6 shadow-sm">
      {/* Header - Official Style */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gcg-text">CARD SEARCH</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedCards.length} card{filteredAndSortedCards.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded border border-gcg-border bg-white px-4 py-2 text-sm font-medium text-gcg-text hover:bg-gcg-light transition-colors"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Search Bar - Clean Style */}
      <div className="mb-6 flex gap-3">
        <input
          className="flex-1 rounded border border-gcg-border bg-white px-4 py-2 text-sm text-gcg-text placeholder-gray-400 outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
          placeholder="Search by card name or ID..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
        
        {/* Sort Controls */}
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
          >
            <option value="name">Name</option>
            <option value="cost">Cost</option>
            <option value="power">Power</option>
            <option value="type">Type</option>
            <option value="color">Color</option>
          </select>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text hover:bg-gcg-light transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Filters - Collapsible */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-gcg-border bg-gcg-light p-4 animate-fade-in sm:grid-cols-2 md:grid-cols-5">
          {/* Color Filter */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gcg-text">Color</label>
            <select
              className="w-full rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
              value={(filters.color as string) || 'All'}
              onChange={(e) => onFilterChange('color', e.target.value)}
            >
              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gcg-text">Type</label>
            <select
              className="w-full rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
              value={(filters.type as string) || 'All'}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Filter */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gcg-text">Cost</label>
            <select
              className="w-full rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
              value={String(filters.cost) || 'All'}
              onChange={(e) => onFilterChange('cost', e.target.value)}
            >
              {costOptions.map((cost) => (
                <option key={cost} value={cost}>
                  {typeof cost === 'number' ? `Cost ${cost}` : 'All'}
                </option>
              ))}
            </select>
          </div>

          {/* Set Filter - Official "Included In" style */}
          <div>
            <label className="mb-2 block text-xs font-medium text-gcg-text">Included In</label>
            <select
              className="w-full rounded border border-gcg-border bg-white px-3 py-2 text-sm text-gcg-text outline-none focus:border-gcg-primary focus:ring-1 focus:ring-gcg-primary"
              value={(filters.set as string) || 'All'}
              onChange={(e) => onFilterChange('set', e.target.value)}
            >
              {setOptions.map((set) => (
                <option key={set} value={set}>
                  {set}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              className="w-full rounded border border-gcg-primary bg-white px-3 py-2 text-sm font-medium text-gcg-primary hover:bg-gcg-primary hover:text-white transition-colors"
              onClick={() => {
                clearFilters();
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Card Grid */}
      <CardGrid
        cards={filteredAndSortedCards}
        selectedCardId={selectedCardId ?? undefined}
        onCardSelect={(id) => setSelectedCardId(id)}
      />

      {/* No Results */}
      {filteredAndSortedCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3 className="text-lg font-semibold text-gcg-text">No cards found</h3>
          <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </section>
  );
}
