'use client';

import { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
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

const colorOptions: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const typeOptions: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

type CatalogView = 'grid' | 'list';
type SortKey = 'name' | 'cost-asc' | 'cost-desc' | 'set';

const selectClassName =
  'h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';

interface FilterDraft {
  query: string;
  color: CardColor | 'All';
  type: CardType | 'All';
  setCode: string;
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
  const [query, setQuery] = useState('');
  const [color, setColor] = useState<CardColor | 'All'>('All');
  const [type, setType] = useState<CardType | 'All'>('All');
  const [setCode, setSetCode] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [view, setView] = useState<CatalogView>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [inspectCardId, setInspectCardId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FilterDraft>({
    query: '',
    color: 'All',
    type: 'All',
    setCode: 'All',
  });

  const allSets = useMemo(
    () => Array.from(new Set(initialCards.map((card) => card.set))).sort(),
    [initialCards],
  );

  const filters = useMemo(
    () => ({ query, color, type, set: setCode }),
    [color, query, setCode, type],
  );

  const { data: filtered = initialCards } = useCardsQuery({ filters, initialData: initialCards });

  const sorted = useMemo(() => sortCards(filtered, sortBy), [filtered, sortBy]);

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
    return chips;
  }, [color, query, setCode, type]);

  const clearAll = (): void => {
    setQuery('');
    setColor('All');
    setType('All');
    setSetCode('All');
  };

  const openMobileFilters = (): void => {
    setDraft({ query, color, type, setCode });
    setMobileFiltersOpen(true);
  };

  const applyMobileFilters = (): void => {
    setQuery(draft.query);
    setColor(draft.color);
    setType(draft.type);
    setSetCode(draft.setCode);
    setMobileFiltersOpen(false);
  };

  return (
    <>
      {/* ── CollectionToolbar — sticky below AppShell header ──── */}
      <div className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur-md">
        <Container wide>
          <div className="flex flex-wrap items-center gap-2 py-2">
            {/* Results count */}
            <span className="flex-none text-sm text-steel-600">
              <span className="font-semibold text-foreground">{sorted.length}</span> cards
            </span>

            <div className="flex-1" />

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

            {/* Search — visible on sm+ */}
            <div className="relative hidden w-52 sm:block lg:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
              <input
                className="h-9 w-full rounded-md border border-border bg-surface-interactive pl-8 pr-8 text-sm text-foreground outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cards..."
                value={query}
              />
              {query.length > 0 ? (
                <button
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-steel-500 hover:text-foreground"
                  onClick={() => setQuery('')}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
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

          {/* Active filter chips */}
          {activeChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {activeChips.map((chip) => (
                <button
                  className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-interactive px-2 py-0.5 text-[11px] font-medium text-steel-700 transition-colors hover:border-accent hover:text-accent"
                  key={chip.id}
                  onClick={chip.clear}
                  type="button"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
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

      {/* ── Card Grid ─────────────────────────────────────────── */}
      <Container className="py-4" wide>
        {sorted.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">
            No cards match the active filters.
          </p>
        ) : view === 'grid' ? (
          <ul
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            role="list"
          >
            {sorted.slice(0, 360).map((card) => (
              <li key={card.id}>
                <CardPreviewTile
                  imageUrl={getCardImage(card)}
                  name={card.name}
                  qty={0}
                  onClick={() => setInspectCardId(card.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {sorted.slice(0, 400).map((card) => (
              <li className="px-1.5 py-1" key={card.id}>
                <ReferenceCardTile
                  card={card}
                  onOpen={() => setInspectCardId(card.id)}
                />
              </li>
            ))}
          </ul>
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
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-md border border-border bg-surface p-4 shadow-2xl sm:inset-auto sm:right-4 sm:top-24 sm:w-72 sm:rounded-md">
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
      />
    </>
  );
}
