'use client';

import * as React from 'react';
import { LayoutGrid, SlidersHorizontal, Table2, AlignLeft, Search, Plus, Minus } from 'lucide-react';
import { DeckHeader } from '@/components/deck/DeckHeader';
import { DeckToolbar, type DeckToolbarViewOption } from '@/components/deck/DeckToolbar';
import { DeckListRenderer } from '@/components/deck/DeckListRenderer';
import { CardViewerModal } from '@/components/deck/CardViewerModal';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';
import {
  toDeckViewItem,
  applyDeckFilterSort,
  buildDeckExportText,
  type DeckViewItem,
  type DeckDensity,
  type DeckSortKey,
  type DeckViewMode,
} from '@/lib/deck/sortFilter';
import { getStoredDeck, updateDeckEntries } from '@/lib/deck/storage';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { ImportResultsSummary } from './ImportResultsSummary';
import type { CardMatchResult } from './cardMatching';
import { validateDeck } from '@gundam-forge/shared';
import type { CardDefinition, CardType } from '@gundam-forge/shared';

// ---------- types ----------

export interface ForgeCard {
  id: string;
  name: string;
  color: string;
  type: string;
  cost: number;
  set: string;
  text?: string;
  imageUrl?: string;
  placeholderArt?: string;
}

interface ForgeWorkbenchProps {
  cards: ForgeCard[];
  deckId?: string | null;
  initialDeck?: {
    id: string;
    name: string;
    description: string;
    archetype: string;
    owner: string;
    colors: string[];
    entries: { cardId: string; qty: number }[];
  } | null;
}

// ---------- archetype card filter presets ----------

const ARCHETYPE_PRESETS: Record<string, { types?: CardType[]; maxCost?: number; minCost?: number }> = {
  Aggro:    { types: ['Unit'],              maxCost: 2 },
  Midrange: { types: ['Unit', 'Pilot'],     minCost: 2, maxCost: 4 },
  Control:  { types: ['Command', 'Pilot'],  minCost: 3 },
  Combo:    { types: ['Pilot', 'Command'] },
  Ramp:     { types: ['Resource', 'Unit'], maxCost: 1 },
};

// ---------- view registry ----------

const VIEW_REGISTRY: DeckToolbarViewOption[] = [
  { id: 'stacks', label: 'Stacks', icon: SlidersHorizontal },
  { id: 'image',  label: 'Grid',   icon: LayoutGrid },
  { id: 'text',   label: 'Text',   icon: AlignLeft },
  { id: 'table',  label: 'Table',  icon: Table2 },
];

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

// ---------- card catalog sidebar ----------

