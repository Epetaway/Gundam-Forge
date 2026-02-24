import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { validateDeck, type CardDefinition, type CardType } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';
import { resolveCardImage } from '../../utils/resolveCardImage';
import { resolveDeckEntries } from './deckSelectors';
import { useCardsStore } from './cardsStore';
import { PREDEFINED_ARCHETYPES, MAX_ARCHETYPE_LENGTH } from '../../data/archetypes';

interface DeckBuilderPanelProps {
  cards: CardDefinition[];
  onInspect?: (cardId: string) => void;
}

const orderedTypes: { type: CardType; label: string }[] = [
  { type: 'Unit', label: 'Units' },
  { type: 'Pilot', label: 'Pilots' },
  { type: 'Command', label: 'Commands' },
  { type: 'Base', label: 'Support' },
];

const typeSortRank: Record<string, number> = {
  Unit: 0,
  Pilot: 1,
  Command: 2,
  Base: 3,
  Resource: 4,
};

export function buildDeckExport(entries: Array<{ qty: number; name: string; type: CardType; cost: number }>) {
  const sorted = [...entries].sort((a, b) => {
    if (typeSortRank[a.type] !== typeSortRank[b.type]) return typeSortRank[a.type] - typeSortRank[b.type];
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });

  const lines = sorted.map((entry) => `${entry.qty}x ${entry.name}`);
  return [`# Gundam Forge Decklist`, ...lines].join('\n');
}

const DECK_MAX = 50;

type SaveStatus = 'idle' | 'saving' | 'saved';

