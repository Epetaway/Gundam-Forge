'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Search, SlidersHorizontal, X, CheckCircle } from 'lucide-react';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { ReferenceCardDetailModal } from '@/components/cards/ReferenceCardDetailModal';
import { CardPreviewTile } from '@/components/deck/CardPreviewTile';
import { ReferenceCardTile } from '@/components/cards/ReferenceCardTile';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import { useCardsQuery } from '@/lib/query/useCardsQuery';
import { getCardImage } from '@/lib/data/cards';
import { cn } from '@/lib/utils/cn';
import { getActiveDeckId, getStoredDeck, updateDeckEntries } from '@/lib/deck/storage';
import { debounce } from '@/lib/utils/debounce';

const colorOptions: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const KEYWORD_OPTIONS = ['All', 'Rush', 'Breach', 'Burst', 'Suppression', 'Repair', 'Support', 'Link', 'Pair'] as const;
type KeywordOption = typeof KEYWORD_OPTIONS[number];
const typeOptions: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

type CatalogView = 'grid' | 'list';
type SortKey = 'name' | 'cost-asc' | 'cost-desc' | 'set';

const GRID_PAGE_SIZE = 60;
const LIST_PAGE_SIZE = 80;

const selectClassName =
  'h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';

interface FilterDraft {
  query: string;
  color: CardColor | 'All';
  type: CardType | 'All';
  setCode: string;
  keyword: KeywordOption;
}

interface ActiveChip {
  id: string;
  label: string;
  clear: () => void;
}

interface CardsClientProps {
  initialCards: CardDefinition[];
}

function sortCards(cards: CardDefinition[], sortBy: SortKey): CardDefinition[] {
  const arr = [...cards];
  switch (sortBy) {
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'cost-asc':
      return arr.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    case 'cost-desc':
      return arr.sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
    case 'set':
      return arr.sort((a, b) => a.set.localeCompare(b.set) || a.name.localeCompare(b.name));
    default:
      return arr;
  }
}

