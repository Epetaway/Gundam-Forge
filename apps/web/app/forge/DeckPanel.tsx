'use client';

import * as React from 'react';
import { Minus, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { DeckBuilderState, CardSummaryForDeck } from './useDeckBuilder';

// ─── constants ────────────────────────────────────────────────────────────────

const TYPE_ORDER = ['Unit', 'Pilot', 'Command', 'Base', 'Resource'] as const;

// ─── main panel ──────────────────────────────────────────────────────────────

interface DeckPanelProps {
  state: DeckBuilderState;
  isAuthenticated: boolean;
  onSave?: () => void;
}

export function DeckPanel({ state, isAuthenticated, onSave }: DeckPanelProps): JSX.Element {
  const { deck, deckName, setDeckName, addCard, removeCard, totalCards, validation, cardCache } =
    state;

  // Build grouped structure: type → sorted entries
  const grouped = React.useMemo(() => {
    const groups: Record<string, Array<{ cardId: string; qty: number; card: CardSummaryForDeck }>> =
      {};

    for (const [cardId, qty] of Object.entries(deck)) {
      const card = cardCache.get(cardId);
      if (!card) continue;
      const bucket = card.type || 'Other';
      if (!groups[bucket]) groups[bucket] = [];
      groups[bucket].push({ cardId, qty, card });
    }

    // Sort within each group by cost ascending, then name
    for (const entries of Object.values(groups)) {
      entries.sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name));
    }

    return groups;
  }, [deck, cardCache]);

  const orderedTypes = [
    ...TYPE_ORDER.filter((t) => grouped[t]),
    ...Object.keys(grouped).filter((t) => !(TYPE_ORDER as readonly string[]).includes(t)),
  ];

  const totalMain = validation?.totalMain ?? 0;
  const countColor =
    totalMain === 50 ? 'text-green-400' : totalMain > 50 ? 'text-red-400' : 'text-foreground';

  return (
    <div className="flex h-full flex-col">
      {/* ── Deck meta ──────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-border p-3">
        <input
          aria-label="Deck name"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-steel-500 focus-visible:underline focus-visible:decoration-ring"
          onChange={(e) => setDeckName(e.target.value)}
          placeholder="Untitled Deck"
          value={deckName}
        />
        <p className="mt-0.5 text-[11px] text-steel-600">
          <span className={cn('font-semibold tabular-nums', countColor)}>{totalMain}</span>
          <span className="text-steel-700">/50</span>
          {' '}main
          {validation?.totalResource ? (
            <span>
              {' · '}
              <span className={cn('font-semibold tabular-nums', validation.totalResource === 10 ? 'text-green-400' : 'text-red-400')}>
                {validation.totalResource}
              </span>
              <span className="text-steel-700">/10</span>
              {' '}resource
            </span>
          ) : null}
        </p>
      </div>

      {/* ── Validation banner ──────────────────────────────── */}
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="flex-shrink-0 border-b border-border">
          {validation.errors.map((err) => (
            <div className="flex items-start gap-1.5 bg-red-500/10 px-3 py-1.5" key={err}>
              <span className="mt-0.5 text-[10px] font-bold text-red-400">✕</span>
              <p className="text-[11px] text-red-300">{err}</p>
            </div>
          ))}
          {validation.warnings.map((warn) => (
            <div className="flex items-start gap-1.5 bg-yellow-500/10 px-3 py-1.5" key={warn}>
              <span className="mt-0.5 text-[10px] font-bold text-yellow-400">⚠</span>
              <p className="text-[11px] text-yellow-300">{warn}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Deck list ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {orderedTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-xs font-semibold text-foreground">Your deck is empty</p>
            <p className="text-[11px] text-steel-600">
              Search the card pool on the left and click + to add cards
            </p>
          </div>
        ) : (
          orderedTypes.map((typeName) => {
            const entries = grouped[typeName] ?? [];
            const groupTotal = entries.reduce((sum, e) => sum + e.qty, 0);
            return (
              <section key={typeName}>
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-3 py-1 backdrop-blur">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
                    {typeName}
                  </h3>
                  <span className="font-mono text-[10px] text-steel-600">{groupTotal}</span>
                </header>
                <ul>
                  {entries.map(({ cardId, qty, card }) => (
                    <DeckEntryRow
                      card={card}
                      cardId={cardId}
                      key={cardId}
                      onAdd={() => addCard(card)}
                      onRemove={() => removeCard(cardId)}
                      qty={qty}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {/* ── Footer actions ─────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-border p-3">
        {isAuthenticated ? (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-md bg-cobalt-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={totalCards === 0}
            onClick={onSave}
            type="button"
          >
            <Save className="h-4 w-4" />
            Save Deck
          </button>
        ) : (
          <div className="rounded-md border border-cobalt-500/30 bg-cobalt-500/10 p-3 text-center">
            <p className="text-xs font-semibold text-cobalt-300">Sign in to save your deck</p>
            <p className="mt-0.5 text-[10px] text-steel-600">
              Your deck is safe for this session
            </p>
            <a
              className="mt-2 inline-block rounded-sm border border-cobalt-500/40 px-3 py-1 text-[11px] font-bold text-cobalt-300 transition-colors hover:bg-cobalt-500/20"
              href="/auth/login"
            >
              Sign in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DeckEntryRow ─────────────────────────────────────────────────────────────

interface DeckEntryRowProps {
  cardId: string;
  card: CardSummaryForDeck;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}

function DeckEntryRow({ card, qty, onAdd, onRemove }: DeckEntryRowProps): JSX.Element {
  const atMax = qty >= 4;
  return (
    <li className="group flex items-center gap-1.5 px-3 py-1 hover:bg-surface-interactive">
      {/* Cost */}
      <span className="w-4 flex-shrink-0 text-center font-mono text-[10px] tabular-nums text-steel-600">
        {card.cost}
      </span>

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {card.name}
      </span>

      {/* Qty controls — revealed on hover (desktop) / always on mobile */}
      <div
        className={cn(
          'flex flex-shrink-0 items-center gap-0.5',
          'sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100',
        )}
      >
        <button
          aria-label={`Remove one ${card.name}`}
          className="flex h-5 w-5 items-center justify-center rounded text-steel-600 hover:bg-red-500/20 hover:text-red-400"
          onClick={onRemove}
          type="button"
        >
          <Minus className="h-2.5 w-2.5" />
        </button>
        <span className="w-4 text-center font-mono text-xs font-bold tabular-nums text-foreground">
          {qty}
        </span>
        <button
          aria-label={`Add one ${card.name}`}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded',
            atMax
              ? 'cursor-not-allowed text-steel-700 opacity-40'
              : 'text-steel-600 hover:bg-cobalt-500/20 hover:text-cobalt-300',
          )}
          disabled={atMax}
          onClick={onAdd}
          type="button"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Qty badge shown when controls are hidden */}
      <span className="flex-shrink-0 font-mono text-[10px] text-steel-600 sm:group-hover:hidden">
        ×{qty}
      </span>
    </li>
  );
}
