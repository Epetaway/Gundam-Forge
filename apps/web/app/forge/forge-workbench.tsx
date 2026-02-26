'use client';

import * as React from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { validateDeck, type CardColor, type CardDefinition, type CardType } from '@gundam-forge/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'gundam-forge-next-deck';
const STORAGE_NAME_KEY = 'gundam-forge-next-deck-name';
const DECK_MAX = 50;

const colorFilters: Array<'All' | CardColor> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const typeFilters: Array<'All' | CardType> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const typeOrder: CardType[] = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'];

const colorSwatches: Record<CardColor, string> = {
  Blue: '#3b82f6',
  Green: '#22c55e',
  Red: '#ef4444',
  White: '#cbd5e1',
  Purple: '#a855f7',
  Colorless: '#6b7280',
};

const inputClassName =
  'h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';
const selectClassName =
  'h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20';

type CatalogView = 'grid' | 'compact';

export type ForgeCard = Pick<
  CardDefinition,
  'id' | 'name' | 'color' | 'type' | 'cost' | 'set' | 'text' | 'imageUrl' | 'placeholderArt'
>;

interface ForgeWorkbenchProps {
  cards: ForgeCard[];
}

interface ActiveFilterChip {
  id: string;
  label: string;
  clear: () => void;
}

interface FilterDraft {
  query: string;
  color: 'All' | CardColor;
  type: 'All' | CardType;
  setCode: string;
}

interface DeckGroup {
  key: string;
  label: string;
  total: number;
  entries: Array<{
    cardId: string;
    qty: number;
    card: ForgeCard;
  }>;
}

