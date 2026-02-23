import { useMemo, useState } from 'react';
import { validateDeck, type CardDefinition, type CardType } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';
import { resolveDeckEntries } from './deckSelectors';
import { useCardsStore } from './cardsStore';

interface DeckBuilderPanelProps {
  cards: CardDefinition[];
}

const orderedTypes: { type: CardType; label: string; color: string }[] = [
  { type: 'Unit', label: 'Units', color: 'border-l-blue-500' },
  { type: 'Pilot', label: 'Pilots', color: 'border-l-red-400' },
  { type: 'Command', label: 'Commands', color: 'border-l-green-500' },
  { type: 'Base', label: 'Support', color: 'border-l-purple-500' },
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

export function DeckBuilderPanel({ cards }: DeckBuilderPanelProps) {
  const entries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);
  const clearDeck = useDeckStore((state) => state.clearDeck);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const [deckName, setDeckName] = useState('RX-78 Strike Deck');
  const [collapsedSections, setCollapsedSections] = useState<Set<CardType>>(new Set());

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

  const progressPct = Math.min((totalCards / DECK_MAX) * 100, 100);
  const progressColor = totalCards >= DECK_MAX ? 'bg-green-500' : totalCards >= DECK_MAX * 0.8 ? 'bg-yellow-500' : 'bg-gf-blue';

  return (
    <div className="flex flex-col h-full">
      {/* Deck Header */}
      <div className="sticky top-0 z-10 border-b border-gf-border bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Deck Name */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="border-0 bg-transparent font-heading text-lg font-bold text-gf-text outline-none placeholder-gray-400"
              placeholder="Deck Name"
            />
            <button className="text-gf-text-secondary hover:text-gf-text">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Card Count + Progress */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gf-text">
                {totalCards} <span className="text-sm font-normal text-gf-text-secondary">/ {DECK_MAX} Cards</span>
              </span>
              <div className="w-32 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Save Button */}
            <button className="flex items-center gap-2 rounded-lg bg-gf-blue px-4 py-2 text-sm font-medium text-white hover:bg-gf-blue-dark transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Save Deck
            </button>

            {/* More Menu */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gf-border text-gf-text-secondary hover:bg-gray-50 transition-colors">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Deck List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
        {resolvedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
              <path d="M3 9h18M9 3v18" strokeWidth="2" />
            </svg>
            <h3 className="font-heading text-lg font-bold text-gf-text">No Cards in Deck</h3>
            <p className="mt-2 text-sm text-gf-text-secondary">
              Add cards from the catalog to start building
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {orderedTypes.map(({ type, label, color }) => {
              const items = grouped.get(type) ?? [];
              if (items.length === 0) return null;
              const isCollapsed = collapsedSections.has(type);
              const sectionTotal = items.reduce((sum, e) => sum + e.qty, 0);

              return (
                <div key={type}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(type)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-4 w-4 text-gf-text-secondary transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-sm font-bold text-gf-text">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gf-text-secondary">{sectionTotal} cards</span>
                      {sectionTotal > 12 && (
                        <span className="flex h-4 w-4 items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-gf-orange" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Card Rows */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 mb-2">
                      {items.map((entry) => {
                        const imageSrc = entry.card.imageUrl || entry.card.placeholderArt;
                        return (
                          <div
                            key={entry.cardId}
                            onClick={() => setSelectedCardId(entry.cardId)}
                            className={`flex items-center gap-3 rounded-lg border-l-4 ${color} bg-white px-3 py-2 cursor-pointer transition-all hover:bg-gray-50 hover:shadow-sm border border-gf-border`}
                          >
                            {/* Quantity */}
                            <span className="text-sm font-bold text-gf-text w-6 text-center">{entry.qty}x</span>

                            {/* Card Thumbnail */}
                            <img
                              src={imageSrc}
                              alt={entry.card.name}
                              className="h-9 w-7 rounded object-cover flex-shrink-0"
                              loading="lazy"
                            />

                            {/* Card Name */}
                            <span className="flex-1 truncate text-sm font-medium text-gf-text">{entry.card.name}</span>

                            {/* Cost Badge */}
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gf-blue text-xs font-bold text-white flex-shrink-0">
                              {entry.card.cost}
                            </div>

                            {/* Power */}
                            {entry.card.power !== undefined && entry.card.power > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gf-text-secondary flex-shrink-0">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 9l8 8M7 3L3 7" strokeLinecap="round" />
                                </svg>
                                {entry.card.power}
                              </div>
                            )}

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); removeCard(entry.cardId); }}
                                className="flex h-7 w-7 items-center justify-center rounded border border-gf-border bg-white text-sm font-bold text-gf-text hover:bg-gray-100 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-gf-text">{entry.qty}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); addCard(entry.cardId); }}
                                disabled={entry.qty >= 4}
                                className={`flex h-7 w-7 items-center justify-center rounded border text-sm font-bold transition-colors ${
                                  entry.qty >= 4
                                    ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'border-gf-border bg-white text-gf-text hover:bg-gray-100'
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Cards Button */}
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gf-border py-3 text-sm font-medium text-gf-text-secondary hover:border-gf-blue hover:text-gf-blue transition-colors mt-4">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add Cards
            </button>
          </div>
        )}
      </div>

      {/* Validation Footer */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="border-t border-gf-border bg-white px-6 py-3">
          {validation.errors.map((error, i) => (
            <p key={i} className="text-xs text-red-600">
              <span className="font-medium">Error:</span> {error}
            </p>
          ))}
          {validation.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-gf-orange">
              <span className="font-medium">Warning:</span> {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
