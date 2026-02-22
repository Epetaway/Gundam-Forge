import { useMemo, useState } from 'react';
import { validateDeck, type CardDefinition, type CardType } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';
import { resolveDeckEntries } from './deckSelectors';
import { DeckStats } from './DeckStats';
import { DeckViewSelector } from './DeckViewSelector';

interface DeckBuilderPanelProps {
  cards: CardDefinition[];
}

type DeckView = 'visual' | 'list' | 'stats';

const orderedTypes: CardType[] = ['Unit', 'Pilot', 'Command', 'Base'];

const typeSortRank: Record<CardType, number> = {
  Unit: 0,
  Pilot: 1,
  Command: 2,
  Base: 3
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

export function DeckBuilderPanel({ cards }: DeckBuilderPanelProps) {
  const entries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);
  const clearDeck = useDeckStore((state) => state.clearDeck);

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [view, setView] = useState<DeckView>('list');
  const [deckName, setDeckName] = useState('Untitled Deck');

  const resolvedEntries = useMemo(() => resolveDeckEntries(entries, cards), [entries, cards]);
  const validation = useMemo(() => validateDeck(entries, cards), [entries, cards]);

  const totalCards = useMemo(
    () => resolvedEntries.reduce((sum, entry) => sum + entry.qty, 0),
    [resolvedEntries]
  );

  const grouped = useMemo(() => {
    const groups = new Map<CardType, typeof resolvedEntries>();
    for (const type of orderedTypes) groups.set(type, []);

    for (const entry of resolvedEntries) {
      const group = groups.get(entry.card.type);
      if (group) group.push(entry);
    }

    for (const type of orderedTypes) {
      const group = groups.get(type);
      if (!group) continue;
      group.sort((a, b) => {
        if (a.card.cost !== b.card.cost) return a.card.cost - b.card.cost;
        return a.card.name.localeCompare(b.card.name);
      });
    }

    return groups;
  }, [resolvedEntries]);

  const onExport = async () => {
    const text = buildDeckExport(
      resolvedEntries.map((entry) => ({
        qty: entry.qty,
        name: entry.card.name,
        type: entry.card.type,
        cost: entry.card.cost
      }))
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 1400);
    } catch {
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <section className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
      {/* Header with Deck Name */}
      <div className="mb-4 rounded-lg border border-gcg-border bg-gcg-light p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full border-0 bg-transparent font-heading text-xl font-bold text-gcg-text outline-none placeholder-gray-400"
              placeholder="Untitled Deck"
            />
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <span>{totalCards} Cards</span>
              <span className={`font-medium ${
                validation.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validation.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded border border-gcg-border bg-white px-3 py-1.5 text-xs font-medium text-gcg-text transition-colors hover:bg-gcg-light"
              onClick={onExport}
            >
              Export
            </button>
            <button
              className="rounded border border-gcg-primary bg-white px-3 py-1.5 text-xs font-medium text-gcg-primary transition-colors hover:bg-gcg-primary hover:text-white"
              onClick={clearDeck}
            >
              Clear
            </button>
          </div>
        </div>

        {copyStatus === 'copied' && (
          <div className="mt-2 rounded border border-green-600 bg-green-50 px-3 py-1 text-xs text-green-700">
            Copied to clipboard
          </div>
        )}
        {copyStatus === 'error' && (
          <div className="mt-2 rounded border border-red-600 bg-red-50 px-3 py-1 text-xs text-red-700">
            Clipboard access blocked
          </div>
        )}
      </div>

      {/* View Selector */}
      <div className="mb-4">
        <DeckViewSelector view={view} onViewChange={setView} />
      </div>

      {/* Content based on view */}
      {resolvedEntries.length === 0 ? (
        <div className="rounded-lg border border-gcg-border bg-gcg-light p-8 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
            <path d="M3 9h18M9 3v18" strokeWidth="2"/>
          </svg>
          <h3 className="font-heading text-lg font-bold text-gcg-text">No Cards in Deck</h3>
          <p className="mt-2 text-xs text-gray-600">
            Add cards from the database to begin building your deck
          </p>
        </div>
      ) : (
        <>
          {view === 'stats' && <DeckStats resolvedEntries={resolvedEntries} />}

          {view === 'list' && (
            <div className="space-y-3">
              {orderedTypes.map((type) => {
                const items = grouped.get(type) ?? [];
                if (items.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gcg-text">
                      {type}
                      <span className="text-xs text-gray-500">({items.length})</span>
                    </h3>
                    <ul className="space-y-1">
                      {items.map((entry) => (
                        <li
                          key={entry.cardId}
                          className="flex items-center justify-between gap-3 rounded border border-gcg-border bg-white p-2 transition-colors hover:bg-gcg-light"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gcg-text">{entry.card.name}</p>
                            <p className="text-xs text-gray-600">
                              {entry.card.color} · Cost {entry.card.cost} · Power {entry.card.power}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded border border-gcg-border bg-white text-sm font-bold text-gcg-text transition-colors hover:bg-gcg-light"
                              onClick={() => removeCard(entry.cardId)}
                              aria-label={`Remove ${entry.card.name}`}
                            >
                              -
                            </button>
                            <span className={`min-w-8 text-center text-sm font-bold ${ 
                              entry.qty >= 3 ? 'text-gcg-primary' : 'text-gcg-text'
                            }`}>
                              {entry.qty}
                            </span>
                            <button
                              className={`flex h-7 w-7 items-center justify-center rounded border text-sm font-bold transition-colors ${
                                entry.qty >= 3
                                  ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gcg-primary bg-gcg-primary text-white hover:bg-gcg-hover'
                              }`}
                              onClick={() => addCard(entry.cardId)}
                              disabled={entry.qty >= 3}
                              aria-label={`Add ${entry.card.name}`}
                            >
                              +
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'visual' && (
            <div className="space-y-3">
              {orderedTypes.map((type) => {
                const items = grouped.get(type) ?? [];
                if (items.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gcg-text">
                      {type}
                      <span className="text-xs text-gray-500">({items.length})</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {items.map((entry) => (
                        <div
                          key={entry.cardId}
                          className="group relative overflow-hidden rounded border border-gcg-border bg-white shadow-sm transition-all hover:border-gcg-primary hover:shadow-md"
                        >
                          {/* Card Image */}
                          <div className="relative w-full pb-[140%]">
                            <img
                              src={entry.card.placeholderArt}
                              alt={entry.card.name}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                            {/* Quantity Badge */}
                            <div className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold shadow-sm ${
                              entry.qty >= 3
                                ? 'bg-gcg-primary text-white'
                                : 'bg-white text-gcg-text'
                            }`}>
                              {entry.qty}
                            </div>
                          </div>
                          {/* Quick Controls */}
                          <div className="absolute bottom-0 left-0 right-0 flex gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => removeCard(entry.cardId)}
                              className="flex-1 rounded border border-white bg-white/20 py-1 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/30"
                            >
                              -
                            </button>
                            <button
                              onClick={() => addCard(entry.cardId)}
                              disabled={entry.qty >= 3}
                              className={`flex-1 rounded border py-1 text-xs font-bold transition-all ${
                                entry.qty >= 3
                                  ? 'border-gray-400 bg-gray-400/20 text-gray-400 cursor-not-allowed backdrop-blur-sm'
                                  : 'border-white bg-gcg-primary/80 text-white backdrop-blur-sm hover:bg-gcg-primary'
                              }`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Validation Errors & Warnings */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="mt-4 space-y-2">
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="rounded border border-red-600 bg-red-50 p-3">
              <p className="mb-2 text-sm font-semibold text-red-700">
                Validation Errors
              </p>
              <ul className="space-y-1 text-xs text-red-600">
                {validation.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="rounded border border-yellow-600 bg-yellow-50 p-3">
              <p className="mb-2 text-sm font-semibold text-yellow-700">
                Warnings
              </p>
              <ul className="space-y-1 text-xs text-yellow-600">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
