import { useCallback, useMemo, useState } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { useDeckStore, type DeckEntry } from './deckStore';

interface ImportDeckModalProps {
  open: boolean;
  onClose: () => void;
  cards: CardDefinition[];
}

interface ParsedLine {
  raw: string;
  qty: number;
  nameOrId: string;
  matchedCard: CardDefinition | null;
}

/**
 * Parse a single line from a deck list.
 * Supports formats:
 *   4x Strike Gundam
 *   4 Strike Gundam
 *   Strike Gundam x4
 *   2x TS2-001
 *   TS2-001
 */
function parseLine(line: string, cards: CardDefinition[]): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return null;

  let qty = 1;
  let nameOrId = trimmed;

  // "4x Card Name" or "4 Card Name"
  const prefixMatch = trimmed.match(/^(\d+)\s*x?\s+(.+)$/i);
  if (prefixMatch) {
    qty = parseInt(prefixMatch[1], 10);
    nameOrId = prefixMatch[2].trim();
  } else {
    // "Card Name x4"
    const suffixMatch = trimmed.match(/^(.+?)\s+x(\d+)$/i);
    if (suffixMatch) {
      nameOrId = suffixMatch[1].trim();
      qty = parseInt(suffixMatch[2], 10);
    }
  }

  if (qty <= 0 || qty > 10) qty = 1;

  const lowerName = nameOrId.toLowerCase();

  // Try exact ID match first
  let matched = cards.find((c) => c.id.toLowerCase() === lowerName);

  // Try exact name match
  if (!matched) {
    matched = cards.find((c) => c.name.toLowerCase() === lowerName);
  }

  // Try partial name match (starts with)
  if (!matched) {
    matched = cards.find((c) => c.name.toLowerCase().startsWith(lowerName));
  }

  return { raw: trimmed, qty, nameOrId, matchedCard: matched ?? null };
}

const EXAMPLE_TEXT = `# Example formats:
4x Strike Gundam
2 Char's Zaku
TS2-001
Amuro Ray x3`;

export function ImportDeckModal({ open, onClose, cards }: ImportDeckModalProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const setDeck = useDeckStore((s) => s.setDeck);
  const currentEntries = useDeckStore((s) => s.entries);
  const addCard = useDeckStore((s) => s.addCard);

  const parsed = useMemo(() => {
    if (!text.trim()) return [];
    return text
      .split('\n')
      .map((line) => parseLine(line, cards))
      .filter((r): r is ParsedLine => r !== null);
  }, [text, cards]);

  const matchedCount = parsed.filter((p) => p.matchedCard).length;
  const unmatchedCount = parsed.filter((p) => !p.matchedCard).length;
  const totalCards = parsed
    .filter((p) => p.matchedCard)
    .reduce((sum, p) => sum + p.qty, 0);

  const handleImport = useCallback(() => {
    const newEntries: DeckEntry[] = parsed
      .filter((p) => p.matchedCard)
      .map((p) => ({ cardId: p.matchedCard!.id, qty: p.qty }));

    if (mode === 'replace') {
      setDeck(newEntries);
    } else {
      // Merge: add each card qty times
      for (const entry of newEntries) {
        for (let i = 0; i < entry.qty; i++) {
          addCard(entry.cardId);
        }
      }
    }

    setText('');
    onClose();
  }, [parsed, mode, setDeck, addCard, onClose]);

  const handleClose = useCallback(() => {
    setText('');
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-gf-border bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gf-border px-6 py-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-gf-text">Import Deck List</h2>
              <p className="text-xs text-gf-text-secondary mt-0.5">
                Paste a deck list to import cards into the Forge
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gf-text-muted hover:bg-gf-light hover:text-gf-text transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Mode toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gf-text">Import mode:</span>
              <div className="flex rounded-lg border border-gf-border overflow-hidden">
                <button
                  onClick={() => setMode('replace')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === 'replace'
                      ? 'bg-gf-blue text-white'
                      : 'bg-white text-gf-text-secondary hover:bg-gf-light'
                  }`}
                >
                  Replace Deck
                </button>
                <button
                  onClick={() => setMode('merge')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === 'merge'
                      ? 'bg-gf-blue text-white'
                      : 'bg-white text-gf-text-secondary hover:bg-gf-light'
                  }`}
                >
                  Merge Into Deck
                </button>
              </div>
              {mode === 'merge' && currentEntries.length > 0 && (
                <span className="text-[10px] text-gf-text-muted">
                  ({currentEntries.reduce((s, e) => s + e.qty, 0)} cards currently in deck)
                </span>
              )}
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={EXAMPLE_TEXT}
                className="w-full h-48 rounded-xl border border-gf-border bg-gf-light px-4 py-3 text-sm font-mono text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:ring-1 focus:ring-gf-blue/30 resize-none"
                spellCheck={false}
              />
            </div>

            {/* Preview */}
            {parsed.length > 0 && (
              <div className="rounded-xl border border-gf-border bg-gf-light/50 p-4 max-h-48 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gf-text">Preview</span>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-green-600 font-medium">{matchedCount} matched</span>
                    {unmatchedCount > 0 && (
                      <span className="text-red-500 font-medium">{unmatchedCount} unmatched</span>
                    )}
                    <span className="text-gf-text-secondary">{totalCards} total cards</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {parsed.map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                        p.matchedCard
                          ? 'bg-green-50 text-green-800'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {p.matchedCard ? (
                        <svg className="h-3 w-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      )}
                      <span className="font-mono">{p.qty}x</span>
                      <span className="truncate">
                        {p.matchedCard
                          ? `${p.matchedCard.name} (${p.matchedCard.id})`
                          : `"${p.nameOrId}" — not found`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gf-border px-6 py-4 bg-gf-light/30">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gf-border bg-white px-4 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={matchedCount === 0}
              className="rounded-lg bg-gf-blue px-4 py-2 text-xs font-bold text-white hover:bg-gf-blue-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {matchedCount > 0 ? `${totalCards} Cards` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
