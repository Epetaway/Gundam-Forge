'use client';

import { useMemo, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { ReferenceCardDetailModal } from '@/components/cards/ReferenceCardDetailModal';
import { ReferenceCardTile } from '@/components/cards/ReferenceCardTile';
import { useCardsQuery } from '@/lib/query/useCardsQuery';
import { cn } from '@/lib/utils/cn';

const colorOptions: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const typeOptions: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

type CatalogView = 'grid' | 'list';

const inputClassName =
  'h-10 w-full rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';
const selectClassName =
  'h-10 w-full rounded-md border border-border bg-surface-interactive px-3 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';

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

export default function CardsClient({ initialCards }: CardsClientProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [color, setColor] = useState<CardColor | 'All'>('All');
  const [type, setType] = useState<CardType | 'All'>('All');
  const [setCode, setSetCode] = useState('All');
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

  const {
    data: filtered = initialCards,
    isFetching,
  } = useCardsQuery({
    filters,
    initialData: initialCards,
  });

  const cardLookup = useMemo(() => new Map(filtered.map((card) => [card.id, card])), [filtered]);
  const inspectCard = inspectCardId ? cardLookup.get(inspectCardId) : undefined;

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];

    if (query.trim().length > 0) {
      chips.push({ id: `q:${query}`, label: `Search: ${query.trim()}`, clear: () => setQuery('') });
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
    <Container className="py-3 lg:py-4" wide>
      <section className="rounded-md border border-border bg-surface shadow-sm lg:h-[calc(100vh-11rem)] lg:min-h-[36rem] lg:overflow-hidden">
        <header className="border-b border-border bg-surface-interactive px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel-500">Catalog Tooling</p>
              <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">Card Database</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-md border border-border bg-steel-100/80 p-1">
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

              <Button className="lg:hidden" onClick={openMobileFilters} size="sm" variant="secondary">
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                Filters {activeChips.length > 0 ? `(${activeChips.length})` : ''}
              </Button>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-steel-600">
            <p>{filtered.length} cards matched</p>
            <p className="hidden font-medium lg:block">{isFetching ? 'Refreshing...' : 'Reference card view enabled'}</p>
          </div>
        </header>

        <div className="grid gap-3 p-3 lg:h-[calc(100%-4.5rem)] lg:min-h-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-2">
          <aside className="hidden min-h-0 rounded-md border border-border bg-surface-muted/80 lg:flex lg:flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              {activeChips.length > 0 ? (
                <button className="text-[11px] font-semibold uppercase tracking-wide text-steel-600 hover:text-foreground" onClick={clearAll}>
                  Reset
                </button>
              ) : null}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Search
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
                  <input
                    className={cn(inputClassName, 'pl-8')}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, ID, text"
                    value={query}
                  />
                </div>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Color
                <select className={selectClassName} onChange={(event) => setColor(event.target.value as CardColor | 'All')} value={color}>
                  {colorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Type
                <select className={selectClassName} onChange={(event) => setType(event.target.value as CardType | 'All')} value={type}>
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Set
                <select className={selectClassName} onChange={(event) => setSetCode(event.target.value)} value={setCode}>
                  <option value="All">All</option>
                  {allSets.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              {activeChips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeChips.map((chip) => (
                    <button
                      className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-interactive px-2 py-0.5 text-[10px] font-semibold text-steel-700 transition-colors hover:border-accent hover:text-accent"
                      key={chip.id}
                      onClick={chip.clear}
                    >
                      {chip.label}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="min-h-0 rounded-md border border-border bg-surface lg:flex lg:flex-col">
            <div className="border-b border-border px-3 py-2 lg:hidden">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
                <input
                  className={cn(inputClassName, 'pl-8')}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cards"
                  value={query}
                />
              </div>
            </div>

            <div className="max-h-[64vh] overflow-y-auto p-2 lg:max-h-none lg:flex-1">
              {filtered.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-steel-600">
                  No cards match the active filters.
                </p>
              ) : (
                <ul className={view === 'grid' ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid gap-2 md:grid-cols-2 xl:grid-cols-3'} role="list">
                  {filtered.slice(0, view === 'grid' ? 200 : 140).map((card) => (
                    <li key={card.id}>
                      <ReferenceCardTile
                        card={card}
                        onOpen={() => setInspectCardId(card.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </section>

      {mobileFiltersOpen ? (
        <>
          <button
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-md border border-border bg-surface p-4 shadow-2xl lg:hidden">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="mt-3 space-y-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Search
                <input
                  className={inputClassName}
                  onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
                  placeholder="Card name, ID, text"
                  value={draft.query}
                />
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Color
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value as CardColor | 'All' }))}
                  value={draft.color}
                >
                  {colorOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Type
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as CardType | 'All' }))}
                  value={draft.type}
                >
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Set
                <select
                  className={selectClassName}
                  onChange={(event) => setDraft((current) => ({ ...current, setCode: event.target.value }))}
                  value={draft.setCode}
                >
                  <option value="All">All</option>
                  {allSets.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
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

      <ReferenceCardDetailModal
        card={inspectCard ?? null}
        onOpenChange={(open) => !open && setInspectCardId(null)}
        open={Boolean(inspectCard)}
        qty={0}
      />
    </Container>
  );
}
