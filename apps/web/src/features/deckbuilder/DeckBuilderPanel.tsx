import { useMemo, useState } from 'react';
import { validateDeck, type CardDefinition, type CardType } from '@gundam-forge/shared';
import { useDeckStore } from './deckStore';
import { resolveDeckEntries } from './deckSelectors';

interface DeckBuilderPanelProps {
  cards: CardDefinition[];
}

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
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Assembly Dock</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400">{totalCards} cards</p>
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              validation.isValid ? 'bg-emerald-400' : 'bg-red-400'
            }`}
            title={validation.isValid ? 'Deck valid' : 'Deck invalid'}
          />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button className="rounded bg-sky-700 px-3 py-1.5 text-sm hover:bg-sky-600" onClick={onExport}>
          Export decklist
        </button>
        <button className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600" onClick={clearDeck}>
          Clear
        </button>
        {copyStatus === 'copied' && <span className="text-xs text-emerald-300">Copied</span>}
        {copyStatus === 'error' && <span className="text-xs text-red-300">Clipboard blocked</span>}
      </div>

      {resolvedEntries.length === 0 ? (
        <p className="rounded border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
          Deck is empty. Add cards from the Inventory Rack.
        </p>
      ) : (
        <div className="space-y-3">
          {orderedTypes.map((type) => {
            const items = grouped.get(type) ?? [];
            if (items.length === 0) return null;

            return (
              <div key={type}>
                <h3 className="mb-1 text-sm font-semibold text-slate-300">{type}</h3>
                <ul className="divide-y divide-slate-800 rounded border border-slate-800">
                  {items.map((entry) => (
                    <li key={entry.cardId} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{entry.card.name}</p>
                        <p className="text-xs text-slate-400">
                          {entry.card.color} · Cost {entry.card.cost}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="h-7 w-7 rounded bg-slate-700 text-sm hover:bg-slate-600"
                          onClick={() => removeCard(entry.cardId)}
                          aria-label={`Remove ${entry.card.name}`}
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm">{entry.qty}</span>
                        <button
                          className="h-7 w-7 rounded bg-slate-700 text-sm hover:bg-slate-600"
                          onClick={() => addCard(entry.cardId)}
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

      <div className="mt-4 space-y-2">
        {!validation.isValid && (
          <div className="rounded border border-red-900 bg-red-950/40 p-3">
            <p className="mb-1 text-sm font-semibold text-red-200">Validation errors</p>
            <ul className="list-disc pl-5 text-sm text-red-100">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="rounded border border-amber-900 bg-amber-950/40 p-3">
            <p className="mb-1 text-sm font-semibold text-amber-200">Warnings</p>
            <ul className="list-disc pl-5 text-sm text-amber-100">
              {validation.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
