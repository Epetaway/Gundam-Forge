'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Menu, Search, SlidersHorizontal, Sparkles, Tags, X, Zap } from 'lucide-react';
import type { DeckIntent, CardDefinition } from '@gundam-forge/shared';
import { sortCardsBySynergy, filterCardsByIntent, clearSynergyScoreCache } from '@gundam-forge/shared';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { UnifiedCardTile } from '@/components/cards/UnifiedCardTile';
import { ActiveFilterChips } from '@/components/filters/ActiveFilterChips';
import { cn } from '@/lib/utils/cn';
import { debounce } from '@/lib/utils/debounce';
import { analyzeDeckIntent } from '@/lib/deck/analyzeDeckIntent';
import { AdvancedSearchInput } from '@/components/search/AdvancedSearchInput';
import { filterCardsAdvanced } from '@/lib/search/advancedCardFilter';
import { getPopularEffects } from '@/lib/search/searchSuggestions';
import DeckIntentBuilder from '@/components/deck/DeckIntentBuilder';

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

const FILTER_SECTIONS = [
  { id: 'intent', label: 'Intent', icon: Sparkles },
  { id: 'keywords', label: 'Keywords', icon: Tags },
  { id: 'triggers', label: 'Triggers', icon: Zap },
  { id: 'filters', label: 'Type/Color', icon: SlidersHorizontal },
  { id: 'search', label: 'Search', icon: Search },
] as const;

