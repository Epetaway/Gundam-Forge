'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Lightbulb, Edit } from 'lucide-react';
import type { DeckIntent, CardDefinition, CardColor } from '@gundam-forge/shared';
import { sortCardsBySynergy, filterCardsByIntent, clearSynergyScoreCache } from '@gundam-forge/shared';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { UnifiedCardTile } from '@/components/cards/UnifiedCardTile';
import { cn } from '@/lib/utils/cn';
import { debounce } from '@/lib/utils/debounce';
import { analyzeDeckIntent } from '@/lib/deck/analyzeDeckIntent';
import { AdvancedSearchInput } from '@/components/search/AdvancedSearchInput';
import { EffectKeywordPills } from '@/components/search/EffectKeywordPills';
import { filterCardsAdvanced } from '@/lib/search/advancedCardFilter';
import { getPopularEffects } from '@/lib/search/searchSuggestions';

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
const CARD_COLORS = ['All', 'Red', 'Blue', 'Green', 'White', 'Purple', 'Colorless'];
const SETS_LIST = ['All', ...allSets.filter((s) => s !== 'Token')];

// Ordered clan list matching ClansStep.tsx
const CLAN_OPTIONS = [
  'Earth Federation', 'Zeon', 'Neo Zeon', 'AEUG', 'Titans', 'CB',
  'Gjallarhorn', 'Tekkadan', 'Earth Alliance', 'ZAFT', 'Orb', 'OZ',
  'Operation Meteor', 'Mafty', 'G Team', 'Civilian', 'Vagan', 'UE', 'Academy',
];

const TYPE_ORDER = ['Unit', 'Pilot', 'Command', 'Base'];

const EXCLUDED_SETS = new Set(['Token']);

type GroupMode = 'none' | 'clan' | 'type';

type ScoredCard = CardDefinition & { synergyScore?: number; synergyReasons?: any[] };

export interface CardSearchPanelProps {
  onSelect: (id: string) => void;
  deckIntent?: DeckIntent;
  initialSetId?: string;
  onIntentChange?: (intent: DeckIntent) => void;
  currentDeckCards?: CardDefinition[];
}

// ─── Synergy badge ───────────────────────────────────────────────────────────

function SynergyBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  const cls =
    score >= 20 ? 'bg-green-500/90 text-white' :
    score >= 8  ? 'bg-cobalt-500/90 text-white' :
                  'bg-steel-700/80 text-white';
  return (
    <span
      className={cn('absolute right-1 top-1 z-10 rounded px-1 py-0.5 text-[9px] font-bold leading-none', cls)}
      aria-label={`Synergy score ${score}`}
    >
      ★{score}
    </span>
  );
}

// ─── Hover card tooltip (portal, appears to right of panel) ──────────────────

function CardHoverTooltip({ card, anchor }: { card: ScoredCard; anchor: DOMRect }) {
  const CARD_W = 200; // Increased from 160 to 200 (25% bigger for HD)
  const GAP = 10;

  // Prefer right of panel; flip left if it would go off-screen
  const left =
    anchor.right + GAP + CARD_W > window.innerWidth
      ? anchor.left - CARD_W - GAP
      : anchor.right + GAP;

  const rawTop = anchor.top + anchor.height / 2 - 140;
  const top = Math.max(8, Math.min(rawTop, window.innerHeight - 300));

  return ReactDOM.createPortal(
    <div
      className="pointer-events-none fixed z-[300] w-[200px] overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10"
      style={{ left, top }}
    >
      <img
        src={getCardImage(card)}
        alt={card.name}
        className="w-full h-auto"
        draggable={false}
      />
    </div>,
    document.body,
  );
}

// ─── Text list table for "List" mode ─────────────────────────────────────────

