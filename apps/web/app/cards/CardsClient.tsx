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
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import { useCardsQuery } from '@/lib/query/useCardsQuery';
import { getCardImage, getCardsFromSource } from '@/lib/data/cards';
import type { CardDeckRole, CatalogFilters, FilterMatchMode } from '@/lib/filters/cardFilters';
import { filtersToSearchParams, parseDelimitedInput } from '@/lib/filters/cardFilters';
import { cn } from '@/lib/utils/cn';
import { getActiveDeckId, getStoredDeck, updateDeckEntries } from '@/lib/deck/storage';
import { debounce } from '@/lib/utils/debounce';

const KEYWORD_OPTIONS = ['All', 'Rush', 'Breach', 'Burst', 'Suppression', 'Repair', 'Support', 'Link', 'Pair'] as const;
type KeywordOption = typeof KEYWORD_OPTIONS[number];
const CANONICAL_COLORS: CardColor[] = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const CANONICAL_TYPES: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

type CatalogView = 'grid' | 'list';
type SortKey = 'name' | 'cost-asc' | 'cost-desc' | 'set';

const GRID_PAGE_SIZE = 60;
const LIST_PAGE_SIZE = 80;

const selectClassName =
  'min-h-9 w-full rounded-md border border-border bg-surface-interactive px-2.5 py-2 pr-8 text-left text-sm leading-tight text-foreground outline-none transition-colors whitespace-normal focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';

interface FilterDraft {
  query: string;
  color: CardColor | 'All';
  type: CardType | 'All';
  setCode: string;
  keyword: KeywordOption;
  zone: string;
  deckRole: CardDeckRole | 'All';
  matchMode: FilterMatchMode;
  clans: string[];
  traits: string[];
  mechanics: string[];
  triggers: string[];
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

  const colorCounts = useMemo(() => {
    const counts = new Map<CardColor, number>();
    for (const color of CANONICAL_COLORS) counts.set(color, 0);
    for (const card of initialCards) {
      counts.set(card.color, (counts.get(card.color) ?? 0) + 1);
    }
    return counts;
  }, [initialCards]);

  const colorOptions = useMemo<Array<CardColor | 'All'>>(
    () => ['All', ...CANONICAL_COLORS.filter((color) => (colorCounts.get(color) ?? 0) > 0)],
    [colorCounts],
  );

  const typeOptions = useMemo<Array<CardType | 'All'>>(
    () => ['All', ...CANONICAL_TYPES.filter((type) => initialCards.some((card) => card.type === type))],
    [initialCards],
  );

  const colorParam = searchParams.get('color');
  const typeParam = searchParams.get('type');
  const setParam = searchParams.get('set');
  const queryParam = searchParams.get('q');
  const zoneParam = searchParams.get('zone');
  const deckRoleParam = searchParams.get('deckRole');
  const matchModeParam = searchParams.get('matchMode');

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
  const [zone, setZone] = useState(zoneParam ?? 'All');
  const [deckRole, setDeckRole] = useState<CardDeckRole | 'All'>(
    deckRoleParam === 'main' || deckRoleParam === 'resource' || deckRoleParam === 'ex' ? deckRoleParam : 'All'
  );
  const [matchMode, setMatchMode] = useState<FilterMatchMode>(matchModeParam === 'broad' ? 'broad' : 'strict');
  const [selectedClans, setSelectedClans] = useState<string[]>(parseDelimitedInput(searchParams.get('clans') ?? ''));
  const [selectedTraits, setSelectedTraits] = useState<string[]>(parseDelimitedInput(searchParams.get('traits') ?? ''));
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>(parseDelimitedInput(searchParams.get('keywords') ?? ''));
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(parseDelimitedInput(searchParams.get('triggers') ?? ''));
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
  const [hoveredCard, setHoveredCard] = useState<{ card: CardDefinition; anchor: DOMRect } | null>(null);
  const [draft, setDraft] = useState<FilterDraft>({
    query: '',
    color: 'All',
    type: 'All',
    setCode: 'All',
    keyword: 'All',
    zone: 'All',
    deckRole: 'All',
    matchMode: 'strict',
    clans: [],
    traits: [],
    mechanics: [],
    triggers: [],
  });

