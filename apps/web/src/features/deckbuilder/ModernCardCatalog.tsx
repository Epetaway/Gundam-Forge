import { useDeferredValue, useMemo, useState, useCallback, useRef, useEffect } from 'react';
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

type CatalogTab = 'catalog' | 'collection' | 'suggestions';

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Card recommendations: cards matching deck's dominant colors/types, not already in deck
  const suggestedCards = useMemo(() => {
    if (deckEntries.length === 0) return [];
    const deckCardIds = new Set(deckEntries.map((e) => e.cardId));

    // Count deck colors and types
    const colorCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const deckTraits = new Set<string>();
    for (const entry of deckEntries) {
      const card = cards.find((c) => c.id === entry.cardId);
      if (!card) continue;
      colorCounts[card.color] = (colorCounts[card.color] || 0) + entry.qty;
      typeCounts[card.type] = (typeCounts[card.type] || 0) + entry.qty;
      card.traits?.forEach((t) => deckTraits.add(t));
    }

    // Top colors (up to 2)
    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([color]) => color);

    // Score each card not in deck
    const scored = cards
      .filter((c) => !deckCardIds.has(c.id) && !brokenIds[c.id])
      .map((card) => {
        let score = 0;
        if (topColors.includes(card.color)) score += 10;
        if (typeCounts[card.type]) score += 5;
        if (card.traits?.some((t) => deckTraits.has(t))) score += 3;
        return { card, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.card.cost - b.card.cost)
      .slice(0, 20)
      .map((s) => s.card);

    return scored;
  }, [cards, deckEntries, brokenIds]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.set))], [cards]);
  const traitOptions = useMemo(() => {
    const traits = new Set<string>();
    cards.forEach((c) => c.traits?.forEach((t) => traits.add(t)));
    return ['All', ...Array.from(traits).sort()];
  }, [cards]);
  const zoneOptions = useMemo(() => {
    const zones = new Set<string>();
    cards.forEach((c) => { if (c.zone) zones.add(c.zone); });
    return ['All', ...Array.from(zones).sort()];
  }, [cards]);
  const costBounds = useMemo(() => {
    let min = Infinity, max = -Infinity;
    cards.forEach((c) => { if (c.cost < min) min = c.cost; if (c.cost > max) max = c.cost; });
    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 10 : max };
  }, [cards]);
  const qtyByCardId = useMemo(
    () => new Map(deckEntries.map((entry) => [entry.cardId, entry.qty] as const)),
    [deckEntries]
  );

  // The cards to display in the grid depend on the active tab
  const displayCards = activeTab === 'suggestions' ? suggestedCards : filteredCards;

  // Virtualized grid: 2 columns, rows of card pairs
  const gridRows = useMemo(() => {
    const rows: CardDefinition[][] = [];
    for (let i = 0; i < displayCards.length; i += 2) {
      rows.push(displayCards.slice(i, i + 2));
    }
    return rows;
  }, [displayCards]);

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

  // Search autocomplete suggestions (max 8)
  const MAX_SUGGESTIONS = 8;
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const matches: CardDefinition[] = [];
    for (const card of cards) {
      if (card.name.toLowerCase().includes(q)) {
        matches.push(card);
        if (matches.length >= MAX_SUGGESTIONS) break;
      }
    }
    return matches;
  }, [cards, query]);

  // Reset highlight when suggestions change
  useEffect(() => { setHighlightIdx(-1); }, [suggestions]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      const card = suggestions[highlightIdx];
      setQuery(card.name);
      setSelectedCardId(card.id);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, highlightIdx, setQuery, setSelectedCardId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gf-border px-4 py-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gf-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
          <h2 className="font-heading text-sm font-bold text-gf-text tracking-wide uppercase">
            {activeTab === 'collection' ? 'My Collection' : activeTab === 'suggestions' ? 'Suggestions' : 'Card Catalog'}
          </h2>
        </div>
        <span className="text-[10px] text-gf-text-muted font-medium">
          {displayCards.length} cards
        </span>
      </div>

      {/* Catalog / Collection / Suggestions Tabs */}
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
        {authUser && (
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
        )}
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wide text-center transition-colors ${
            activeTab === 'suggestions'
              ? 'text-gf-blue border-b-2 border-gf-blue bg-gf-blue-light/30'
              : 'text-gf-text-muted hover:text-gf-text hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Suggest
          </span>
        </button>
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
            ref={searchInputRef}
            data-search-input
            className="w-full rounded-lg border border-gf-border bg-gf-light py-2 pl-9 pr-9 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:bg-gf-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
            placeholder={activeTab === 'collection' ? 'Search collection...' : 'Search cards... (/ to focus)'}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => { if (query.trim().length >= 2) setShowSuggestions(true); }}
            onKeyDown={handleSearchKeyDown}
            autoComplete="off"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setShowSuggestions(false); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gf-text-muted hover:bg-gray-200 hover:text-gf-text transition-colors"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-1 z-dropdown rounded-lg border border-gf-border bg-gf-white shadow-lg overflow-hidden"
            >
              {suggestions.map((card, idx) => (
                <button
                  key={card.id}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    idx === highlightIdx
                      ? 'bg-gf-blue/10 text-gf-blue'
                      : 'text-gf-text hover:bg-gf-light'
                  }`}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => {
                    setQuery(card.name);
                    setSelectedCardId(card.id);
                    setShowSuggestions(false);
                  }}
                >
                  <img
                    src={resolveCardImage(card)}
                    alt={card.name}
                    className="h-7 w-5 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <span className="flex-1 truncate font-medium">{card.name}</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gf-blue/80 text-[8px] font-bold text-white flex-shrink-0">
                    {card.cost}
                  </span>
                  <span className="text-[10px] text-gf-text-muted">{card.color}</span>
                </button>
              ))}
            </div>
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
                    : 'border-gf-border bg-gf-white text-gf-text-secondary hover:border-gf-blue hover:text-gf-blue'
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
            className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
          >
            {setOptions.map((set) => (
              <option key={set} value={set}>{set === 'All' ? 'All Sets' : set}</option>
            ))}
          </select>
        </div>

        {/* Cost Range Slider */}
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Cost Range</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={costBounds.min}
              max={costBounds.max}
              value={filters.costMin ?? ''}
              onChange={(e) => setFilter('costMin', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Min"
              className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
            />
            <span className="text-[10px] text-gf-text-muted">to</span>
            <input
              type="number"
              min={costBounds.min}
              max={costBounds.max}
              value={filters.costMax ?? ''}
              onChange={(e) => setFilter('costMax', e.target.value === '' ? null : Number(e.target.value))}
              placeholder="Max"
              className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
            />
            {(filters.costMin !== null || filters.costMax !== null) && (
              <button
                onClick={() => { setFilter('costMin', null); setFilter('costMax', null); }}
                className="text-[10px] text-gf-text-muted hover:text-gf-error transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced((s) => !s)}
          className="flex w-full items-center gap-1.5 text-[10px] font-medium text-gf-text-muted hover:text-gf-text transition-colors"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {showAdvanced ? 'Hide Advanced' : 'More Filters'}
        </button>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="space-y-3 border-t border-gf-border pt-3">
            {/* AP Range */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">AP Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={filters.apMin ?? ''}
                  onChange={(e) => setFilter('apMin', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Min"
                  className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
                />
                <span className="text-[10px] text-gf-text-muted">to</span>
                <input
                  type="number"
                  min={0}
                  value={filters.apMax ?? ''}
                  onChange={(e) => setFilter('apMax', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Max"
                  className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
                />
              </div>
            </div>

            {/* HP Range */}
            <div>
              <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">HP Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={filters.hpMin ?? ''}
                  onChange={(e) => setFilter('hpMin', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Min"
                  className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
                />
                <span className="text-[10px] text-gf-text-muted">to</span>
                <input
                  type="number"
                  min={0}
                  value={filters.hpMax ?? ''}
                  onChange={(e) => setFilter('hpMax', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Max"
                  className="w-16 rounded-md border border-gf-border bg-gf-white px-2 py-1 text-[11px] text-gf-text outline-none focus:border-gf-blue transition-colors tabular-nums"
                />
              </div>
            </div>

            {/* Trait Filter */}
            {traitOptions.length > 1 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Trait</p>
                <select
                  value={(filters.trait as string) || 'All'}
                  onChange={(e) => setFilter('trait', e.target.value)}
                  className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
                >
                  {traitOptions.map((t) => (
                    <option key={t} value={t}>{t === 'All' ? 'All Traits' : t}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Zone Filter */}
            {zoneOptions.length > 1 && (
              <div>
                <p className="mb-1.5 text-[10px] font-medium text-gf-text-muted">Zone</p>
                <select
                  value={(filters.zone as string) || 'All'}
                  onChange={(e) => setFilter('zone', e.target.value)}
                  className="w-full rounded-lg border border-gf-border bg-gf-white px-3 py-1.5 text-xs text-gf-text outline-none focus:border-gf-blue transition-colors"
                >
                  {zoneOptions.map((z) => (
                    <option key={z} value={z}>{z === 'All' ? 'All Zones' : z}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Virtualized Card Grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto gf-scroll">
        {displayCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {activeTab === 'suggestions' ? (
              <>
                <svg className="mb-3 h-10 w-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm font-medium text-gf-text">No suggestions yet</p>
                <p className="text-xs text-gf-text-muted mt-1">
                  Add cards to your deck to get recommendations.
                </p>
              </>
            ) : activeTab === 'collection' && authUser ? (
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
        className="gf-card-tile bg-gf-white"
        data-selected={isSelected ? 'true' : undefined}
      >
        <div className="relative w-full pb-[140%] bg-gradient-to-b from-gray-100 to-gray-200">
          <img
            src={imageSrc}
            alt={card.name}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
            loading="lazy"
            decoding="async"
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
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
