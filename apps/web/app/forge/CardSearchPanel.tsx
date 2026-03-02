'use client';

import React, { useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import { ChevronDown, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import type { DeckIntent, CardDefinition } from '@gundam-forge/shared';
import { sortCardsBySynergy, filterCardsByIntent } from '@gundam-forge/shared';
import { cards as allCards, allSets, getCardImage } from '@/lib/data/cards';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { cn } from '@/lib/utils/cn';

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
const SLIDE_SIZE = 4;

type GroupMode = 'none' | 'clan' | 'type';

type ScoredCard = CardDefinition & { synergyScore?: number; synergyReasons?: any[] };

export interface CardSearchPanelProps {
  onSelect: (id: string) => void;
  deckIntent?: DeckIntent;
  initialSetId?: string;
}

// ─── Synergy badge ───────────────────────────────────────────────────────────

function SynergyBadge({ score }: { score: number }) {
  if (score <= 0) return null;
  const cls =
    score >= 20 ? 'bg-green-500/90 text-white' :
    score >= 8  ? 'bg-cobalt-500/90 text-white' :
                  'bg-steel-700/80 text-steel-300';
  return (
    <span
      className={cn('absolute right-1 top-1 z-10 rounded px-1 py-0.5 text-[9px] font-bold leading-none', cls)}
      aria-label={`Synergy score ${score}`}
    >
      ★{score}
    </span>
  );
}

// ─── Single card tile ─────────────────────────────────────────────────────────

function CardTile({
  card,
  showSynergy,
  onPreview,
  onSelect,
}: {
  card: ScoredCard;
  showSynergy: boolean;
  onPreview: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className="group relative aspect-[5/7] w-full overflow-hidden rounded-md border border-border bg-black transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
      onClick={() => onPreview(card.id)}
      onDoubleClick={() => { onSelect(card.id); }}
      aria-label={`Preview ${card.name} (click to preview, double-click to add)`}
      title="Click to preview • Double-click to add"
    >
      <img
        src={getCardImage(card)}
        alt={card.name}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-125"
        loading="lazy"
      />
      {showSynergy && card.synergyScore !== undefined && (
        <SynergyBadge score={card.synergyScore} />
      )}
      <div className="pointer-events-none absolute inset-0 hidden bg-black/40 opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100" />
      <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 transform rounded bg-black/70 px-2 py-1 text-center text-[10px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Click to Preview
      </div>
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

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 hover:bg-surface-interactive/40 transition-colors"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-steel-300">
          {collapsed ? (
            <ChevronRight className="h-3 w-3 text-steel-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-steel-500" />
          )}
          {label}
        </span>
        <span className="rounded-full bg-steel-800 px-2 py-0.5 text-[10px] text-steel-400">
          {cards.length}
        </span>
      </button>
      {!collapsed && (
        <div className="grid grid-cols-2 gap-1.5 px-1.5 pb-2" style={{ maxWidth: '100%' }}>
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              showSynergy={showSynergy}
              onPreview={onPreview}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CardSearchPanel({ onSelect, deckIntent, initialSetId }: CardSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [colorFilter, setColorFilter] = useState('All');
  const [setFilter, setSetFilter] = useState(() => {
    if (initialSetId && SETS_LIST.includes(initialSetId)) return initialSetId;
    return 'All';
  });

  const [previewCardId, setPreviewCardId] = useState<string | null>(null);
  const previewCard = previewCardId ? (allCards.find((c) => c.id === previewCardId) ?? null) : null;

  const [filtersExpanded, setFiltersExpanded] = useState(true);

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
  }, [query, typeFilter, colorFilter, setFilter, deckColorOnly, deckColors, includeEX, deckClans, mechanicsPackages]);

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

  // ── Swiper slides (used only when groupMode === 'none') ──────────────────
  const slides = useMemo(() => {
    if (groupMode !== 'none') return [];
    const result: ScoredCard[][] = [];
    for (let i = 0; i < filtered.length; i += SLIDE_SIZE) {
      result.push(filtered.slice(i, i + SLIDE_SIZE));
    }
    return result;
  }, [filtered, groupMode]);

  const filterKey = `${query}|${typeFilter}|${colorFilter}|${setFilter}|${deckColorOnly}|${includeEX}`;

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search cards by name, ID, or text"
        />

        {/* Active Filters Summary */}
        {(query || typeFilter !== 'All' || colorFilter !== 'All' || setFilter !== 'All' || deckColorOnly || includeEX) && (
          <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300">Active Filters</span>
              <button
                type="button"
                className="text-xs text-steel-500 hover:text-purple-300 transition-colors"
                onClick={() => {
                  setQuery('');
                  setTypeFilter('All');
                  setColorFilter('All');
                  setSetFilter(initialSetId && SETS_LIST.includes(initialSetId) ? initialSetId : 'All');
                  setDeckColorOnly(false);
                  setIncludeEX(intentIncludeEX);
                }}
                title="Reset all filters"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {query && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Search: &quot;{query.slice(0, 15)}{query.length > 15 ? '…' : ''}&quot;
                  <button type="button" className="hover:text-cobalt-100 transition-colors" onClick={() => setQuery('')} aria-label="Clear search">×</button>
                </span>
              )}
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Type: {typeFilter}
                  <button type="button" className="hover:text-purple-100 transition-colors" onClick={() => setTypeFilter('All')} aria-label="Clear type filter">×</button>
                </span>
              )}
              {colorFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Color: {colorFilter}
                  <button type="button" className="hover:text-purple-100 transition-colors" onClick={() => setColorFilter('All')} aria-label="Clear color filter">×</button>
                </span>
              )}
              {setFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-300 border border-purple-500/30">
                  Set: {setFilter}
                  <button type="button" className="hover:text-purple-100 transition-colors" onClick={() => setSetFilter('All')} aria-label="Clear set filter">×</button>
                </span>
              )}
              {deckColorOnly && deckColors.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-600/20 px-2 py-0.5 text-xs text-cobalt-300 border border-cobalt-500/30">
                  Deck colors only
                  <button type="button" className="hover:text-cobalt-100 transition-colors" onClick={() => setDeckColorOnly(false)} aria-label="Disable deck colors filter">×</button>
                </span>
              )}
              {includeEX && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300 border border-amber-500/30">
                  EX cards shown
                  <button type="button" className="hover:text-amber-100 transition-colors" onClick={() => setIncludeEX(false)} aria-label="Exclude EX cards">×</button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Intent Summary with Clans/Colors */}
        {(deckColors.length > 0 || deckClans.length > 0) && (
          <div className="rounded-lg border border-steel-700/50 bg-steel-900/20 p-2 space-y-1.5">
            <div className="text-xs font-semibold text-steel-400 uppercase tracking-wider">Deck Intent</div>
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

        {/* Deck-color quick filter */}
        {deckColors.length > 0 && (
          <button
            type="button"
            className={`w-full rounded border px-2 py-1 text-xs font-semibold transition-colors ${
              deckColorOnly
                ? 'border-cobalt-600 bg-cobalt-600 text-white'
                : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
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
              : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'
          }`}
          onClick={() => setIncludeEX((v) => !v)}
          aria-pressed={includeEX}
          title="Include EX Base and EX Resource cards in search results"
        >
          {includeEX ? '✓ EX cards shown' : 'Include EX cards'}
        </button>

        {/* Advanced Filters Collapsible Section */}
        <div className="rounded-lg border border-border bg-surface-interactive/30">
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-interactive/50 transition-colors"
            onClick={() => setFiltersExpanded((v) => !v)}
          >
            <span className="text-xs font-semibold text-steel-400">Advanced Filters</span>
            <ChevronDown
              className={cn('w-4 h-4 text-steel-500 transition-transform duration-200', filtersExpanded ? 'rotate-180' : '')}
            />
          </button>

          {filtersExpanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
              <div>
                <span className="mb-1 block text-xs text-steel-500" id="type-filter-label">Type</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="type-filter-label">
                  {CARD_TYPES.map((t) => (
                    <button
                      key={t} type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${typeFilter === t ? 'border-cobalt-600 bg-cobalt-600 text-white' : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'}`}
                      onClick={() => setTypeFilter(t)} aria-pressed={typeFilter === t}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs text-steel-500" id="color-filter-label">Color</span>
                <div className="flex flex-wrap gap-1" role="group" aria-labelledby="color-filter-label">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c} type="button"
                      className={`rounded border px-2 py-0.5 text-xs transition-colors ${colorFilter === c ? 'border-cobalt-600 bg-cobalt-600 text-white' : 'border-border bg-surface-interactive text-steel-700 hover:bg-surface'}`}
                      onClick={() => setColorFilter(c)} aria-pressed={colorFilter === c}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-steel-500" htmlFor="set-filter-select">Set</label>
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
          <p className="text-xs text-steel-500" aria-live="polite">
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
                    : 'bg-surface-interactive text-steel-500 hover:text-foreground',
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
        className={cn('overflow-hidden', groupMode === 'none' ? 'min-h-[400px]' : 'overflow-y-auto')}
        style={{ minWidth: 0 }}
        aria-label="Card results"
      >
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-xs text-steel-600">No cards match your filters.</p>
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
          /* Swiper carousel (List mode) */
          <Swiper
            key={filterKey}
            modules={[Pagination]}
            pagination={{ type: 'progressbar' }}
            className="h-full w-full"
            style={{ maxWidth: '100%', overflowX: 'hidden' }}
          >
            {slides.map((slideCards, slideIdx) => (
              <SwiperSlide key={slideIdx}>
                <div className="grid grid-cols-2 gap-1.5 p-1.5" style={{ maxWidth: '100%' }}>
                  {slideCards.map((card) => (
                    <CardTile
                      key={card.id}
                      card={card}
                      showSynergy={showSynergy}
                      onPreview={setPreviewCardId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
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