  useEffect(() => {
    if (color !== 'All' && !colorOptions.includes(color)) {
      setColor('All');
    }
  }, [color, colorOptions]);

  const allSets = useMemo(
    () => Array.from(new Set(initialCards.map((card) => card.set))).sort(),
    [initialCards],
  );

  const allZones = useMemo(
    () => Array.from(new Set(initialCards.map((card) => card.zone).filter(Boolean) as string[])).sort(),
    [initialCards],
  );

  const clanOptions = useMemo(
    () => Array.from(new Set(initialCards.flatMap((card) => card.clans ?? []))).sort((a, b) => a.localeCompare(b)),
    [initialCards],
  );

  const traitOptions = useMemo(
    () => Array.from(new Set(initialCards.flatMap((card) => card.traits ?? []))).sort((a, b) => a.localeCompare(b)),
    [initialCards],
  );

  const mechanicOptions = useMemo(
    () => Array.from(new Set(initialCards.flatMap((card) => card.keywords ?? []))).sort((a, b) => a.localeCompare(b)),
    [initialCards],
  );

  const triggerOptions = useMemo(
    () => Array.from(new Set(initialCards.flatMap((card) => card.triggers ?? []))).sort((a, b) => a.localeCompare(b)),
    [initialCards],
  );

  // Sync filters to URL for shareability
  useEffect(() => {
    const params = filtersToSearchParams({
      query,
      color,
      type,
      set: setCode,
      keyword,
      zone,
      deckRole,
      matchMode,
      clans: selectedClans,
      traits: selectedTraits,
      keywords: selectedMechanics,
      triggers: selectedTriggers,
    });
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();
    if (newSearch !== currentSearch) {
      router.replace(`/cards${newSearch ? '?' + newSearch : ''}`, { scroll: false });
    }
  }, [
    query,
    color,
    type,
    setCode,
    keyword,
    zone,
    deckRole,
    matchMode,
    selectedClans,
    selectedTraits,
    selectedMechanics,
    selectedTriggers,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const filters = useMemo<CatalogFilters>(
    () => ({
      query,
      color,
      type,
      set: setCode,
      keyword,
      zone,
      deckRole,
      matchMode,
      clans: selectedClans,
      traits: selectedTraits,
      keywords: selectedMechanics,
      triggers: selectedTriggers,
    }),
    [
      color,
      query,
      setCode,
      type,
      keyword,
      zone,
      deckRole,
      matchMode,
      selectedClans,
      selectedTraits,
      selectedMechanics,
      selectedTriggers,
    ],
  );

  const { data: cardsResult } = useCardsQuery({ filters, initialData: initialCards });
  const filtered = useMemo(() => getCardsFromSource(initialCards, filters), [initialCards, filters]);
  const serverTotal = cardsResult?.total;

  const sorted = useMemo(() => sortCards(filtered, sortBy), [filtered, sortBy]);
  const pageSize = view === 'grid' ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
  const visibleCards = useMemo(() => sorted.slice(0, displayCount), [displayCount, sorted]);

  useEffect(() => {
    setDisplayCount(pageSize);
  }, [pageSize, query, color, type, setCode, sortBy, keyword, zone, deckRole, matchMode, selectedClans, selectedTraits, selectedMechanics, selectedTriggers]);

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
    if (zone !== 'All') {
      chips.push({ id: `zone:${zone}`, label: `Zone: ${zone}`, clear: () => setZone('All') });
    }
    if (deckRole !== 'All') {
      chips.push({ id: `deckRole:${deckRole}`, label: `Deck role: ${deckRole}`, clear: () => setDeckRole('All') });
    }
    if (matchMode === 'broad') {
      chips.push({ id: 'mode:broad', label: 'Mode: broaden', clear: () => setMatchMode('strict') });
    }
    for (const clan of selectedClans) {
      chips.push({
        id: `clan:${clan}`,
        label: `Clan: ${clan}`,
        clear: () => setSelectedClans((prev) => prev.filter((entry) => entry !== clan)),
      });
    }
    for (const trait of selectedTraits) {
      chips.push({
        id: `trait:${trait}`,
        label: `Trait: ${trait}`,
        clear: () => setSelectedTraits((prev) => prev.filter((entry) => entry !== trait)),
      });
    }
    for (const mechanic of selectedMechanics) {
      chips.push({
        id: `mechanic:${mechanic}`,
        label: `Mechanic: ${mechanic}`,
        clear: () => setSelectedMechanics((prev) => prev.filter((entry) => entry !== mechanic)),
      });
    }
    for (const trigger of selectedTriggers) {
      chips.push({
        id: `trigger:${trigger}`,
        label: `Trigger: ${trigger}`,
        clear: () => setSelectedTriggers((prev) => prev.filter((entry) => entry !== trigger)),
      });
    }
    return chips;
  }, [color, query, setCode, type, keyword, zone, deckRole, matchMode, selectedClans, selectedTraits, selectedMechanics, selectedTriggers]);