export default function CardsClient({ initialCards }: CardsClientProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  const colorParam = searchParams.get('color');
  const typeParam = searchParams.get('type');
  const setParam = searchParams.get('set');
  const queryParam = searchParams.get('q');

  const initialColor = colorOptions.includes((colorParam ?? 'All') as CardColor | 'All')
    ? ((colorParam ?? 'All') as CardColor | 'All')
    : 'All';
  const initialType = typeOptions.includes((typeParam ?? 'All') as CardType | 'All')
    ? ((typeParam ?? 'All') as CardType | 'All')
    : 'All';
  const keywordParam = searchParams.get('keyword') ?? 'All';
  const [query, setQuery] = useState(queryParam ?? '');
  const [color, setColor] = useState<CardColor | 'All'>(initialColor);
  const [type, setType] = useState<CardType | 'All'>(initialType);
  const [setCode, setSetCode] = useState(setParam ?? 'All');
  const [keyword, setKeyword] = useState<KeywordOption>(
    KEYWORD_OPTIONS.includes(keywordParam as KeywordOption) ? (keywordParam as KeywordOption) : 'All'
  );
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [view, setView] = useState<CatalogView>('grid');
  const [displayCount, setDisplayCount] = useState(GRID_PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [inspectCardId, setInspectCardId] = useState<string | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [activeDeckName, setActiveDeckName] = useState<string | null>(null);
  const [rawQuery, setRawQuery] = useState(queryParam ?? '');
  const drawerRef = useRef<HTMLDivElement>(null);
  const debouncedSetQuery = useCallback(debounce((val: string) => setQuery(val), 150), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [addFeedback, setAddFeedback] = useState<string | null>(null);
  const [draft, setDraft] = useState<FilterDraft>({
    query: '',
    color: 'All',
    type: 'All',
    setCode: 'All',
    keyword: 'All',
  });

  const allSets = useMemo(
    () => Array.from(new Set(initialCards.map((card) => card.set))).sort(),
    [initialCards],
  );

  // Sync filters to URL for shareability
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (color !== 'All') params.set('color', color);
    if (type !== 'All') params.set('type', type);
    if (setCode !== 'All') params.set('set', setCode);
    if (keyword !== 'All') params.set('keyword', keyword);
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      router.replace(`/cards${newSearch ? '?' + newSearch : ''}`, { scroll: false });
    }
  }, [query, color, type, setCode, keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = useMemo(
    () => ({ query, color, type, set: setCode, keyword }),
    [color, query, setCode, type, keyword],
  );

  // Apply client-side keyword filter on top of server-filtered results
  const { data: queryFiltered = initialCards } = useCardsQuery({ filters, initialData: initialCards });
  const filtered = useMemo(() => {
    if (keyword === 'All') return queryFiltered;
    const kw = keyword.toLowerCase();
    return queryFiltered.filter((card) => {
      const cardAny = card as any;
      const keywords: string[] = Array.isArray(cardAny.keywords) ? cardAny.keywords : [];
      return keywords.some((k: string) => k.toLowerCase().includes(kw));
    });
  }, [queryFiltered, keyword]);

  const sorted = useMemo(() => sortCards(filtered, sortBy), [filtered, sortBy]);
  const pageSize = view === 'grid' ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
  const visibleCards = useMemo(() => sorted.slice(0, displayCount), [displayCount, sorted]);

  useEffect(() => {
    setDisplayCount(pageSize);
  }, [pageSize, query, color, type, setCode, sortBy, keyword]);

  // Focus trap for filter drawer
  useEffect(() => {
    if (!mobileFiltersOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first)?.focus();
        }
      }
      if (e.key === 'Escape') setMobileFiltersOpen(false);
    };
    drawer.addEventListener('keydown', handleKeyDown);
    return () => drawer.removeEventListener('keydown', handleKeyDown);
  }, [mobileFiltersOpen]);

  // Load active deck from localStorage on mount
  useEffect(() => {
    const deckId = getActiveDeckId();
    if (deckId) {
      const deck = getStoredDeck(deckId);
      if (deck) {
        setActiveDeckId(deckId);
        setActiveDeckName(deck.name);
      }
    }
  }, []);

  const cardLookup = useMemo(() => new Map(sorted.map((card) => [card.id, card])), [sorted]);
  const inspectCard = inspectCardId ? cardLookup.get(inspectCardId) : undefined;

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];
    if (query.trim().length > 0) {
      chips.push({ id: `q:${query}`, label: `"${query.trim()}"`, clear: () => setQuery('') });
    }
    if (color !== 'All') {
      chips.push({ id: `color:${color}`, label: `Color: ${color}`, clear: () => setColor('All') });
    }
    if (type !== 'All') {
      chips.push({ id: `type:${type}`, label: `Type: ${type}`, clear: () => setType('All') });
    }
    if (setCode !== 'All') {
      chips.push({ id: `set:${setCode}`, label: `Set: ${setCode}`, clear: () => setSetCode('All') });
    }
    if (keyword !== 'All') {
      chips.push({ id: `kw:${keyword}`, label: `Keyword: ${keyword}`, clear: () => setKeyword('All') });
    }
    return chips;
  }, [color, query, setCode, type, keyword]);

  const clearAll = (): void => {
    setRawQuery('');
    setQuery('');
    setColor('All');
    setType('All');
    setSetCode('All');
    setKeyword('All');
  };

  const openMobileFilters = (): void => {
    setDraft({ query, color, type, setCode, keyword });
    setMobileFiltersOpen(true);
  };

  const applyMobileFilters = (): void => {
    setRawQuery(draft.query);
    setQuery(draft.query);
    setColor(draft.color);
    setType(draft.type);
    setSetCode(draft.setCode);
    setKeyword(draft.keyword);
    setMobileFiltersOpen(false);
  };

  const handleAddCard = (cardId: string): void => {
    if (!activeDeckId) return;

    try {
      const deck = getStoredDeck(activeDeckId);
      if (!deck) return;

      // Get the card to add
      const cardToAdd = cardLookup.get(cardId);
      if (!cardToAdd) return;

      // Count existing copies of this card in deck
      const existingCount = deck.entries.filter((e) => e.cardId === cardId).reduce((sum, e) => sum + e.qty, 0);
      
      // Max 4 copies per card
      if (existingCount >= 4) {
        setAddFeedback(`Max copies (4) reached`);
        setTimeout(() => setAddFeedback(null), 1500);
        return;
      }

      // Add to deck
      const newEntry = {
        cardId,
        qty: 1,
      };
      updateDeckEntries(activeDeckId, [...deck.entries, newEntry]);

      setAddFeedback('Card added!');
      setTimeout(() => setAddFeedback(null), 1500);

      // Close modal after short delay
      setTimeout(() => setInspectCardId(null), 300);
    } catch (err) {
      console.error('Failed to add card:', err);
      setAddFeedback('Error adding card');
      setTimeout(() => setAddFeedback(null), 1500);
    }
  };

  return (
    <>
      {/* ── CollectionToolbar — sticky below AppShell header ──── */}
      <div className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <Container wide>
          <div className="flex flex-wrap items-center gap-2 py-2">
            {/* Search */}
            <div className="relative order-1 w-full sm:order-none sm:w-52 lg:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input
                className="h-9 w-full rounded-md border border-border bg-surface-interactive pl-8 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                onChange={(event) => { setRawQuery(event.target.value); debouncedSetQuery(event.target.value); }}
                placeholder="Search cards..."
                value={rawQuery}
              />
              {query.length > 0 ? (
                <button
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-steel-500 hover:text-foreground"
                  onClick={() => { setRawQuery(''); setQuery(''); }}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="order-2 flex w-full flex-wrap items-center gap-2 sm:order-none sm:w-auto sm:flex-1">
              {/* Results count */}
              <span className="flex-none text-sm text-steel-600">
                <span className="font-semibold text-foreground">{sorted.length}</span> cards
              </span>

              <div className="hidden sm:flex sm:flex-1" />

              {/* Sort */}
              <select
                className={selectClassName}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
                value={sortBy}
              >
                <option value="name">Name A→Z</option>
                <option value="cost-asc">Cost ↑</option>
                <option value="cost-desc">Cost ↓</option>
                <option value="set">Set</option>
              </select>

              {/* View toggles */}
              <div className="inline-flex items-center rounded-md border border-border bg-surface-interactive p-1">
                <button
                  aria-label="Grid view"
                  className={cn(
                    'rounded px-2 py-1 text-xs font-semibold transition-colors',
                    view === 'grid' ? 'bg-surface text-foreground shadow-sm' : 'text-steel-600 hover:text-foreground',
                  )}
                  onClick={() => setView('grid')}
                  type="button"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="List view"
                  className={cn(
                    'rounded px-2 py-1 text-xs font-semibold transition-colors',
                    view === 'list' ? 'bg-surface text-foreground shadow-sm' : 'text-steel-600 hover:text-foreground',
                  )}
                  onClick={() => setView('list')}
                  type="button"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Filters button — opens filter drawer */}
              <Button onClick={openMobileFilters} size="sm" variant="secondary">
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Filters
                {activeChips.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {activeChips.length}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {activeChips.map((chip) => (
                <button
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-sm border border-border bg-surface-interactive px-2 py-1 text-[11px] font-medium text-steel-700 transition-colors hover:border-accent hover:text-accent"
                  key={chip.id}
                  onClick={chip.clear}
                  type="button"
                >
                  {chip.label}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-accent/20">
                    <X className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
              <button
                className="text-[11px] font-semibold text-steel-600 hover:text-foreground"
                onClick={clearAll}
                type="button"
              >
                Clear all
              </button>
            </div>
          ) : null}
        </Container>
      </div>

      {/* ── Active Deck Bar ──────────────────────────────── */}
      {activeDeckId && activeDeckName ? (
        <div className="sticky top-[68px] z-30 border-b border-border bg-gradient-to-r from-cobalt-600/10 to-cobalt-500/5 backdrop-blur-sm">
          <Container wide>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  Active deck: <span className="font-semibold text-cobalt-600">{activeDeckName}</span>
                </span>
                {addFeedback && (
                  <div className="flex items-center gap-1 ml-4 text-xs font-medium text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {addFeedback}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setActiveDeckId(null)}
                size="sm"
                variant="ghost"
              >
                Change
              </Button>
            </div>
          </Container>
        </div>
      ) : null}

      <Container className="py-4" wide>
        {sorted.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">
            No cards match the active filters.
          </p>
        ) : (
          <>
            {view === 'grid' ? (
              <ul
                className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                role="list"
              >
                {visibleCards.map((card) => (
                  <li key={card.id}>
                    <CardPreviewTile
                      imageUrl={getCardImage(card)}
                      name={card.name}
                      cost={card.cost}
                      type={card.type}
                      qty={0}
                      onClick={() => setInspectCardId(card.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-border" role="list">
                {visibleCards.map((card) => (
                  <li className="px-1.5 py-1" key={card.id}>
                    <ReferenceCardTile
                      card={card}
                      onOpen={() => setInspectCardId(card.id)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-steel-600">Showing {visibleCards.length} of {sorted.length} cards</p>
              {displayCount < sorted.length ? (
                <Button onClick={() => setDisplayCount((count) => count + pageSize)} variant="secondary">
                  Load more
                </Button>
              ) : null}
            </div>
          </>
        )}
      </Container>

      {/* ── Filter Drawer ─────────────────────────────────────── */}
      {mobileFiltersOpen ? (
        <>
          <button
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div ref={drawerRef} className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-md border border-border bg-surface p-4 shadow-2xl sm:inset-auto sm:right-4 sm:top-24 sm:w-72 sm:rounded-md" role="dialog" aria-modal="true" aria-label="Filter cards">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Filters</h3>
              <button
                aria-label="Close"
                className="rounded p-1 text-steel-600 hover:text-foreground"
                onClick={() => setMobileFiltersOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Search — mobile only, desktop has it in toolbar */}
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600 sm:hidden">
                Search
                <input
                  className="h-10 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, query: event.target.value }))}
                  placeholder="Card name, ID, text"
                  value={draft.query}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Color
                <select
                  className="h-10 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, color: event.target.value as CardColor | 'All' }))}
                  value={draft.color}
                >
                  {colorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Type
                <select
                  className="h-10 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, type: event.target.value as CardType | 'All' }))}
                  value={draft.type}
                >
                  {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Set
                <select
                  className="h-10 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, setCode: event.target.value }))}
                  value={draft.setCode}
                >
                  <option value="All">All Sets</option>
                  {allSets.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Keyword
                <select
                  className="h-10 rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, keyword: event.target.value as KeywordOption }))}
                  value={draft.keyword}
                >
                  {KEYWORD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button className="flex-1" onClick={applyMobileFilters}>
                Apply
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Detail modal ──────────────────────────────────────── */}
      <ReferenceCardDetailModal
        card={inspectCard ?? null}
        onOpenChange={(open) => !open && setInspectCardId(null)}
        open={Boolean(inspectCard)}
        qty={0}
        onAdd={activeDeckId ? () => inspectCard && handleAddCard(inspectCard.id) : undefined}
      />
    </>
  );
}