type FilterSectionId = (typeof FILTER_SECTIONS)[number]['id'];

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

  const [intentEditorOpen, setIntentEditorOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<FilterSectionId>('intent');

  const deckColors = deckIntent?.colors ?? [];
  const deckClans = deckIntent?.clans ?? [];
  const mechanicsPackages = deckIntent?.packages ?? [];
  const intentIncludeEX = deckIntent?.includeEX ?? false;
  const effectiveDeckIntent: DeckIntent =
    deckIntent ?? { clans: [], colors: [], packages: [], includeEX: false };

  const [deckColorOnly, setDeckColorOnly] = useState(() => deckColors.length > 0);
  const [includeEX, setIncludeEX] = useState(intentIncludeEX);
  // ── Check if any filters are active ──────────────────────────────────────
  const hasActiveFilters = rawQuery || typeFilter !== 'All' || colorFilter !== 'All' || setFilter !== 'All' || keywordFilters.length > 0 || triggerFilters.length > 0 || effectKeywordFilters.length > 0 || deckColorOnly || includeEX;

  // ── Build active filter chips ────────────────────────────────────────────
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; value: string | string[] }[] = [];

    if (rawQuery.trim()) {
      chips.push({ id: 'query', label: 'Search', value: rawQuery.trim() });
    }
    if (typeFilter !== 'All') {
      chips.push({ id: 'type', label: 'Type', value: typeFilter });
    }
    if (colorFilter !== 'All') {
      chips.push({ id: 'color', label: 'Color', value: colorFilter });
    }
    if (setFilter !== 'All') {
      chips.push({ id: 'set', label: 'Set', value: setFilter });
    }
    if (keywordFilters.length > 0) {
      chips.push({ id: 'keywords', label: 'Keywords', value: keywordFilters });
    }
    if (triggerFilters.length > 0) {
      chips.push({ id: 'triggers', label: 'Triggers', value: triggerFilters });
    }
    if (effectKeywordFilters.length > 0) {
      chips.push({ id: 'effects', label: 'Effects', value: effectKeywordFilters });
    }
    if (deckColorOnly && deckColors.length > 0) {
      chips.push({ id: 'deckColors', label: 'Deck Colors', value: 'Only' });
    }
    if (includeEX) {
      chips.push({ id: 'includeEX', label: 'EX Cards', value: 'Include' });
    }

    return chips;
  }, [rawQuery, typeFilter, colorFilter, setFilter, keywordFilters, triggerFilters, effectKeywordFilters, deckColorOnly, includeEX, deckColors.length]);

  // ── Handle filter removal ────────────────────────────────────────────────
  const handleRemoveChip = useCallback((chipId: string) => {
    switch (chipId) {
      case 'query':
        setRawQuery('');
        debouncedSetQuery('');
        break;
      case 'type':
        setTypeFilter('All');
        break;
      case 'color':
        setColorFilter('All');
        break;
      case 'set':
        setSetFilter('All');
        break;
      case 'keywords':
        setKeywordFilters([]);
        break;
      case 'triggers':
        setTriggerFilters([]);
        break;
      case 'effects':
        setEffectKeywordFilters([]);
        break;
      case 'deckColors':
        setDeckColorOnly(false);
        break;
      case 'includeEX':
        setIncludeEX(false);
        break;
    }
  }, [debouncedSetQuery]);

  // ── Handle clear all filters ─────────────────────────────────────────────
  const handleClearAllFilters = useCallback(() => {
    setRawQuery('');
    debouncedSetQuery('');
    setTypeFilter('All');
    setColorFilter('All');
    setSetFilter('All');
    setKeywordFilters([]);
    setTriggerFilters([]);
    setEffectKeywordFilters([]);
    setDeckColorOnly(false);
    setIncludeEX(false);
  }, [debouncedSetQuery]);

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

  // ── Popular effect keywords for quick filtering (live with filters) ─────
  const popularEffects = useMemo(() => getPopularEffects(filtered, 12), [filtered]);

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
      <div className="border-b border-border" style={{ maxWidth: '100%' }}>

        {/* ── Top bar: toggle + active pill count ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => setIsFilterMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-interactive active:scale-95"
            aria-expanded={isFilterMenuOpen}
            aria-label="Toggle filters menu"
          >
            {isFilterMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            <span>{isFilterMenuOpen ? 'Close Filters' : 'Filters'}</span>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none">
            {hasActiveFilters ? (
              <>
                {rawQuery && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cobalt-500/15 px-2 py-0.5 text-[11px] text-cobalt-200">
                    &quot;{rawQuery.slice(0, 10)}{rawQuery.length > 10 ? '…' : ''}&quot;
                    <button type="button" onClick={() => { setQuery(''); setRawQuery(''); }} aria-label="Clear search" className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
                {deckColorOnly && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cobalt-500/15 px-2 py-0.5 text-[11px] text-cobalt-200">
                    Deck colors
                    <button type="button" onClick={() => setDeckColorOnly(false)} aria-label="Clear deck color filter" className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
                {[...keywordFilters, ...triggerFilters].map((f) => (
                  <span key={f} className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cobalt-500/15 px-2 py-0.5 text-[11px] text-cobalt-200">
                    {f.replace('-', ' ')}
                    <button type="button" onClick={() => {
                      setKeywordFilters((ks) => ks.filter((k) => k !== f));
                      setTriggerFilters((ts) => ts.filter((t) => t !== f));
                    }} aria-label={`Clear ${f}`} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                ))}
                {typeFilter !== 'All' && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cobalt-500/15 px-2 py-0.5 text-[11px] text-cobalt-200">
                    {typeFilter}
                    <button type="button" onClick={() => setTypeFilter('All')} aria-label="Clear type filter" className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
                {colorFilter !== 'All' && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-cobalt-500/15 px-2 py-0.5 text-[11px] text-cobalt-200">
                    {colorFilter}
                    <button type="button" onClick={() => setColorFilter('All')} aria-label="Clear color filter" className="ml-0.5 opacity-60 hover:opacity-100">×</button>
                  </span>
                )}
                <button
                  type="button"
                  className="ml-auto shrink-0 text-[11px] text-text-secondary transition-colors hover:text-foreground"
                  onClick={() => {
                    setQuery(''); setRawQuery('');
                    setTypeFilter('All'); setColorFilter('All');
                    setSetFilter(initialSetId && SETS_LIST.includes(initialSetId) ? initialSetId : 'All');
                    setKeywordFilters([]); setTriggerFilters([]);
                    setEffectKeywordFilters([]); setDeckColorOnly(false);
                    setIncludeEX(intentIncludeEX);
                  }}
                >
                  Clear all
                </button>
              </>
            ) : (
              <span className="text-[11px] text-text-secondary">No active filters</span>
            )}
          </div>
        </div>

        {/* ── Unified filter panel ── */}
        {isFilterMenuOpen && (
          <div className="border-t border-border">
            {/* Icon tab strip */}
            <nav
              aria-label="Filter sections"
              className="flex border-b border-border"
            >
              {FILTER_SECTIONS.map((section) => {
                const Icon = section.icon;
                const active = activeFilterSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveFilterSection(section.id)}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                      active
                        ? 'border-b-2 border-cobalt-400 text-cobalt-200'
                        : 'border-b-2 border-transparent text-text-secondary hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xs:block sm:block">{section.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Single content pane */}
            <div className="p-3 pt-2.5">

              {/* INTENT tab */}
              {activeFilterSection === 'intent' && (
                <div className="space-y-2.5">
                  {(deckColors.length > 0 || deckClans.length > 0) ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Deck intent</span>
                        {onIntentChange && (
                          <button
                            type="button"
                            className="text-xs text-cobalt-300 transition-colors hover:text-cobalt-100"
                            onClick={() => setIntentEditorOpen((o) => !o)}
                          >
                            {intentEditorOpen ? 'Done' : 'Edit'}
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[...deckClans, ...deckColors].map((v) => (
                          <span key={v} className="rounded-full bg-cobalt-500/14 px-2.5 py-0.5 text-xs text-cobalt-200">{v}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary">No deck intent set.</p>
                  )}

                  {onIntentChange && intentEditorOpen && (
                    <div className="space-y-2">
                      {deckAnalysis && deckAnalysis.improvements.length > 0 && (
                        <div className="space-y-1 rounded-md bg-amber-500/8 p-2">
                          <p className="text-[11px] font-semibold text-amber-400">Suggestions ({deckAnalysis.confidence}% confidence)</p>
                          {deckAnalysis.improvements.map((imp, i) => (
                            <p key={i} className="text-xs text-foreground">• {imp}</p>
                          ))}
                          {deckAnalysis.confidence >= 50 && (
                            <button
                              type="button"
                              className={cn(
                                'mt-1 w-full rounded-md px-2 py-1.5 text-xs font-semibold transition-colors',
                                deckAnalysis.confidence >= 70
                                  ? 'bg-green-600/20 text-green-300 hover:bg-green-600/30'
                                  : 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30',
                              )}
                              onClick={() => onIntentChange(deckAnalysis.suggestedIntent)}
                            >
                              {deckAnalysis.confidence >= 70 ? 'Apply strong suggestion' : 'Apply suggestion'}
                            </button>
                          )}
                        </div>
                      )}
                      <DeckIntentBuilder
                        initialIntent={effectiveDeckIntent}
                        onIntentChange={onIntentChange}
                        variant="inline"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    {deckColors.length > 0 && (
                      <button
                        type="button"
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                          deckColorOnly ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                        )}
                        onClick={() => setDeckColorOnly((v) => !v)}
                        aria-pressed={deckColorOnly}
                      >
                        {deckColorOnly ? '✓ Deck colors only' : 'Show deck colors only'}
                      </button>
                    )}
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                        includeEX ? 'bg-amber-600/20 text-amber-300' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                      )}
                      onClick={() => setIncludeEX((v) => !v)}
                      aria-pressed={includeEX}
                    >
                      {includeEX ? '✓ Include EX cards' : 'Include EX cards'}
                    </button>
                  </div>
                </div>
              )}

              {/* KEYWORDS tab */}
              {activeFilterSection === 'keywords' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Keywords</span>
                    {keywordFilters.length > 0 && (
                      <button type="button" className="text-xs text-text-secondary hover:text-foreground" onClick={() => setKeywordFilters([])}>Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['blocker', 'high-maneuver', 'first-strike', 'breach', 'support', 'repair', 'suppression'].map((kw) => {
                      const active = keywordFilters.includes(kw);
                      return (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setKeywordFilters((ks) => active ? ks.filter((k) => k !== kw) : [...ks, kw])}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            active ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                          )}
                          aria-pressed={active}
                        >
                          {kw.replace(/-/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TRIGGERS tab */}
              {activeFilterSection === 'triggers' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Triggers</span>
                    {triggerFilters.length > 0 && (
                      <button type="button" className="text-xs text-text-secondary hover:text-foreground" onClick={() => setTriggerFilters([])}>Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['burst', 'when-paired', 'during-pair', 'deploy', 'attack', 'when-linked', 'during-link'].map((tr) => {
                      const active = triggerFilters.includes(tr);
                      return (
                        <button
                          key={tr}
                          type="button"
                          onClick={() => setTriggerFilters((ts) => active ? ts.filter((t) => t !== tr) : [...ts, tr])}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            active ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                          )}
                          aria-pressed={active}
                        >
                          {tr.replace(/-/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TYPE/COLOR tab */}
              {activeFilterSection === 'filters' && (
                <div className="space-y-3">
                  <div>
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Type</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CARD_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={cn(
                            'rounded-full px-3 py-1 text-xs transition-colors',
                            typeFilter === t ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                          )}
                          onClick={() => setTypeFilter(t)}
                          aria-pressed={typeFilter === t}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Color</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={cn(
                            'rounded-full px-3 py-1 text-xs transition-colors',
                            colorFilter === c ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                          )}
                          onClick={() => setColorFilter(c)}
                          aria-pressed={colorFilter === c}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-text-secondary" htmlFor="set-filter-select">Set</label>
                    <select
                      id="set-filter-select"
                      className="w-full rounded-md bg-surface-interactive px-2.5 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500/30"
                      value={setFilter}
                      onChange={(e) => setSetFilter(e.target.value)}
                    >
                      {SETS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* SEARCH tab */}
              {activeFilterSection === 'search' && (
                <div className="space-y-2">
                  <AdvancedSearchInput
                    value={rawQuery}
                    onChange={(val) => { setRawQuery(val); debouncedSetQuery(val); }}
                    cards={allCards}
                    placeholder="Search cards, effects, factions…"
                    debounceMs={150}
                    showHelp={query.includes('|') || query.includes('-') || query.includes('"')}
                  />
                  {popularEffects.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {popularEffects.slice(0, 6).map((effect) => {
                        const active = effectKeywordFilters.includes(effect.value);
                        return (
                          <button
                            key={effect.value}
                            type="button"
                            onClick={() => setEffectKeywordFilters((prev) =>
                              prev.includes(effect.value) ? prev.filter((e) => e !== effect.value) : [...prev, effect.value]
                            )}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                              active ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-foreground hover:bg-surface-hover',
                            )}
                            aria-pressed={active}
                          >
                            {effect.label}
                            <span className={cn('rounded px-1 py-px text-[9px] leading-none', active ? 'bg-white/15' : 'bg-surface text-text-secondary')}>
                              {effect.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Results bar ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
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

      {/* ── Active filter display ── */}
      {activeFilterChips.length > 0 && (
        <div className="px-3 py-2">
          <ActiveFilterChips
            chips={activeFilterChips}
            totalCards={filtered.length}
            totalAvailable={allCards.filter((c) => !EXCLUDED_SETS.has(c.set)).length}
            onRemoveChip={handleRemoveChip}
            onClearAll={handleClearAllFilters}
          />
        </div>
      )}

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