  const clearAll = (): void => {
    setRawQuery('');
    setQuery('');
    setColor('All');
    setType('All');
    setSetCode('All');
    setKeyword('All');
    setZone('All');
    setDeckRole('All');
    setMatchMode('strict');
    setSelectedClans([]);
    setSelectedTraits([]);
    setSelectedMechanics([]);
    setSelectedTriggers([]);
  };

  const openMobileFilters = (): void => {
    setDraft({
      query,
      color,
      type,
      setCode,
      keyword,
      zone,
      deckRole,
      matchMode,
      clans: selectedClans,
      traits: selectedTraits,
      mechanics: selectedMechanics,
      triggers: selectedTriggers,
    });
    setMobileFiltersOpen(true);
  };

  const applyMobileFilters = (): void => {
    setRawQuery(draft.query);
    setQuery(draft.query);
    setColor(draft.color);
    setType(draft.type);
    setSetCode(draft.setCode);
    setKeyword(draft.keyword);
    setZone(draft.zone);
    setDeckRole(draft.deckRole);
    setMatchMode(draft.matchMode);
    setSelectedClans(draft.clans);
    setSelectedTraits(draft.traits);
    setSelectedMechanics(draft.mechanics);
    setSelectedTriggers(draft.triggers);
    setMobileFiltersOpen(false);
  };