interface CardCatalogPanelProps {
  cards: ForgeCard[];
  deck: Record<string, number>;
  archetype: string;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function CardCatalogPanel({ cards, deck, archetype, onAdd, onRemove }: CardCatalogPanelProps) {
  const [query, setQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('All');
  const [usePreset, setUsePreset] = React.useState(!!archetype);

  const preset = usePreset && archetype ? ARCHETYPE_PRESETS[archetype] : null;

  const visibleCards = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return cards.filter((card) => {
      if (q && !`${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (preset) {
        if (preset.types && !(preset.types as string[]).includes(card.type)) return false;
        if (preset.maxCost !== undefined && card.cost > preset.maxCost) return false;
        if (preset.minCost !== undefined && card.cost < preset.minCost) return false;
      }
      return true;
    });
  }, [cards, query, typeFilter, preset]);

  return (
    <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface overflow-hidden">
      <div className="border-b border-border px-3 py-3 space-y-2 flex-shrink-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-cobalt-300">Card Catalog</p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
          <input
            className="h-8 w-full rounded border border-border bg-surface-interactive pl-7 pr-2 text-xs text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/20"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards…"
            type="text"
            value={query}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {CARD_TYPES.map((t) => (
            <button
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
                typeFilter === t
                  ? 'bg-cobalt-600 text-white'
                  : 'bg-surface-interactive text-steel-600 hover:text-foreground',
              )}
              key={t}
              onClick={() => setTypeFilter(t)}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>

        {archetype && ARCHETYPE_PRESETS[archetype] && (
          <button
            className={cn(
              'w-full rounded border px-2 py-1 text-[11px] font-semibold transition-colors text-left',
              usePreset
                ? 'border-cobalt-400/60 bg-cobalt-600/20 text-cobalt-300'
                : 'border-border bg-surface-interactive text-steel-600 hover:text-foreground',
            )}
            onClick={() => setUsePreset((v) => !v)}
            type="button"
          >
            {usePreset ? '✓ ' : ''}
            {archetype} preset filter
          </button>
        )}
      </div>

      <p className="px-3 py-1.5 text-[10px] text-steel-600 border-b border-border flex-shrink-0">
        {visibleCards.length} card{visibleCards.length !== 1 ? 's' : ''}
      </p>

      <div className="flex-1 overflow-y-auto">
        {visibleCards.map((card) => {
          const qty = deck[card.id] ?? 0;
          const atMax = qty >= 4;
          return (
            <div
              className="flex items-center gap-2 border-b border-border/50 px-3 py-1.5 hover:bg-surface-interactive"
              key={card.id}
            >
              <div className="relative h-10 w-7 flex-shrink-0 overflow-hidden rounded border border-border bg-black">
                <CardArtImage
                  card={{ id: card.id, name: card.name, imageUrl: card.imageUrl, placeholderArt: card.placeholderArt }}
                  className="h-full w-full object-cover"
                  fill
                  sizes="28px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-foreground">{card.name}</p>
                <p className="truncate text-[10px] text-steel-600">
                  {card.type} · Cost {card.cost}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {qty > 0 && (
                  <button
                    aria-label={`Remove ${card.name}`}
                    className="flex h-6 w-6 items-center justify-center rounded border border-border bg-surface-interactive text-steel-600 hover:text-foreground transition-colors"
                    onClick={() => onRemove(card.id)}
                    type="button"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                )}
                {qty > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-cobalt-300 w-4 text-center">
                    {qty}
                  </span>
                )}
                <button
                  aria-label={`Add ${card.name}`}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded border text-white transition-colors',
                    atMax
                      ? 'cursor-not-allowed opacity-40 border-cobalt-800 bg-cobalt-800'
                      : 'border-cobalt-500 bg-cobalt-600 hover:bg-cobalt-500',
                  )}
                  disabled={atMax}
                  onClick={() => !atMax && onAdd(card.id)}
                  type="button"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
        {visibleCards.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-steel-600">No cards match your filters.</p>
        )}
      </div>
    </aside>
  );
}

// ---------- validation bar ----------

interface ValidationBarProps {
  entries: { cardId: string; qty: number }[];
  allCards: CardDefinition[];
}

function ValidationBar({ entries, allCards }: ValidationBarProps) {
  const result = React.useMemo(() => validateDeck(entries, allCards), [entries, allCards]);
  const { metrics, errors, warnings, isValid } = result;

  const mainPct = Math.min((metrics.mainDeckCards / 50) * 100, 100);
  const resPct = Math.min((metrics.resourceDeckCards / 10) * 100, 100);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/80 px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-steel-600">Main:</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive">
          <div
            className={cn('h-full rounded-full transition-all', metrics.mainDeckCards === 50 ? 'bg-green-500' : 'bg-cobalt-500')}
            style={{ width: `${mainPct}%` }}
          />
        </div>
        <span className={cn('font-mono font-semibold tabular-nums', metrics.mainDeckCards === 50 ? 'text-green-400' : 'text-cobalt-300')}>
          {metrics.mainDeckCards}/50
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-steel-600">Resource:</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive">
          <div
            className={cn('h-full rounded-full transition-all', metrics.resourceDeckCards === 10 ? 'bg-green-500' : 'bg-cobalt-500')}
            style={{ width: `${resPct}%` }}
          />
        </div>
        <span className={cn('font-mono font-semibold tabular-nums', metrics.resourceDeckCards === 10 ? 'text-green-400' : 'text-cobalt-300')}>
          {metrics.resourceDeckCards}/10
        </span>
      </div>

      {errors.slice(0, 2).map((err) => (
        <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-400" key={err}>{err}</span>
      ))}
      {!errors.length && warnings.slice(0, 1).map((w) => (
        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-300" key={w}>{w}</span>
      ))}
      {isValid && (
        <span className="rounded bg-green-500/10 px-2 py-0.5 font-semibold text-green-400">✓ Valid</span>
      )}
    </div>
  );
}

// ---------- main DeckBuilderPage ----------

export function DeckBuilderPage({ cards, deckId, initialDeck }: ForgeWorkbenchProps): JSX.Element | null {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const [deckMeta, setDeckMeta] = React.useState({
    name: 'Untitled Deck',
    description: '',
    archetype: '',
    owner: 'You',
    colors: [] as string[],
  });
  const [deck, setDeck] = React.useState<Record<string, number>>({});
  const [importResults, setImportResults] = React.useState<CardMatchResult | null>(null);
  const [viewMode, setViewMode] = useLocalStorageState<DeckViewMode>('gundam-forge.forge.viewMode', 'stacks');
  const [density, setDensity] = useLocalStorageState<DeckDensity>('gundam-forge.forge.density', 'comfortable');
  const [query, setQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<DeckSortKey>('type');
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');

  React.useEffect(() => {
    let loaded = deckId ? getStoredDeck(deckId) : null;

    if (loaded) {
      setDeckMeta({ name: loaded.name, description: loaded.description, archetype: loaded.archetype, owner: 'You', colors: loaded.colors });
      const e: Record<string, number> = {};
      for (const { cardId, qty } of loaded.entries) e[cardId] = qty;
      setDeck(e);
    } else if (initialDeck) {
      setDeckMeta({ name: initialDeck.name, description: initialDeck.description, archetype: initialDeck.archetype, owner: initialDeck.owner, colors: initialDeck.colors });
      const e: Record<string, number> = {};
      for (const { cardId, qty } of initialDeck.entries) e[cardId] = qty;
      setDeck(e);
    }

    try {
      const raw = sessionStorage.getItem('gundam-forge.pendingImport');
      if (raw) { setImportResults(JSON.parse(raw)); sessionStorage.removeItem('gundam-forge.pendingImport'); }
    } catch { /* ignore */ }
  }, [deckId, initialDeck]);

  const allCards = React.useMemo(() => cards as unknown as CardDefinition[], [cards]);
  const entriesArray = React.useMemo(
    () => Object.entries(deck).map(([cardId, qty]) => ({ cardId, qty })),
    [deck],
  );

  const initialItems: DeckViewItem[] = React.useMemo(
    () => entriesArray
      .filter(({ qty }) => qty > 0)
      .map(({ cardId, qty }) => {
        const card = allCards.find((c) => c.id === cardId);
        return card ? toDeckViewItem({ cardId, qty, card }) : null;
      })
      .filter((i): i is DeckViewItem => i !== null),
    [entriesArray, allCards],
  );

  const visibleCards = React.useMemo(
    () => applyDeckFilterSort(initialItems, { query, sortBy }),
    [initialItems, query, sortBy],
  );

  React.useEffect(() => {
    if (activeCardId && !visibleCards.some((c) => c.id === activeCardId)) setActiveCardId(null);
  }, [activeCardId, visibleCards]);

  const persistEntries = React.useCallback((next: Record<string, number>) => {
    if (deckId) updateDeckEntries(deckId, Object.entries(next).map(([k, v]) => ({ cardId: k, qty: v })));
  }, [deckId]);

  const handleAdd = React.useCallback((cardId: string) => {
    setDeck((prev) => {
      const next = { ...prev, [cardId]: Math.min((prev[cardId] ?? 0) + 1, 4) };
      persistEntries(next);
      return next;
    });
  }, [persistEntries]);

  const handleRemove = React.useCallback((cardId: string) => {
    setDeck((prev) => {
      const next = { ...prev };
      const qty = (next[cardId] ?? 1) - 1;
      if (qty <= 0) delete next[cardId]; else next[cardId] = qty;
      persistEntries(next);
      return next;
    });
  }, [persistEntries]);

  const handleResolveAmbiguous = React.useCallback((originalLine: string, cardId: string, qty: number) => {
    for (let i = 0; i < qty; i++) handleAdd(cardId);
    setImportResults((prev) => prev ? { ...prev, ambiguous: prev.ambiguous.filter((a) => a.entry.originalLine !== originalLine) } : null);
  }, [handleAdd]);

  const handleRetryUnmatched = React.useCallback((originalLine: string, cardId: string, qty: number) => {
    for (let i = 0; i < qty; i++) handleAdd(cardId);
    setImportResults((prev) => prev ? { ...prev, unmatched: prev.unmatched.filter((e) => e.originalLine !== originalLine) } : null);
  }, [handleAdd]);

  const handleExport = React.useCallback(async () => {
    try { await navigator.clipboard.writeText(buildDeckExportText(initialItems)); setFeedback('Deck list copied.'); }
    catch { setFeedback('Unable to copy.'); }
    setTimeout(() => setFeedback(''), 1800);
  }, [initialItems]);

  const handleShare = React.useCallback(async () => {
    try {
      const url = window.location.href;
      if (navigator.share) { await navigator.share({ title: deckMeta.name, url }); setFeedback('Link shared.'); }
      else { await navigator.clipboard.writeText(url); setFeedback('Link copied.'); }
    } catch { setFeedback('Unable to share.'); }
    setTimeout(() => setFeedback(''), 1800);
  }, [deckMeta.name]);

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Card catalog sidebar */}
      <CardCatalogPanel
        archetype={deckMeta.archetype}
        cards={cards}
        deck={deck}
        onAdd={handleAdd}
        onRemove={handleRemove}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DeckHeader
          archetype={deckMeta.archetype}
          colors={deckMeta.colors}
          description={deckMeta.description}
          feedback={feedback}
          mode="builder"
          name={deckMeta.name}
          onExport={handleExport}
          onShare={handleShare}
          owner={deckMeta.owner}
          totalCards={initialItems.reduce((s, i) => s + i.qty, 0)}
        />

        <ValidationBar entries={entriesArray} allCards={allCards} />

        <DeckToolbar
          density={density}
          onDensityChange={setDensity}
          onQueryChange={setQuery}
          onSortByChange={setSortBy}
          onViewModeChange={setViewMode}
          query={query}
          sortBy={sortBy}
          viewMode={viewMode}
          views={VIEW_REGISTRY}
        />

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {importResults && (
            <ImportResultsSummary
              cards={cards}
              onDismiss={() => setImportResults(null)}
              onResolveAmbiguous={handleResolveAmbiguous}
              onRetryUnmatched={handleRetryUnmatched}
              results={importResults}
            />
          )}

          <section aria-live="polite" className="space-y-3 pb-4">
            {visibleCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-steel-600 mb-1">Your deck is empty.</p>
                <p className="text-xs text-steel-700">Use the card catalog on the left to add cards.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-steel-600">{visibleCards.length} cards shown</p>
                <DeckListRenderer
                  actions={{ onOpenCard: setActiveCardId, onAdd: handleAdd, onRemove: handleRemove }}
                  items={visibleCards}
                  selection={{ activeCardId }}
                  ui={{ density, features: { collection: false, deckEdit: true }, mode: 'builder' }}
                  viewMode={viewMode}
                />
              </>
            )}
          </section>
        </div>
      </div>

      <CardViewerModal
        activeCardId={activeCardId}
        items={visibleCards}
        onOpenChange={(open) => { if (!open) setActiveCardId(null); }}
        onSelectCard={setActiveCardId}
      />
    </div>
  );
}
