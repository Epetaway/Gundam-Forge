'use client';

import React, { useState, useMemo, useCallback } from 'react';
import * as ReactDOM from 'react-dom';
import { ChevronDown, ChevronRight, Lightbulb, Edit } from 'lucide-react';
import type { DeckIntent, CardDefinition, CardColor } from '@gundam-forge/shared';
import { sortCardsBySynergy, filterCardsByIntent } from '@gundam-forge/shared';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { cn } from '@/lib/utils/cn';
import { debounce } from '@/lib/utils/debounce';
import { analyzeDeckIntent } from '@/lib/deck/analyzeDeckIntent';

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
          <thead className="border-b border-border bg-surface-interactive text-[10px] uppercase tracking-wider text-white">
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
                <td className="px-2 py-1 hidden text-white sm:table-cell">{card.type}</td>
                {showSynergy && (
                  <td className="px-2 py-1 text-right font-mono text-[10px] text-cobalt-400">
                    {(card.synergyScore ?? 0) > 0 ? `★${card.synergyScore}` : ''}
                  </td>
                )}
                <td className="px-2 py-1">
                  <button
                    type="button"
                    aria-label={`Add ${card.name} to deck`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-cobalt-600/0 text-white transition-all group-hover:bg-cobalt-600 group-hover:text-white"
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

// ─── Single card tile ─────────────────────────────────────────────────────────

function CardTile({
  card,
  showSynergy,
  onPreview,
  onSelect,
  onHoverChange,
}: {
  card: ScoredCard;
  showSynergy: boolean;
  onPreview: (id: string) => void;
  onSelect: (id: string) => void;
  onHoverChange?: (hovered: { card: ScoredCard; anchor: DOMRect } | null) => void;
}) {
  return (
    <button
      type="button"
      className="group relative aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-black transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
      onClick={() => onPreview(card.id)}
      onMouseEnter={(e) => {
        if (onHoverChange) {
          onHoverChange({ card, anchor: e.currentTarget.getBoundingClientRect() });
        }
      }}
      onMouseLeave={() => {
        if (onHoverChange) {
          onHoverChange(null);
        }
      }}
      aria-label={`Preview ${card.name}`}
      title="Click to preview · + to add"
    >
      <img
        src={getCardImage(card)}
        alt={card.name}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />
      {showSynergy && card.synergyScore !== undefined && (
        <SynergyBadge score={card.synergyScore} />
      )}
      <div className="pointer-events-none absolute inset-0 hidden bg-black/40 opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100" />
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 transform rounded bg-black/70 px-2 py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Click to Preview
      </div>

      {/* Add button — visible on hover and always on mobile */}
      <button
        type="button"
        aria-label={`Add ${card.name} to deck`}
        title="Add to deck"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(card.id);
        }}
        className="absolute bottom-1 right-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-cobalt-600 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-300 hover:bg-cobalt-500 sm:opacity-0"
      >
        <span className="text-sm font-bold">+</span>
      </button>
    </button>
  );
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

  return (
    <div className="border-b border-border last:border-b-0">
      {hovered && typeof document !== 'undefined' && (
        <CardHoverTooltip card={hovered.card} anchor={hovered.anchor} />
      )}
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-surface-interactive/40 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-white" />
          ) : (
            <ChevronDown className="h-3 w-3 text-white" />
          )}
          {label}
        </span>
        <span className="rounded-full bg-steel-800 px-2 py-0.5 text-[10px] text-white">
          {cards.length}
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-3 px-2.5 pb-3.5">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              showSynergy={showSynergy}
              onPreview={onPreview}
              onSelect={onSelect}
              onHoverChange={setHovered}
            />
          ))}
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
      
      // Keyword filter: card must have ALL selected keywords
      if (keywordFilters.length > 0) {
        const cardKeywords = (card.keywords ?? []).map((k) => k.toLowerCase().split(' ')[0]);
        const hasAllKeywords = keywordFilters.every((reqKw) =>
          cardKeywords.some((ck) => ck === reqKw || ck.startsWith(reqKw))
        );
        if (!hasAllKeywords) return false;
      }
      
      // Trigger filter: card must have ALL selected triggers
      if (triggerFilters.length > 0) {
        const cardTriggers = (card.triggers ?? []).map((t) => t.toLowerCase());
        const hasAllTriggers = triggerFilters.every((reqTrigger) =>
          cardTriggers.includes(reqTrigger)
        );
        if (!hasAllTriggers) return false;
      }
      
      return true;
    });

    if (q) {
      eligible = eligible.filter((card) => {
        const haystack = `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (mechanicsPackages.length > 0) {
      return sortCardsBySynergy(eligible, mechanicsPackages, deckClans, deckColors, includeEX);
    }

    return eligible;
  }, [query, typeFilter, colorFilter, setFilter, keywordFilters, triggerFilters, deckColorOnly, deckColors, includeEX, deckClans, mechanicsPackages]);

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
      {/* ── Search + filters ─────────────────────────────────────────────── */}
      <div className="space-y-2 border-b border-border p-3" style={{ maxWidth: '100%' }}>
        <label className="sr-only" htmlFor="card-search-input">Search cards</label>
        <input
          id="card-search-input"
          className="w-full rounded border border-border bg-surface p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          placeholder="Search cards…"
          value={rawQuery}
          onChange={(e) => { setRawQuery(e.target.value); debouncedSetQuery(e.target.value); }}
          aria-label="Search cards by name, ID, or text"
        />

        {/* Active Filters Summary */}
        {(rawQuery || typeFilter !== 'All' || colorFilter !== 'All' || setFilter !== 'All' || keywordFilters.length > 0 || triggerFilters.length > 0 || deckColorOnly || includeEX) && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300">Active Filters</span>
              <button
                type="button"
                className="text-xs text-white hover:text-purple-300 transition-colors"
                onClick={() => {
                  setQuery('');
                  setRawQuery('');
                  setTypeFilter('All');
                  setColorFilter('All');
                  setSetFilter(initialSetId && SETS_LIST.includes(initialSetId) ? initialSetId : 'All');
                  setKeywordFilters([]);
                  setTriggerFilters([]);
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
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Search: &quot;{rawQuery.slice(0, 15)}{rawQuery.length > 15 ? '…' : ''}&quot;
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-cobalt-100 transition-colors" onClick={() => { setQuery(''); setRawQuery(''); }} aria-label="Clear search">×</button>
                </span>
              )}
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Type: {typeFilter}
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-purple-100 transition-colors" onClick={() => setTypeFilter('All')} aria-label="Clear type filter">×</button>
                </span>
              )}
              {colorFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Color: {colorFilter}
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-purple-100 transition-colors" onClick={() => setColorFilter('All')} aria-label="Clear color filter">×</button>
                </span>
              )}
              {setFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Set: {setFilter}
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-purple-100 transition-colors" onClick={() => setSetFilter('All')} aria-label="Clear set filter">×</button>
                </span>
              )}
              {keywordFilters.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                  {kw.replace('-', ' ')}
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-amber-100 transition-colors" onClick={() => setKeywordFilters(keywordFilters.filter((k) => k !== kw))} aria-label={`Clear ${kw} keyword filter`}>×</button>
                </span>
              ))}
              {triggerFilters.map((tr) => (
                <span key={tr} className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300 border border-emerald-500/30">
                  {tr.replace('-', ' ')}
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-emerald-100 transition-colors" onClick={() => setTriggerFilters(triggerFilters.filter((t) => t !== tr))} aria-label={`Clear ${tr} trigger filter`}>×</button>
                </span>
              ))}
              {deckColorOnly && deckColors.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Deck colors only
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-cobalt-100 transition-colors" onClick={() => setDeckColorOnly(false)} aria-label="Disable deck colors filter">×</button>
                </span>
              )}
              {includeEX && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                  EX cards shown
                  <button type="button" className="inline-flex items-center justify-center p-1 -mr-1 rounded hover:text-amber-100 transition-colors" onClick={() => setIncludeEX(false)} aria-label="Exclude EX cards">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Intent Summary with Clans/Colors */}
        {(deckColors.length > 0 || deckClans.length > 0) && (
          <div className="rounded-lg border border-steel-700/50 bg-steel-900/20 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white uppercase tracking-wider">Deck Intent</div>
              {onIntentChange && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-white hover:text-cobalt-400 transition-colors"
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
                <span key={clan} className="inline-flex items-center rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  {clan}
                </span>
              ))}
              {deckColors.map((color) => (
                <span key={color} className="inline-flex items-center rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Suggestions (Confidence: {deckAnalysis.confidence}%)
                </div>
                <div className="space-y-1">
                  {deckAnalysis.improvements.map((imp, i) => (
                    <p key={i} className="text-xs text-white leading-relaxed">• {imp}</p>
                  ))}
                </div>
                {deckAnalysis.confidence >= 70 && (
                  <button
                    type="button"
                    className="w-full rounded border border-amber-600 bg-amber-600/20 px-2 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-600/30 transition-colors"
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
              <label className="text-xs font-semibold text-white">Colors</label>
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
              <label className="text-xs font-semibold text-white">Factions</label>
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
                          ? 'bg-purple-600 text-white'
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
              className="w-full rounded border border-steel-600 bg-surface-interactive px-2 py-1.5 text-xs font-semibold text-white hover:bg-surface-hover transition-colors"
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
                : 'border-border bg-surface-interactive text-white hover:bg-surface'
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
              ? 'border-amber-600 bg-amber-600/20 text-amber-300'
              : 'border-border bg-surface-interactive text-foreground hover:bg-surface'
          }`}
          onClick={() => setIncludeEX((v) => !v)}
          aria-pressed={includeEX}
          title="Include EX Base and EX Resource cards in search results"
        >
          {includeEX ? '✓ EX cards shown' : 'Include EX cards'}
        </button>

        {/* Keywords Filter */}
        <fieldset className="space-y-2 rounded-lg border border-border bg-surface-interactive/30 p-3">
          <div className="flex items-center justify-between">
            <legend className="text-xs font-semibold text-white float-left">Keywords</legend>
            {keywordFilters.length > 0 && (
              <button
                type="button"
                className="text-xs text-white hover:text-white transition-colors"
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
                'blocker': { border: 'border-red-600', bg: 'bg-red-600/20', text: 'text-red-300', hoverBg: 'hover:bg-red-600/30' },
                'high-maneuver': { border: 'border-blue-600', bg: 'bg-blue-600/20', text: 'text-blue-300', hoverBg: 'hover:bg-blue-600/30' },
                'first-strike': { border: 'border-amber-600', bg: 'bg-amber-600/20', text: 'text-amber-300', hoverBg: 'hover:bg-amber-600/30' },
                'breach': { border: 'border-purple-600', bg: 'bg-purple-600/20', text: 'text-purple-300', hoverBg: 'hover:bg-purple-600/30' },
                'support': { border: 'border-emerald-600', bg: 'bg-emerald-600/20', text: 'text-emerald-300', hoverBg: 'hover:bg-emerald-600/30' },
                'repair': { border: 'border-green-600', bg: 'bg-green-600/20', text: 'text-green-300', hoverBg: 'hover:bg-green-600/30' },
                'suppression': { border: 'border-slate-600', bg: 'bg-slate-600/20', text: 'text-slate-300', hoverBg: 'hover:bg-slate-600/30' },
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
        </fieldset>

        {/* Triggers Filter */}
        <fieldset className="space-y-2 rounded-lg border border-border bg-surface-interactive/30 p-3">
          <div className="flex items-center justify-between">
            <legend className="text-xs font-semibold text-white float-left">Triggers</legend>
            {triggerFilters.length > 0 && (
              <button
                type="button"
                className="text-xs text-white hover:text-white transition-colors"
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
                'burst': { border: 'border-red-600', bg: 'bg-red-600/20', text: 'text-red-300', hoverBg: 'hover:bg-red-600/30' },
                'when-paired': { border: 'border-blue-600', bg: 'bg-blue-600/20', text: 'text-blue-300', hoverBg: 'hover:bg-blue-600/30' },
                'during-pair': { border: 'border-cyan-600', bg: 'bg-cyan-600/20', text: 'text-cyan-300', hoverBg: 'hover:bg-cyan-600/30' },
                'deploy': { border: 'border-emerald-600', bg: 'bg-emerald-600/20', text: 'text-emerald-300', hoverBg: 'hover:bg-emerald-600/30' },
                'attack': { border: 'border-amber-600', bg: 'bg-amber-600/20', text: 'text-amber-300', hoverBg: 'hover:bg-amber-600/30' },
                'when-linked': { border: 'border-purple-600', bg: 'bg-purple-600/20', text: 'text-purple-300', hoverBg: 'hover:bg-purple-600/30' },
                'during-link': { border: 'border-indigo-600', bg: 'bg-indigo-600/20', text: 'text-indigo-300', hoverBg: 'hover:bg-indigo-600/30' },
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
        </fieldset>

        {/* Advanced Filters Collapsible Section */}
        <div className="rounded-lg border border-border bg-surface-interactive/30">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-interactive/50 transition-colors"
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            <span className="text-xs font-semibold text-white">
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
              className={cn('w-4 h-4 text-white transition-transform duration-200', filtersExpanded ? 'rotate-180' : '')}
            />
          </button>

          {filtersExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              <div>
                <span className="mb-1 block text-xs text-white" id="type-filter-label">Type</span>
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
                <span className="mb-1 block text-xs text-white" id="color-filter-label">Color</span>
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
                <label className="mb-1 block text-xs text-white" htmlFor="set-filter-select">Set</label>
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

        {/* Results count + group mode toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-white" aria-live="polite">
            {filtered.length} card{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="flex rounded border border-border overflow-hidden text-[10px] font-semibold">
            {([['none', 'List'], ['clan', 'By Clan'], ['type', 'By Type']] as [GroupMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'px-2 py-1 transition-colors',
                  groupMode === mode
                    ? 'bg-cobalt-600 text-white'
                    : 'bg-surface-interactive text-white hover:text-foreground',
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
          <p className="p-4 text-center text-xs text-white">No cards match your filters.</p>
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