  const toggleDraftSelection = (group: 'clans' | 'traits' | 'mechanics' | 'triggers', value: string): void => {
    setDraft((current) => {
      const selected = current[group];
      const hasValue = selected.includes(value);
      return {
        ...current,
        [group]: hasValue ? selected.filter((entry) => entry !== value) : [...selected, value],
      } as FilterDraft;
    });
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
                {typeof serverTotal === 'number' ? (
                  <span className="ml-1 text-xs text-steel-500">(server total {serverTotal})</span>
                ) : (
                  <span className="ml-1 text-xs text-steel-500">(source {initialCards.length})</span>
                )}
              </span>

              <div className="hidden sm:flex sm:flex-1" />

              {/* Sort */}
              <select
                className={selectClassName}
                style={{ width: 'auto', minWidth: '9rem', maxWidth: '13rem' }}
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
                  <li
                    key={card.id}
                    onMouseEnter={(e) => {
                      setHoveredCard({ card, anchor: e.currentTarget.getBoundingClientRect() });
                    }}
                    onMouseLeave={() => {
                      setHoveredCard(null);
                    }}
                  >
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
                  <li
                    className="px-1.5 py-1"
                    key={card.id}
                    onMouseEnter={(e) => {
                      setHoveredCard({ card, anchor: e.currentTarget.getBoundingClientRect() });
                    }}
                    onMouseLeave={() => {
                      setHoveredCard(null);
                    }}
                  >
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
          <div ref={drawerRef} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-gradient-to-b from-surface to-surface-interactive/60 p-4 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[360px] md:rounded-none md:rounded-l-2xl" role="dialog" aria-modal="true" aria-label="Filter cards">
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

            <div className="mt-2 space-y-2 pb-20">
              {/* Search — mobile only, desktop has it in toolbar */}
              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600 sm:hidden">
                Search
                <input
                  className="mt-1 h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  onChange={(event) => setDraft((c) => ({ ...c, query: event.target.value }))}
                  placeholder="Card name, ID, text"
                  value={draft.query}
                />
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Color</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, color: event.target.value as CardColor | 'All' }))}
                  value={draft.color}
                >
                  <option value="All">All Colors</option>
                  {colorOptions.filter((option) => option !== 'All').map((option) => (
                    <option key={option} value={option}>
                      {option} ({colorCounts.get(option as CardColor) ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Type</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, type: event.target.value as CardType | 'All' }))}
                  value={draft.type}
                >
                  {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Set</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, setCode: event.target.value }))}
                  value={draft.setCode}
                >
                  <option value="All">All Sets</option>
                  {allSets.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Keyword</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, keyword: event.target.value as KeywordOption }))}
                  value={draft.keyword}
                >
                  {KEYWORD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Match Mode</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, matchMode: event.target.value as FilterMatchMode }))}
                  value={draft.matchMode}
                >
                  <option value="strict">Match all selected filters</option>
                  <option value="broad">Broaden multi-select matches</option>
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Deck Role</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, deckRole: event.target.value as CardDeckRole | 'All' }))}
                  value={draft.deckRole}
                >
                  <option value="All">All Roles</option>
                  <option value="main">Main Deck</option>
                  <option value="resource">Resource Deck</option>
                  <option value="ex">EX Card</option>
                </select>
              </label>

              <label className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Zone</span>
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((c) => ({ ...c, zone: event.target.value }))}
                  value={draft.zone}
                >
                  <option value="All">All Zones</option>
                  {allZones.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <div className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Clans</span>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border bg-surface/50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {clanOptions.map((option) => (
                      <button
                        className={cn(
                          'rounded-full border px-1.5 py-0.5 text-[10px] font-medium normal-case',
                          draft.clans.includes(option)
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-border bg-surface-interactive text-steel-700 hover:border-accent/40',
                        )}
                        key={option}
                        onClick={() => toggleDraftSelection('clans', option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Traits</span>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border bg-surface/50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {traitOptions.map((option) => (
                      <button
                        className={cn(
                          'rounded-full border px-1.5 py-0.5 text-[10px] font-medium normal-case',
                          draft.traits.includes(option)
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-border bg-surface-interactive text-steel-700 hover:border-accent/40',
                        )}
                        key={option}
                        onClick={() => toggleDraftSelection('traits', option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Mechanics</span>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border bg-surface/50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {mechanicOptions.map((option) => (
                      <button
                        className={cn(
                          'rounded-full border px-1.5 py-0.5 text-[10px] font-medium normal-case',
                          draft.mechanics.includes(option)
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-border bg-surface-interactive text-steel-700 hover:border-accent/40',
                        )}
                        key={option}
                        onClick={() => toggleDraftSelection('mechanics', option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid text-[10px] font-semibold uppercase tracking-wide text-steel-600">
                <span className="mb-1">Triggers</span>
                <div className="max-h-28 overflow-y-auto rounded-md border border-border bg-surface/50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {triggerOptions.map((option) => (
                      <button
                        className={cn(
                          'rounded-full border px-1.5 py-0.5 text-[10px] font-medium normal-case',
                          draft.triggers.includes(option)
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-border bg-surface-interactive text-steel-700 hover:border-accent/40',
                        )}
                        key={option}
                        onClick={() => toggleDraftSelection('triggers', option)}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 mt-2 flex items-center gap-2 border-t border-border bg-surface/95 px-4 py-2 backdrop-blur-sm">
              <Button
                className="flex-1"
                onClick={() =>
                  setDraft({
                    query: '',
                    color: 'All',
                    type: 'All',
                    setCode: 'All',
                    keyword: 'All',
                    zone: 'All',
                    deckRole: 'All',
                    matchMode: 'strict',
                    clans: [],
                    traits: [],
                    mechanics: [],
                    triggers: [],
                  })
                }
                variant="ghost"
              >
                Reset
              </Button>
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

      {/* ── Hover preview ──────────────────────────────────────── */}
      {hoveredCard && <CardHoverPreview card={hoveredCard.card} anchor={hoveredCard.anchor} />}
    </>
  );
}