export function DeckBuilderPanel({ cards, onInspect }: DeckBuilderPanelProps) {
  const entries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);
  const toggleBoss = useDeckStore((state) => state.toggleBoss);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const [deckName, setDeckName] = useState('RX-78 Strike Deck');
  const [deckArchetype, setDeckArchetype] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<CardType>>(new Set());
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [pulsingCardId, setPulsingCardId] = useState<string | null>(null);

  const bossCount = useMemo(() => entries.filter((e) => e.isBoss).length, [entries]);

  const resolvedEntries = useMemo(() => resolveDeckEntries(entries, cards), [entries, cards]);
  const validation = useMemo(() => validateDeck(entries, cards), [entries, cards]);

  const totalCards = useMemo(
    () => resolvedEntries.reduce((sum, entry) => sum + entry.qty, 0),
    [resolvedEntries]
  );

  const grouped = useMemo(() => {
    const groups = new Map<CardType, typeof resolvedEntries>();
    for (const { type } of orderedTypes) groups.set(type, []);
    for (const entry of resolvedEntries) {
      const group = groups.get(entry.card.type);
      if (group) group.push(entry);
    }
    for (const { type } of orderedTypes) {
      const group = groups.get(type);
      if (!group) continue;
      group.sort((a, b) => {
        if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
        return a.card.name.localeCompare(b.card.name);
      });
    }
    return groups;
  }, [resolvedEntries]);

  const toggleSection = (type: CardType) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Autosave indicator
  const saveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (entries.length === 0) return;
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved');
      saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [entries]);

  // Quantity pulse
  const handleAdd = useCallback((e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    addCard(cardId);
    setPulsingCardId(cardId);
    setTimeout(() => setPulsingCardId(null), 300);
  }, [addCard]);

  const handleRemove = useCallback((e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    removeCard(cardId);
    setPulsingCardId(cardId);
    setTimeout(() => setPulsingCardId(null), 300);
  }, [removeCard]);

  const progressPct = Math.min((totalCards / DECK_MAX) * 100, 100);
  const progressStatus = totalCards >= DECK_MAX ? 'complete' : totalCards >= DECK_MAX * 0.8 ? 'warning' : undefined;

  // Validation LED
  const ledStatus = validation.errors.length > 0 ? 'error'
    : validation.warnings.length > 0 ? 'warning'
    : totalCards === DECK_MAX ? 'valid'
    : 'warning';

  return (
    <div className="flex flex-col h-full">
      {/* Deck Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gf-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Deck Name */}
            <div className="flex items-center gap-3 min-w-0">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                className="border-0 bg-transparent font-heading text-lg font-bold text-gf-text outline-none placeholder-gf-text-muted min-w-0"
                placeholder="Deck Name"
              />
              <button className="text-gf-text-muted hover:text-gf-text flex-shrink-0 gf-transition">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Archetype Selector */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={deckArchetype}
                onChange={(e) => setDeckArchetype(e.target.value.slice(0, MAX_ARCHETYPE_LENGTH))}
                className="rounded-lg border border-gf-border bg-white px-2 py-1 text-[10px] text-gf-text outline-none focus:border-gf-blue"
              >
                <option value="">No Archetype</option>
                {PREDEFINED_ARCHETYPES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Right: Count + LED + Autosave */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Autosave */}
              <div className="gf-autosave" data-status={saveStatus}>
                {saveStatus === 'saving' && <div className="gf-autosave-spinner" />}
                {saveStatus === 'saved' && (
                  <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <span>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved just now' : ''}
                </span>
              </div>

              {/* Card Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gf-text tabular-nums">
                  {totalCards}
                </span>
                <span className="text-xs text-gf-text-secondary font-medium">/ {DECK_MAX}</span>
                <div className="gf-led" data-status={ledStatus} title={ledStatus} />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="gf-progress-bar mt-3">
            <div
              className="gf-progress-fill"
              data-status={progressStatus}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Validation Errors */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="px-6 pb-3 space-y-1">
            {validation.errors.map((error, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gf-orange">
                <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deck List */}
      <div className="flex-1 overflow-y-auto gf-scroll px-6 py-4">
        {resolvedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gf-light mb-4">
              <svg className="h-8 w-8 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 3v18" />
              </svg>
            </div>
            <h3 className="font-heading text-base font-bold text-gf-text">No Cards in Deck</h3>
            <p className="mt-1 text-sm text-gf-text-secondary">
              Add cards from the catalog to start building
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {orderedTypes.map(({ type, label }) => {
              const items = grouped.get(type) ?? [];
              if (items.length === 0) return null;
              const isCollapsed = collapsedSections.has(type);
              const sectionTotal = items.reduce((sum, e) => sum + e.qty, 0);

              return (
                <div key={type}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(type)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-gf-light gf-transition group"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-3.5 w-3.5 text-gf-text-muted transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-bold text-gf-text uppercase tracking-wide">{label}</span>
                    </div>
                    <span className="text-[10px] font-medium text-gf-text-muted bg-gf-light rounded-full px-2 py-0.5">
                      {sectionTotal}
                    </span>
                  </button>

                  {/* Card Rows with smooth collapse */}
                  <div
                    className="gf-section-body"
                    data-collapsed={isCollapsed ? 'true' : undefined}
                    style={isCollapsed ? { maxHeight: 0 } : { maxHeight: items.length * 56 + 16 }}
                  >
                    <div className="space-y-0.5 mb-2">
                      {items.map((entry) => {
                        const isPulsing = pulsingCardId === entry.cardId;
                        return (
                          <div
                            key={entry.cardId}
                            onClick={() => setSelectedCardId(entry.cardId)}
                            onDoubleClick={() => onInspect?.(entry.cardId)}
                            className="gf-deck-row flex items-center gap-3 rounded-lg bg-white px-3 py-2 cursor-pointer border border-gf-border/50"
                          >
                            {/* Quantity */}
                            <span className={`text-xs font-bold text-gf-text w-6 text-center tabular-nums ${isPulsing ? 'animate-qty-pulse' : ''}`}>
                              {entry.qty}x
                            </span>

                            {/* Card Thumbnail */}
                            <img
                              src={resolveCardImage(entry.card)}
                              alt={entry.card.name}
                              className="h-9 w-7 rounded object-cover flex-shrink-0"
                              loading="lazy"
                            />

                            {/* Boss Card Star */}
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleBoss(entry.cardId); }}
                              className={`flex h-5 w-5 items-center justify-center rounded-sm transition-colors flex-shrink-0 ${
                                entry.isBoss
                                  ? 'text-yellow-500'
                                  : 'text-gf-text-muted/30 hover:text-yellow-400'
                              }`}
                              title={entry.isBoss ? 'Remove boss card' : `Mark as boss card (${bossCount}/4)`}
                            >
                              <svg className="h-3.5 w-3.5" fill={entry.isBoss ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>

                            {/* Card Name */}
                            <span className="flex-1 truncate text-sm font-medium text-gf-text">
                              {entry.card.name}
                            </span>

                            {/* Cost Badge */}
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gf-blue text-[10px] font-bold text-white flex-shrink-0">
                              {entry.card.cost}
                            </div>

                            {/* AP/HP Indicators */}
                            {(entry.card.ap ?? entry.card.power ?? 0) > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-gf-text-secondary flex-shrink-0">
                                <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                {entry.card.ap ?? entry.card.power}
                              </div>
                            )}
                            {(entry.card.hp ?? 0) > 0 && (
                              <div className="flex items-center gap-0.5 text-[10px] text-gf-text-secondary flex-shrink-0">
                                <svg className="h-3 w-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {entry.card.hp}
                              </div>
                            )}

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => handleRemove(e, entry.cardId)}
                                className="flex h-6 w-6 items-center justify-center rounded border border-gf-border bg-white text-xs font-bold text-gf-text hover:bg-gf-light hover:border-gf-border-dark gf-transition"
                              >
                                -
                              </button>
                              <button
                                onClick={(e) => handleAdd(e, entry.cardId)}
                                disabled={entry.qty >= 4}
                                className={`flex h-6 w-6 items-center justify-center rounded border text-xs font-bold gf-transition ${
                                  entry.qty >= 4
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'border-gf-border bg-white text-gf-text hover:bg-gf-light hover:border-gf-border-dark'
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Cards Button */}
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gf-border py-3 text-xs font-medium text-gf-text-muted hover:border-gf-blue hover:text-gf-blue gf-transition mt-4">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              + Add Cards
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