function CardListTable({
  cards,
  showSynergy,
  onPreview,
  onSelect,
}: {
  cards: ScoredCard[];
  showSynergy: boolean;
  onPreview: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<{ card: ScoredCard; anchor: DOMRect } | null>(null);

  return (
    <>
      {hovered && typeof document !== 'undefined' && (
        <CardHoverTooltip card={hovered.card} anchor={hovered.anchor} />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-interactive text-[10px] uppercase tracking-wider text-foreground sticky top-0 z-10">
            <tr>
              <th className="px-3 py-1.5">Card</th>
              <th className="px-2 py-1.5 hidden sm:table-cell">Type</th>
              {showSynergy && <th className="w-10 px-2 py-1.5 text-right">Syn</th>}
              <th className="w-8 px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr
                key={card.id}
                className="group h-8 cursor-pointer border-b border-border/60 text-xs transition-colors hover:bg-surface-interactive"
                onClick={() => onPreview(card.id)}
                onMouseEnter={(e) =>
                  setHovered({ card, anchor: e.currentTarget.getBoundingClientRect() })
                }
                onMouseLeave={() => setHovered(null)}
              >
                <td className="px-3 py-1 font-medium text-foreground leading-tight">
                  {card.name}
                </td>
                <td className="px-2 py-1 hidden text-foreground sm:table-cell">{card.type}</td>
                {showSynergy && (
                  <td className="px-2 py-1 text-right font-mono text-[10px] text-cobalt-400">
                    {(card.synergyScore ?? 0) > 0 ? `★${card.synergyScore}` : ''}
                  </td>
                )}
                <td className="px-2 py-1">
                  <button
                    type="button"
                    aria-label={`Add ${card.name} to deck`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-cobalt-600/0 text-foreground transition-all group-hover:bg-cobalt-600 group-hover:text-white font-bold"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(card.id);
                    }}
                  >
                    +
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function getResponsivePageConfig(width: number) {
  if (width >= 760) return { columns: 4, rows: 2 };
  if (width >= 520) return { columns: 3, rows: 2 };
  if (width >= 380) return { columns: 2, rows: 3 };
  return { columns: 2, rows: 2 };
}

function getVisiblePageNumbers(page: number, pageCount: number) {
  const start = Math.max(0, page - 1);
  const end = Math.min(pageCount, start + 3);
  const adjustedStart = Math.max(0, end - 3);
  return Array.from({ length: end - adjustedStart }, (_, index) => adjustedStart + index);
}

// ─── Grouped section ─────────────────────────────────────────────────────────

function CardGroup({
  label,
  cards,
  showSynergy,
  defaultCollapsed = false,
  onPreview,
  onSelect,
}: {
  label: string;
  cards: ScoredCard[];
  showSynergy: boolean;
  defaultCollapsed?: boolean;
  onPreview: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hovered, setHovered] = useState<{ card: ScoredCard; anchor: DOMRect } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => setContainerWidth(element.getBoundingClientRect().width);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(() => updateWidth());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { columns, rows } = useMemo(
    () => getResponsivePageConfig(containerWidth),
    [containerWidth],
  );
  const pageSize = columns * rows;
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [cards, columns, rows]);

  useEffect(() => {
    if (page >= pageCount) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const pageCards = useMemo(() => {
    const start = page * pageSize;
    return cards.slice(start, start + pageSize);
  }, [cards, page, pageSize]);

  const pageNumbers = useMemo(
    () => getVisiblePageNumbers(page, pageCount),
    [page, pageCount],
  );
  const startIndex = cards.length === 0 ? 0 : page * pageSize + 1;
  const endIndex = Math.min(cards.length, (page + 1) * pageSize);
  const gridClassName = columns === 4 ? 'grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div ref={containerRef} className="border-b border-border last:border-b-0">
      {hovered && typeof document !== 'undefined' && (
        <CardHoverTooltip card={hovered.card} anchor={hovered.anchor} />
      )}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-interactive/40"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 flex-none text-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 flex-none text-foreground" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-foreground">{label}</span>
            <span className="block text-[10px] text-text-muted">
              {collapsed ? `${cards.length} cards` : `${startIndex}-${endIndex} of ${cards.length}`}
            </span>
          </span>
          <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground shadow-sm">
            {cards.length}
          </span>
        </button>

        {!collapsed && pageCount > 1 && (
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-steel-600 transition-colors hover:bg-surface-interactive hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={page === 0}
              aria-label={`Previous ${label} page`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-steel-600 transition-colors hover:bg-surface-interactive hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
              disabled={page >= pageCount - 1}
              aria-label={`Next ${label} page`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="border-t border-border/80 px-3 pb-3 pt-3" style={{ minWidth: 0 }}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted">
            <span>
              {columns}-column layout · {rows} row{rows !== 1 ? 's' : ''} per page
            </span>
            {pageCount > 1 ? (
              <span>
                Page {page + 1} of {pageCount}
              </span>
            ) : (
              <span>All results shown</span>
            )}
          </div>

          <div className={cn('grid gap-3', gridClassName)}>
            {pageCards.map((card) => (
              <UnifiedCardTile
                key={card.id}
                card={card}
                mode="deckbuilder"
                showSynergy={showSynergy}
                onPreview={onPreview}
                onAdd={() => onSelect(card.id)}
                onHoverChange={setHovered}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={cn(
                      'inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold transition-colors',
                      pageNumber === page
                        ? 'border-cobalt-600 bg-cobalt-600 text-white'
                        : 'border-border bg-surface text-foreground hover:bg-surface-interactive',
                    )}
                    onClick={() => setPage(pageNumber)}
                    aria-label={`${label} page ${pageNumber + 1}`}
                    aria-current={pageNumber === page ? 'page' : undefined}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-interactive disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-interactive disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
                  disabled={page >= pageCount - 1}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CardSearchPanel({ onSelect, deckIntent, initialSetId, onIntentChange, currentDeckCards }: CardSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [rawQuery, setRawQuery] = useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(debounce((val: string) => setQuery(val), 150), []);
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [setFilter, setSetFilter] = useState(() => {
    if (initialSetId && SETS_LIST.includes(initialSetId)) return initialSetId;
    return 'All';
  });
  const [keywordFilters, setKeywordFilters] = useState<string[]>([]);
  const [triggerFilters, setTriggerFilters] = useState<string[]>([]);
  const [effectKeywordFilters, setEffectKeywordFilters] = useState<string[]>([]);

  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const previewCard = previewCardId ? (allCards.find((c) => c.id === previewCardId) ?? null) : null;

  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [intentEditorOpen, setIntentEditorOpen] = useState(false);

  const deckColors = deckIntent?.colors ?? [];
  const deckClans = deckIntent?.clans ?? [];
  const mechanicsPackages = deckIntent?.packages ?? [];
  const intentIncludeEX = deckIntent?.includeEX ?? false;

  const [deckColorOnly, setDeckColorOnly] = useState(() => deckColors.length > 0);
  const [includeEX, setIncludeEX] = useState(intentIncludeEX);

  // Group mode: auto-switch to 'clan' when deck has clans, user can override
  const [groupMode, setGroupMode] = useState<GroupMode>(() =>
    deckClans.length > 0 ? 'clan' : 'none'
  );
  // Track whether user manually overrode the group mode
  const [groupModeOverridden, setGroupModeOverridden] = useState(false);

  // Clear synergy cache when deck intent changes (packages, clans, colors, or EX flag)
  useEffect(() => {
    clearSynergyScoreCache();
  }, [mechanicsPackages, deckClans, deckColors, intentIncludeEX]);

  // Auto-enable deck-color filter when deck colors first become known
  const prevDeckColorsLenRef = React.useRef(deckColors.length);
  React.useEffect(() => {
    if (prevDeckColorsLenRef.current === 0 && deckColors.length > 0) {
      setDeckColorOnly(true);
    }
    prevDeckColorsLenRef.current = deckColors.length;
  }, [deckColors]);

  // Auto-switch to clan mode when clans become known (unless user overrode)
  const prevDeckClansLenRef = React.useRef(deckClans.length);
  React.useEffect(() => {
    if (!groupModeOverridden && prevDeckClansLenRef.current === 0 && deckClans.length > 0) {
      setGroupMode('clan');
    }
    prevDeckClansLenRef.current = deckClans.length;
  }, [deckClans, groupModeOverridden]);

  React.useEffect(() => {
    if (deckIntent?.includeEX !== undefined) {
      setIncludeEX(deckIntent.includeEX);
    }
  }, [deckIntent?.includeEX]);

  const handleGroupMode = (mode: GroupMode) => {
    setGroupMode(mode);
    setGroupModeOverridden(true);
  };

  // ── Popular effect keywords for quick filtering ──────────────────────────
  const popularEffects = useMemo(() => getPopularEffects(allCards, 12), []);

  // ── Deck intent analysis ──────────────────────────────────────────────────
  const deckAnalysis = useMemo(() => {
    if (!currentDeckCards || currentDeckCards.length <= 5) return null;
    return analyzeDeckIntent(currentDeckCards, deckIntent);
  }, [currentDeckCards, deckIntent]);

  // ── Filtered + scored card list ──────────────────────────────────────────
  const filtered = useMemo<ScoredCard[]>(() => {
    const q = query.trim().toLowerCase();

    let eligible = filterCardsByIntent(
      allCards,
      deckColors.length > 0 && deckColorOnly ? deckColors : undefined,
      deckClans.length > 0 ? deckClans : undefined,
      includeEX,
      true,
    );

    eligible = eligible.filter((card) => {
      if (EXCLUDED_SETS.has(card.set)) return false;
      if (typeFilter !== 'All' && card.type !== typeFilter) return false;
      if (colorFilter !== 'All' && card.color !== colorFilter) return false;
      if (setFilter !== 'All' && card.set !== setFilter) return false;
      return true;
    });

    // Use advanced search with effect keywords, query, and existing filters
    if (q || effectKeywordFilters.length > 0 || keywordFilters.length > 0 || triggerFilters.length > 0) {
      const scored = filterCardsAdvanced(eligible, {
        query: q,
        effectKeywords: effectKeywordFilters,
        keywords: keywordFilters,
        triggers: triggerFilters,
      });
      eligible = scored.map(s => s.card);
    }

    if (mechanicsPackages.length > 0) {
      return sortCardsBySynergy(eligible, mechanicsPackages, deckClans, deckColors, includeEX);
    }

    return eligible;
  }, [query, typeFilter, colorFilter, setFilter, keywordFilters, triggerFilters, effectKeywordFilters, deckColorOnly, deckColors, includeEX, deckClans, mechanicsPackages]);

  const showSynergy = mechanicsPackages.length > 0;

  // ── Grouped results ──────────────────────────────────────────────────────
  const groupedResults = useMemo(() => {
    if (groupMode === 'none') return null;

    if (groupMode === 'clan') {
      const clansToGroup = deckClans.length > 0 ? deckClans : CLAN_OPTIONS;
      const sections: Array<{ label: string; cards: ScoredCard[]; isOther?: boolean }> = [];
      const usedIds = new Set<string>();

      for (const clan of clansToGroup) {
        const group = filtered.filter((c) => (c.clans ?? []).includes(clan));
        if (group.length > 0) {
          sections.push({ label: clan, cards: group });
          group.forEach((c) => usedIds.add(c.id));
        }
      }

      const other = filtered.filter((c) => !usedIds.has(c.id));
      if (other.length > 0) {
        sections.push({ label: 'Other Factions', cards: other, isOther: true });
      }
      return sections;
    }

    if (groupMode === 'type') {
      return TYPE_ORDER
        .map((type) => ({ label: type, cards: filtered.filter((c) => c.type === type) }))
        .filter((g) => g.cards.length > 0);
    }

    return null;
  }, [filtered, groupMode, deckClans]);

  // No longer need slides computation - using simple scrollable grid instead

  return (
    <aside
      className="w-full max-w-full flex-shrink-0 overflow-y-auto border-r border-border bg-surface-elevated"
      style={{ minWidth: 0, height: '100%' }}
      aria-label="Card search panel"
    >
      {/* ── Filters + search ─────────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-border p-3" style={{ maxWidth: '100%' }}>

        {/* Active Filters Summary */}
        {(rawQuery || typeFilter !== 'All' || colorFilter !== 'All' || setFilter !== 'All' || keywordFilters.length > 0 || triggerFilters.length > 0 || effectKeywordFilters.length > 0 || deckColorOnly || includeEX) && (
          <div className="rounded-lg border border-cobalt-500/30 bg-cobalt-900/10 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Active Filters</span>
              <button
                type="button"
                className="text-xs text-foreground hover:text-cobalt-600 transition-colors"
                onClick={() => {
                  setQuery('');
                  setRawQuery('');
                  setTypeFilter('All');
                  setColorFilter('All');
                  setSetFilter(initialSetId && SETS_LIST.includes(initialSetId) ? initialSetId : 'All');
                  setKeywordFilters([]);
                  setTriggerFilters([]);
                  setEffectKeywordFilters([]);
                  setDeckColorOnly(false);
                  setIncludeEX(intentIncludeEX);
                }}
                title="Reset all filters"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rawQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  Search: &quot;{rawQuery.slice(0, 15)}{rawQuery.length > 15 ? '…' : ''}&quot;
                  <button type="button" className="hover:text-cobalt-700 transition-colors" onClick={() => { setQuery(''); setRawQuery(''); }} aria-label="Clear search">×</button>
                </span>
              )}
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  Type: {typeFilter}
                  <button type="button" className="hover:text-cobalt-700 transition-colors" onClick={() => setTypeFilter('All')} aria-label="Clear type filter">×</button>
                </span>
              )}
              {colorFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  Color: {colorFilter}
                  <button type="button" className="hover:text-cobalt-700 transition-colors" onClick={() => setColorFilter('All')} aria-label="Clear color filter">×</button>
                </span>
              )}
              {setFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  Set: {setFilter}
                  <button type="button" className="hover:text-cobalt-700 transition-colors" onClick={() => setSetFilter('All')} aria-label="Clear set filter">×</button>
                </span>
              )}
              {keywordFilters.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-600 border border-amber-500/30">
                  {kw.replace('-', ' ')}
                  <button type="button" className="hover:text-amber-700 transition-colors" onClick={() => setKeywordFilters(keywordFilters.filter((k) => k !== kw))} aria-label={`Clear ${kw} keyword filter`}>×</button>
                </span>
              ))}
              {triggerFilters.map((tr) => (
                <span key={tr} className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-600 border border-emerald-500/30">
                  {tr.replace('-', ' ')}
                  <button type="button" className="hover:text-emerald-700 transition-colors" onClick={() => setTriggerFilters(triggerFilters.filter((t) => t !== tr))} aria-label={`Clear ${tr} trigger filter`}>×</button>
                </span>
              ))}
              {effectKeywordFilters.map((effect) => (
                <span key={effect} className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-600 border border-purple-500/30">
                  {effect.replace('_', ' ')}
                  <button type="button" className="hover:text-purple-700 transition-colors" onClick={() => setEffectKeywordFilters(effectKeywordFilters.filter((e) => e !== effect))} aria-label={`Clear ${effect} effect filter`}>×</button>
                </span>
              ))}
              {deckColorOnly && deckColors.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  Deck colors only
                  <button type="button" className="hover:text-cobalt-700 transition-colors" onClick={() => setDeckColorOnly(false)} aria-label="Disable deck colors filter">×</button>
                </span>
              )}
              {includeEX && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-600 border border-amber-500/30">
                  EX cards shown
                  <button type="button" className="hover:text-amber-700 transition-colors" onClick={() => setIncludeEX(false)} aria-label="Exclude EX cards">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Intent Summary with Clans/Colors */}
        {(deckColors.length > 0 || deckClans.length > 0) && (
          <div className="rounded-lg border border-steel-700/50 bg-steel-900/20 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Deck Intent</div>
              {onIntentChange && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-foreground hover:text-cobalt-600 transition-colors"
                  onClick={() => setIntentEditorOpen(!intentEditorOpen)}
                  title="Edit deck intent"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {deckClans.map((clan) => (
                <span key={clan} className="inline-flex items-center rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  {clan}
                </span>
              ))}
              {deckColors.map((color) => (
                <span key={color} className="inline-flex items-center rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-500 border border-cobalt-500/40">
                  {color}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Intent Editor & Suggestions */}
        {onIntentChange && intentEditorOpen && (
          <div className="rounded-lg border border-cobalt-600/50 bg-cobalt-900/20 p-3 space-y-3">
            {/* Suggestions */}
            {deckAnalysis && deckAnalysis.improvements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Suggestions (Confidence: {deckAnalysis.confidence}%)
                </div>
                <div className="space-y-1">
                  {deckAnalysis.improvements.map((imp, i) => (
                    <p key={i} className="text-xs text-foreground leading-relaxed">• {imp}</p>
                  ))}
                </div>
                {deckAnalysis.confidence >= 70 && (
                  <button
                    type="button"
                    className="w-full rounded border border-amber-600 bg-amber-600/20 px-2 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-600/30 transition-colors"
                    onClick={() => {
                      onIntentChange(deckAnalysis.suggestedIntent);
                      setIntentEditorOpen(false);
                    }}
                  >
                    Apply Suggested Intent
                  </button>
                )}
              </div>
            )}

            {/* Manual Color Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Colors</label>
              <div className="flex flex-wrap gap-1">
                {CARD_COLORS.filter(c => c !== 'All').map((color) => {
                  const active = deckColors.includes(color as CardColor);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        const newColors = active
                          ? deckColors.filter((c) => c !== color)
                          : [...deckColors, color as CardColor];
                        onIntentChange({ ...(deckIntent ?? { clans: [], colors: [], packages: [], includeEX: false }), colors: newColors as CardColor[] });
                      }}
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-cobalt-600 text-white'
                          : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                      )}
                      aria-pressed={active}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Clan Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Factions</label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {CLAN_OPTIONS.map((clan) => {
                  const active = deckClans.includes(clan);
                  return (
                    <button
                      key={clan}
                      type="button"
                      onClick={() => {
                        const newClans = active
                          ? deckClans.filter((c) => c !== clan)
                          : [...deckClans, clan];
                        onIntentChange({ ...(deckIntent ?? { clans: [], colors: [], packages: [], includeEX: false }), clans: newClans });
                      }}
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium transition-colors',
                        active
                          ? 'bg-cobalt-600 text-white'
                          : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                      )}
                      aria-pressed={active}
                    >
                      {clan}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="w-full rounded border border-steel-600 bg-surface-interactive px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-hover transition-colors"
              onClick={() => setIntentEditorOpen(false)}
            >
              Done
            </button>
          </div>
        )}

        {/* Deck-color quick filter */}
        {deckColors.length > 0 && (
          <button
            type="button"
            className={`w-full rounded border px-2 py-1 text-xs font-semibold transition-colors ${
              deckColorOnly
                ? 'border-cobalt-600 bg-cobalt-600 text-white'
                : 'border-border bg-surface-interactive text-foreground hover:bg-surface'
            }`}
            onClick={() => setDeckColorOnly((v) => !v)}
            aria-pressed={deckColorOnly}
            title="Restrict results to your deck's colors"
          >
            {deckColorOnly ? '✓ Deck colors only' : 'Show deck colors only'}
          </button>
        )}

        {/* Include EX toggle */}
        <button
          type="button"
          className={`w-full rounded border px-2 py-1 text-xs font-semibold transition-colors ${
            includeEX
              ? 'border-amber-600 bg-amber-600/20 text-amber-600'
              : 'border-border bg-surface-interactive text-foreground hover:bg-surface'
          }`}
          onClick={() => setIncludeEX((v) => !v)}
          aria-pressed={includeEX}
          title="Include EX Base and EX Resource cards in search results"
        >
          {includeEX ? '✓ EX cards shown' : 'Include EX cards'}
        </button>

        {/* Keywords Filter */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-interactive/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Keywords</span>
            {keywordFilters.length > 0 && (
              <button
                type="button"
                className="text-xs text-foreground hover:text-cobalt-600 transition-colors"
                onClick={() => setKeywordFilters([])}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {['blocker', 'high-maneuver', 'first-strike', 'breach', 'support', 'repair', 'suppression'].map((kw) => {
              const active = keywordFilters.includes(kw);
              const colorMap: Record<string, { border: string; bg: string; text: string; hoverBg: string }> = {
                'blocker': { border: 'border-red-600', bg: 'bg-red-600/20', text: 'text-red-600', hoverBg: 'hover:bg-red-600/30' },
                'high-maneuver': { border: 'border-blue-600', bg: 'bg-blue-600/20', text: 'text-blue-600', hoverBg: 'hover:bg-blue-600/30' },
                'first-strike': { border: 'border-amber-600', bg: 'bg-amber-600/20', text: 'text-amber-600', hoverBg: 'hover:bg-amber-600/30' },
                'breach': { border: 'border-purple-600', bg: 'bg-purple-600/20', text: 'text-purple-600', hoverBg: 'hover:bg-purple-600/30' },
                'support': { border: 'border-emerald-600', bg: 'bg-emerald-600/20', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-600/30' },
                'repair': { border: 'border-green-600', bg: 'bg-green-600/20', text: 'text-green-600', hoverBg: 'hover:bg-green-600/30' },
                'suppression': { border: 'border-slate-600', bg: 'bg-slate-600/20', text: 'text-slate-600', hoverBg: 'hover:bg-slate-600/30' },
              };
              const colors = colorMap[kw] || colorMap['blocker'];
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? keywordFilters.filter((k) => k !== kw)
                      : [...keywordFilters, kw];
                    setKeywordFilters(next);
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium transition-colors border',
                    active
                      ? `${colors.border} ${colors.bg.replace('/20', '')} text-white`
                      : `${colors.border} ${colors.bg} ${colors.text} ${colors.hoverBg}`,
                  )}
                  aria-pressed={active}
                >
                  {kw.replace('-', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Triggers Filter */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-interactive/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Triggers</span>
            {triggerFilters.length > 0 && (
              <button
                type="button"
                className="text-xs text-foreground hover:text-cobalt-600 transition-colors"
                onClick={() => setTriggerFilters([])}
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {['burst', 'when-paired', 'during-pair', 'deploy', 'attack', 'when-linked', 'during-link'].map((tr) => {
              const active = triggerFilters.includes(tr);
              const triggerColorMap: Record<string, { border: string; bg: string; text: string; hoverBg: string }> = {
                'burst': { border: 'border-red-600', bg: 'bg-red-600/20', text: 'text-red-600', hoverBg: 'hover:bg-red-600/30' },
                'when-paired': { border: 'border-blue-600', bg: 'bg-blue-600/20', text: 'text-blue-600', hoverBg: 'hover:bg-blue-600/30' },
                'during-pair': { border: 'border-cyan-600', bg: 'bg-cyan-600/20', text: 'text-cyan-600', hoverBg: 'hover:bg-cyan-600/30' },
                'deploy': { border: 'border-emerald-600', bg: 'bg-emerald-600/20', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-600/30' },
                'attack': { border: 'border-amber-600', bg: 'bg-amber-600/20', text: 'text-amber-600', hoverBg: 'hover:bg-amber-600/30' },
                'when-linked': { border: 'border-purple-600', bg: 'bg-purple-600/20', text: 'text-purple-600', hoverBg: 'hover:bg-purple-600/30' },
                'during-link': { border: 'border-indigo-600', bg: 'bg-indigo-600/20', text: 'text-indigo-600', hoverBg: 'hover:bg-indigo-600/30' },
              };
              const triggerColors = triggerColorMap[tr] || triggerColorMap['burst'];
              return (
                <button
                  key={tr}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? triggerFilters.filter((t) => t !== tr)
                      : [...triggerFilters, tr];
                    setTriggerFilters(next);
                  }}
                  className={cn(
                    'rounded px-2 py-0.5 text-xs font-medium transition-colors border',
                    active
                      ? `${triggerColors.border} ${triggerColors.bg.replace('/20', '')} text-white`
                      : `${triggerColors.border} ${triggerColors.bg} ${triggerColors.text} ${triggerColors.hoverBg}`,
                  )}
                  aria-pressed={active}
                >
                  {tr.replace('-', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters Collapsible Section */}
        <div className="rounded-lg border border-border bg-surface-interactive/30">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-interactive/50 transition-colors"
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            <span className="text-xs font-semibold text-foreground">
              {(() => {
                const activeCount = (typeFilter !== 'All' ? 1 : 0) +
                                   (colorFilter !== 'All' ? 1 : 0) +
                                   (setFilter !== 'All' ? 1 : 0);
                if (filtersExpanded) return 'Type · Color · Set';
                if (activeCount > 0) return `Filters (${activeCount} active)`;
                return 'Filters (Type · Color · Set)';
              })()}
            </span>
            <ChevronDown
              className={cn('w-4 h-4 text-foreground transition-transform duration-200', filtersExpanded ? 'rotate-180' : '')}
            />
          </button>

          {filtersExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              <div>
                <span className="mb-1 block text-xs text-foreground" id="type-filter-label">Type</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="type-filter-label">
                  {CARD_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${typeFilter === t ? 'border-cobalt-600 bg-cobalt-600 text-white' : 'border-border bg-surface-interactive text-foreground hover:bg-surface'}`}
                      onClick={() => setTypeFilter(t)} aria-pressed={typeFilter === t}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs text-foreground" id="color-filter-label">Color</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="color-filter-label">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c} type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${colorFilter === c ? 'border-cobalt-600 bg-cobalt-600 text-white' : 'border-border bg-surface-interactive text-foreground hover:bg-surface'}`}
                      onClick={() => setColorFilter(c)} aria-pressed={colorFilter === c}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-foreground" htmlFor="set-filter-select">Set</label>
                <select
                  id="set-filter-select"
                  className="w-full rounded border border-border bg-surface p-1 text-xs outline-none focus-visible:border-ring"
                  value={setFilter}
                  onChange={(e) => setSetFilter(e.target.value)}
                >
                  {SETS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Search (placed under filters by request) */}
        <div className="space-y-2 rounded-lg border border-border bg-surface-interactive/20 p-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Search</p>
          <AdvancedSearchInput
            value={rawQuery}
            onChange={(val) => { setRawQuery(val); debouncedSetQuery(val); }}
            cards={allCards}
            placeholder="Search cards... (try 'draw', 'Zeon', or 'deal damage')"
            debounceMs={150}
            showHelp={query.includes('|') || query.includes('-') || query.includes('"')}
          />

          {popularEffects.length > 0 && (
            <EffectKeywordPills
              effects={popularEffects}
              activeEffects={effectKeywordFilters}
              onEffectClick={(effect) => {
                setEffectKeywordFilters(prev =>
                  prev.includes(effect)
                    ? prev.filter(e => e !== effect)
                    : [...prev, effect]
                );
              }}
              maxVisible={10}
            />
          )}
        </div>

        {/* Results count + group mode toggle */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-text-secondary" aria-live="polite">
            {filtered.length} card{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex overflow-hidden rounded border border-border text-[10px] font-semibold">
            {([['none', 'List'], ['clan', 'By Clan'], ['type', 'By Type']] as [GroupMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'px-2 py-1 transition-colors',
                  groupMode === mode
                    ? 'bg-cobalt-600 text-white'
                    : 'bg-surface-interactive text-text-secondary hover:text-foreground',
                )}
                onClick={() => handleGroupMode(mode)}
                aria-pressed={groupMode === mode}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card results ─────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden"
        style={{ minWidth: 0 }}
        aria-label="Card results"
      >
        {filtered.length === 0 ? (
                <p className="p-4 text-center text-xs text-foreground">No cards match your filters.</p>
        ) : groupedResults ? (
          /* Grouped view */
          <div>
            {groupedResults.map((group) => (
              <CardGroup
                key={group.label}
                label={group.label}
                cards={group.cards}
                showSynergy={showSynergy}
                defaultCollapsed={(group as any).isOther === true}
                onPreview={setPreviewCardId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          /* Text list (List mode) */
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)', minHeight: '300px' }}>
            <CardListTable
              cards={filtered}
              showSynergy={showSynergy}
              onPreview={setPreviewCardId}
              onSelect={onSelect}
            />
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={previewCard}
        open={previewCardId !== null}
        onOpenChange={(open) => { if (!open) setPreviewCardId(null); }}
        context="deckbuilder"
        allCards={filtered}
        onSelectCard={(cardId) => setPreviewCardId(cardId)}
        onAdd={() => {
          if (previewCard) {
            onSelect(previewCard.id);
            setPreviewCardId(null);
          }
        }}
      />
    </aside>
  );
}