export function ForgeWorkbench({ cards }: ForgeWorkbenchProps): JSX.Element {
  const visibleCards = React.useMemo(
    () => cards.filter((card) => typeof card.imageUrl === 'string' && card.imageUrl.startsWith('/card_art/')),
    [cards],
  );

  const [deckName, setDeckName] = React.useState('Untitled Deck');
  const [query, setQuery] = React.useState('');
  const [color, setColor] = React.useState<'All' | CardColor>('All');
  const [type, setType] = React.useState<'All' | CardType>('All');
  const [setCode, setSetCode] = React.useState('All');
  const [catalogView, setCatalogView] = React.useState<CatalogView>('compact');
  const [deck, setDeck] = React.useState<Record<string, number>>({});
  const [inspectCardId, setInspectCardId] = React.useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = React.useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [quickAddQuery, setQuickAddQuery] = React.useState('');
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [draft, setDraft] = React.useState<FilterDraft>({
    query: '',
    color: 'All',
    type: 'All',
    setCode: 'All',
  });

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const setOptions = React.useMemo(
    () => ['All', ...Array.from(new Set(visibleCards.map((card) => card.set))).sort()],
    [visibleCards],
  );

  React.useEffect(() => {
    try {
      const rawDeck = localStorage.getItem(STORAGE_KEY);
      const rawName = localStorage.getItem(STORAGE_NAME_KEY);

      if (rawDeck) {
        const parsed = JSON.parse(rawDeck) as Record<string, number>;
        setDeck(parsed);
      }

      if (rawName && rawName.trim().length > 0) {
        setDeckName(rawName.trim());
      }
    } catch {
      setDeck({});
      setDeckName('Untitled Deck');
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // Ignore writes in constrained browser modes.
    }
  }, [deck]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NAME_KEY, deckName.trim() || 'Untitled Deck');
    } catch {
      // Ignore writes in constrained browser modes.
    }
  }, [deckName]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        Boolean(target?.isContentEditable);

      if (
        event.key === '/' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === 'Escape' && mobileFiltersOpen) {
        event.preventDefault();
        setMobileFiltersOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileFiltersOpen]);

  const cardMap = React.useMemo(() => new Map(visibleCards.map((card) => [card.id, card])), [visibleCards]);

  const filteredCards = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleCards.filter((card) => {
      if (color !== 'All' && card.color !== color) return false;
      if (type !== 'All' && card.type !== type) return false;
      if (setCode !== 'All' && card.set !== setCode) return false;
      if (!normalizedQuery) return true;
      return `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase().includes(normalizedQuery);
    });
  }, [color, query, setCode, type, visibleCards]);

  const quickAddMatches = React.useMemo(() => {
    const normalized = quickAddQuery.trim().toLowerCase();
    if (!normalized) return [];

    return visibleCards
      .filter((card) => `${card.id} ${card.name}`.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [quickAddQuery, visibleCards]);

  const quickAddPrimary = quickAddMatches[0];

  const deckEntries = React.useMemo(
    () => Object.entries(deck).filter((entry) => entry[1] > 0).map(([cardId, qty]) => ({ cardId, qty })),
    [deck],
  );

  const resolvedDeck = React.useMemo(
    () =>
      deckEntries
        .map((entry) => ({ ...entry, card: cardMap.get(entry.cardId) }))
        .filter((entry): entry is { cardId: string; qty: number; card: ForgeCard } => Boolean(entry.card))
        .sort((a, b) => {
          const typeDelta = typeOrder.indexOf(a.card.type) - typeOrder.indexOf(b.card.type);
          if (typeDelta !== 0) return typeDelta;
          const costDelta = a.card.cost - b.card.cost;
          if (costDelta !== 0) return costDelta;
          return a.card.name.localeCompare(b.card.name);
        }),
    [cardMap, deckEntries],
  );

  const validation = React.useMemo(
    () => validateDeck(deckEntries, visibleCards as CardDefinition[]),
    [deckEntries, visibleCards],
  );

  const deckGroups = React.useMemo<DeckGroup[]>(() => {
    const grouped = new Map<string, DeckGroup>();

    for (const cardType of typeOrder) {
      grouped.set(cardType, {
        key: cardType,
        label: cardType,
        total: 0,
        entries: [],
      });
    }

    for (const entry of resolvedDeck) {
      const group = grouped.get(entry.card.type) ?? grouped.get('Unit');
      if (!group) continue;
      group.total += entry.qty;
      group.entries.push(entry);
    }

    return Array.from(grouped.values()).filter((group) => group.entries.length > 0);
  }, [resolvedDeck]);

  const inspectCard = inspectCardId ? cardMap.get(inspectCardId) : undefined;
  const totalCards = validation.metrics.totalCards;

  const totalDeckCost = React.useMemo(
    () => resolvedDeck.reduce((sum, entry) => sum + entry.card.cost * entry.qty, 0),
    [resolvedDeck],
  );

  const avgCost = totalCards > 0 ? totalDeckCost / totalCards : 0;

  const deckColors = React.useMemo(() => {
    const counts: Record<CardColor, number> = {
      Blue: 0,
      Green: 0,
      Red: 0,
      White: 0,
      Purple: 0,
      Colorless: 0,
    };

    for (const entry of resolvedDeck) {
      counts[entry.card.color] += entry.qty;
    }

    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1]) as Array<[CardColor, number]>;
  }, [resolvedDeck]);

  const addCard = React.useCallback((cardId: string): void => {
    setDeck((current) => ({ ...current, [cardId]: Math.min((current[cardId] ?? 0) + 1, 4) }));
  }, []);

  const removeCard = React.useCallback((cardId: string): void => {
    setDeck((current) => {
      const next = { ...current };
      const qty = (next[cardId] ?? 0) - 1;
      if (qty <= 0) delete next[cardId];
      else next[cardId] = qty;
      return next;
    });
  }, []);

  const clearDeck = (): void => setDeck({});

  const quickAddCard = (): void => {
    if (!quickAddPrimary) return;
    addCard(quickAddPrimary.id);
    setQuickAddQuery('');
  };

  const exportDeck = React.useCallback(
    async (format: 'text' | 'csv' | 'json') => {
      const rows = resolvedDeck.map((entry) => ({
        qty: entry.qty,
        id: entry.card.id,
        name: entry.card.name,
        type: entry.card.type,
        color: entry.card.color,
      }));

      const payload =
        format === 'json'
          ? JSON.stringify(rows, null, 2)
          : format === 'csv'
            ? ['Qty,ID,Name,Type,Color', ...rows.map((row) => `${row.qty},${row.id},"${row.name}",${row.type},${row.color}`)].join('\n')
            : rows.map((row) => `${row.qty}x ${row.name} (${row.id})`).join('\n');

      try {
        await navigator.clipboard.writeText(payload);
        setCopyFeedback(`Copied ${format.toUpperCase()} to clipboard`);
        window.setTimeout(() => setCopyFeedback(''), 1600);
      } catch {
        setCopyFeedback('Clipboard unavailable');
      }
    },
    [resolvedDeck],
  );

  const activeFilterChips = React.useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      chips.push({ id: `q:${trimmed}`, label: `Search: ${trimmed}`, clear: () => setQuery('') });
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

  const openMobileFilters = () => {
    setDraft({ query, color, type, setCode });
    setMobileFiltersOpen(true);
  };

  const applyMobileFilters = () => {
    setQuery(draft.query);
    setColor(draft.color);
    setType(draft.type);
    setSetCode(draft.setCode);
    setMobileFiltersOpen(false);
  };

  const clearAllFilters = () => {
    setQuery('');
    setColor('All');
    setType('All');
    setSetCode('All');
  };

  const toggleGroup = (groupKey: string): void => {
    setCollapsedGroups((current) => ({ ...current, [groupKey]: !current[groupKey] }));
  };

  return (
    <>
      <section className="rounded-xl border border-border bg-surface shadow-sm lg:h-[calc(100vh-11rem)] lg:min-h-[38rem] lg:overflow-hidden">
        <header className="border-b border-border bg-steel-50/80 px-3 py-2">
          <div className="flex flex-wrap items-end gap-2">
            <label className="grid min-w-[12rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600 lg:max-w-[22rem]">
              Deck Name
              <input
                className={inputClassName}
                maxLength={80}
                onChange={(event) => setDeckName(event.target.value)}
                value={deckName}
              />
            </label>

            <div className="grid min-w-[14rem] flex-1 gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600 lg:max-w-[26rem]">
              Quick Add
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
                  <input
                    className={cn(inputClassName, 'pl-7')}
                    onChange={(event) => setQuickAddQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        quickAddCard();
                      }
                    }}
                    placeholder="Type card name, press Enter"
                    value={quickAddQuery}
                  />
                </div>
                <Button disabled={!quickAddPrimary} onClick={quickAddCard} size="sm" variant="secondary">
                  Add
                </Button>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary">Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => exportDeck('text')}>Plain Text</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => exportDeck('csv')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => exportDeck('json')}>JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={clearDeck} size="sm" variant="ghost">
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-steel-600">
            <span className="font-medium">Shortcut: `/` search catalog • `Enter` quick add • `Esc` close drawer</span>
            {quickAddPrimary ? <span>Enter adds: {quickAddPrimary.name}</span> : null}
            {copyFeedback ? (
              <span className="inline-flex items-center gap-1 text-success">
                <Copy className="h-3.5 w-3.5" />
                {copyFeedback}
              </span>
            ) : null}
          </div>
        </header>

        <div className="grid gap-3 p-3 lg:h-[calc(100%-5.75rem)] lg:min-h-0 lg:grid-cols-[16rem_minmax(0,1fr)_23rem] lg:gap-2">
          <aside className="hidden min-h-0 rounded-lg border border-border bg-surface-muted/35 lg:flex lg:flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4 text-steel-500" />
                Filters
              </h2>
              {activeFilterChips.length > 0 ? (
                <button className="text-[11px] font-semibold uppercase tracking-wide text-steel-600 hover:text-foreground" onClick={clearAllFilters}>
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
                    className={cn(inputClassName, 'pl-7')}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, ID, text"
                    ref={searchInputRef}
                    value={query}
                  />
                </div>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Color
                <select
                  className={selectClassName}
                  onChange={(event) => setColor(event.target.value as CardColor | 'All')}
                  value={color}
                >
                  {colorFilters.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Type
                <select
                  className={selectClassName}
                  onChange={(event) => setType(event.target.value as CardType | 'All')}
                  value={type}
                >
                  {typeFilters.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-steel-600">
                Set
                <select
                  className={selectClassName}
                  onChange={(event) => setSetCode(event.target.value)}
                  value={setCode}
                >
                  {setOptions.map((option) => (
                    <option key={option} value={option}>{option === 'All' ? 'All Sets' : option}</option>
                  ))}
                </select>
              </label>

              <div className="rounded-md border border-border bg-surface px-2.5 py-2 text-xs text-steel-600">
                <p>{filteredCards.length} cards matched</p>
                <p>{Object.keys(deck).length} unique cards in deck</p>
              </div>

              {activeFilterChips.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeFilterChips.map((chip) => (
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-steel-100 px-2 py-0.5 text-[10px] font-semibold text-steel-700 transition-colors hover:border-accent hover:text-accent"
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

          <section className="min-h-0 rounded-lg border border-border bg-surface lg:flex lg:flex-col">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 className="text-sm font-semibold text-foreground">Card Catalog</h2>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded-md border border-border bg-steel-100/80 p-1">
                  <button
                    aria-label="Grid view"
                    className={cn(
                      'rounded px-2 py-1 text-xs font-semibold transition-colors',
                      catalogView === 'grid' ? 'bg-surface text-foreground shadow-sm' : 'text-steel-600 hover:text-foreground',
                    )}
                    onClick={() => setCatalogView('grid')}
                    type="button"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Compact list view"
                    className={cn(
                      'rounded px-2 py-1 text-xs font-semibold transition-colors',
                      catalogView === 'compact' ? 'bg-surface text-foreground shadow-sm' : 'text-steel-600 hover:text-foreground',
                    )}
                    onClick={() => setCatalogView('compact')}
                    type="button"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button className="lg:hidden" onClick={openMobileFilters} size="sm" variant="secondary">
                  <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                  Filters {activeFilterChips.length > 0 ? `(${activeFilterChips.length})` : ''}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-steel-600">
              <p>{filteredCards.length} cards</p>
              {activeFilterChips.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5 lg:hidden">
                  {activeFilterChips.slice(0, 2).map((chip) => (
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-steel-100 px-2 py-0.5 text-[10px] font-semibold"
                      key={chip.id}
                      onClick={chip.clear}
                    >
                      {chip.label}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-medium">Density mode for fast decking</p>
              )}
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-2 lg:max-h-none lg:flex-1">
              {filteredCards.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-steel-600">
                  No cards match the active filters.
                </p>
              ) : catalogView === 'compact' ? (
                <ul className="divide-y divide-border" role="list">
                  {filteredCards.slice(0, 360).map((card) => {
                    const qty = deck[card.id] ?? 0;
                    return (
                      <li className="px-1.5 py-1" key={card.id}>
                        <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-steel-50">
                          <button
                            className="relative h-11 w-8 overflow-hidden rounded border border-border"
                            onClick={() => setInspectCardId(card.id)}
                            type="button"
                          >
                            <CardArtImage card={card} className="h-full w-full object-cover" fill sizes="32px" />
                          </button>

                          <button className="min-w-0 text-left" onClick={() => setInspectCardId(card.id)} type="button">
                            <p className="truncate text-sm font-semibold text-foreground">{card.name}</p>
                            <p className="truncate text-[11px] text-steel-600">
                              {card.id} • {card.type} • {card.color} • Cost {card.cost}
                            </p>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              aria-label={`Remove ${card.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={qty === 0}
                              onClick={() => removeCard(card.id)}
                              type="button"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-steel-700">{qty}</span>
                            <button
                              aria-label={`Add ${card.name}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100"
                              onClick={() => addCard(card.id)}
                              type="button"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="list">
                  {filteredCards.slice(0, 210).map((card) => {
                    const qty = deck[card.id] ?? 0;
                    return (
                      <li key={card.id}>
                        <div className="overflow-hidden rounded-md border border-border bg-surface">
                          <button className="relative block aspect-[5/7] w-full bg-steel-100" onClick={() => setInspectCardId(card.id)} type="button">
                            <CardArtImage
                              card={card}
                              className="h-full w-full object-cover"
                              fill
                              sizes="(max-width: 1280px) 50vw, 24vw"
                            />
                            {qty > 0 ? (
                              <span className="absolute right-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {qty}x
                              </span>
                            ) : null}
                          </button>
                          <div className="space-y-2 p-2">
                            <div className="flex items-start justify-between gap-2">
                              <button className="min-w-0 text-left" onClick={() => setInspectCardId(card.id)} type="button">
                                <p className="line-clamp-2 text-xs font-semibold text-foreground">{card.name}</p>
                                <p className="text-[10px] text-steel-600">{card.id}</p>
                              </button>
                              <Badge>{card.cost}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-steel-600">
                              <span>{card.type}</span>
                              <span>{card.color}</span>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                aria-label={`Remove ${card.name}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={qty === 0}
                                onClick={() => removeCard(card.id)}
                                type="button"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-steel-700">{qty}</span>
                              <button
                                aria-label={`Add ${card.name}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100"
                                onClick={() => addCard(card.id)}
                                type="button"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <aside className="min-h-0 rounded-lg border border-border bg-surface lg:flex lg:flex-col">
            <div className="space-y-2 border-b border-border px-3 py-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Deck Workspace</h2>
                <Badge variant={validation.isValid ? 'success' : 'warning'}>
                  {validation.isValid ? 'Valid' : `${validation.errors.length} issues`}
                </Badge>
              </div>

              <div className="rounded-md border border-border bg-steel-50 px-2.5 py-2">
                <div className="flex items-center justify-between text-xs font-semibold text-steel-700">
                  <span>{totalCards}/{DECK_MAX} cards</span>
                  <span>Avg {avgCost.toFixed(2)}</span>
                </div>
                <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-steel-200">
                  {deckColors.length === 0 ? <span className="h-full w-full bg-steel-300" /> : null}
                  {deckColors.map(([deckColor, count]) => (
                    <span
                      key={deckColor}
                      className="h-full"
                      style={{
                        width: `${(count / Math.max(totalCards, 1)) * 100}%`,
                        backgroundColor: colorSwatches[deckColor],
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-steel-600">
                <span>{validation.metrics.mainDeckCards}/50 main</span>
                <span>•</span>
                <span>{validation.metrics.resourceDeckCards}/10 resource</span>
                <span>•</span>
                <span>{resolvedDeck.length} unique</span>
              </div>
            </div>

            <div className="min-h-0 p-2 lg:flex-1">
              <Tabs className="flex h-full min-h-0 flex-col" defaultValue="deck">
                <TabsList className="h-9">
                  <TabsTrigger className="text-xs" value="deck">Deck List</TabsTrigger>
                  <TabsTrigger className="text-xs" value="validation">
                    <BarChart3 className="mr-1 h-3.5 w-3.5" />
                    Validation
                  </TabsTrigger>
                </TabsList>

                <TabsContent className="mt-2 min-h-0 flex-1 overflow-y-auto" value="deck">
                  {deckGroups.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-5 text-center text-sm text-steel-600">
                      Add cards from the catalog to build your deck.
                    </p>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {deckGroups.map((group) => {
                        const isCollapsed = collapsedGroups[group.key] ?? false;
                        return (
                          <li className="overflow-hidden rounded-md border border-border bg-steel-50/70" key={group.key}>
                            <button
                              className="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-xs font-semibold text-steel-700 transition-colors hover:bg-steel-100"
                              onClick={() => toggleGroup(group.key)}
                              type="button"
                            >
                              <span>{group.label}</span>
                              <span className="inline-flex items-center gap-1.5">
                                {group.total}
                                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </span>
                            </button>

                            {!isCollapsed ? (
                              <ul className="divide-y divide-border" role="list">
                                {group.entries.map((entry) => (
                                  <li className="flex items-center gap-2 px-2 py-1.5" key={entry.cardId}>
                                    <button
                                      className="relative h-9 w-6 flex-shrink-0 overflow-hidden rounded border border-border"
                                      onClick={() => setInspectCardId(entry.cardId)}
                                      type="button"
                                    >
                                      <CardArtImage card={entry.card} className="h-full w-full object-cover" fill sizes="24px" />
                                    </button>

                                    <button className="min-w-0 flex-1 text-left" onClick={() => setInspectCardId(entry.cardId)} type="button">
                                      <p className="truncate text-sm font-medium text-foreground">{entry.card.name}</p>
                                      <p className="text-[11px] text-steel-600">{entry.card.id} • Cost {entry.card.cost}</p>
                                    </button>

                                    <div className="flex items-center gap-1">
                                      <button
                                        aria-label={`Remove ${entry.card.name}`}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100"
                                        onClick={() => removeCard(entry.cardId)}
                                        type="button"
                                      >
                                        <Minus className="h-3.5 w-3.5" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-semibold text-steel-700">{entry.qty}</span>
                                      <button
                                        aria-label={`Add ${entry.card.name}`}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-steel-700 transition-colors hover:bg-steel-100"
                                        onClick={() => addCard(entry.cardId)}
                                        type="button"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent className="mt-2 space-y-2 overflow-y-auto" value="validation">
                  {validation.errors.length === 0 ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      No rule violations found.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {validation.errors.map((error) => (
                        <li className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" key={error}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}

                  {validation.warnings.length > 0 ? (
                    <ul className="space-y-2">
                      {validation.warnings.map((warning) => (
                        <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700" key={warning}>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </TabsContent>
              </Tabs>
            </div>
          </aside>
        </div>
      </section>

      {mobileFiltersOpen ? (
        <>
          <button
            aria-label="Close filters"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-2xl border border-border bg-surface p-4 shadow-2xl lg:hidden">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="mt-3 space-y-3">
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Search
                <input
                  className={cn(inputClassName, 'h-10')}
                  onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))}
                  placeholder="Card name, ID, text"
                  value={draft.query}
                />
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Color
                <select
                  className={cn(selectClassName, 'h-10')}
                  onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value as CardColor | 'All' }))}
                  value={draft.color}
                >
                  {colorFilters.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Type
                <select
                  className={cn(selectClassName, 'h-10')}
                  onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as CardType | 'All' }))}
                  value={draft.type}
                >
                  {typeFilters.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
                Set
                <select
                  className={cn(selectClassName, 'h-10')}
                  onChange={(event) => setDraft((current) => ({ ...current, setCode: event.target.value }))}
                  value={draft.setCode}
                >
                  {setOptions.map((option) => (
                    <option key={option} value={option}>{option === 'All' ? 'All Sets' : option}</option>
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

      <Dialog onOpenChange={(open) => !open && setInspectCardId(null)} open={Boolean(inspectCard)}>
        <DialogContent aria-describedby="forge-card-details">
          <DialogHeader>
            <DialogTitle>{inspectCard?.name}</DialogTitle>
            <DialogDescription id="forge-card-details">
              {inspectCard?.id} • {inspectCard?.color} • {inspectCard?.type} • Cost {inspectCard?.cost}
            </DialogDescription>
          </DialogHeader>

          {inspectCard ? (
            <div className="relative mx-auto aspect-[5/7] w-48 overflow-hidden rounded-md border border-border bg-steel-100">
              <CardArtImage card={inspectCard} className="h-full w-full object-cover" fill sizes="192px" />
            </div>
          ) : null}

          <p className="text-sm text-steel-700">{inspectCard?.text ?? 'No rules text for this entry.'}</p>
          <div className="flex justify-end">
            {inspectCard ? (
              <Button onClick={() => addCard(inspectCard.id)}>
                <Plus className="mr-1 h-4 w-4" />
                Add to deck
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
