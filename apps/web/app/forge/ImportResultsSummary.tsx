'use client';
import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { parseDeckList } from './parseDeckList';
import { matchDeckEntries } from './cardMatching';
import type { CardMatchResult } from './cardMatching';

interface ImportResultsPanelProps {
  results: CardMatchResult;
  cards: { id: string; name: string }[];
  onResolveAmbiguous: (originalLine: string, cardId: string, qty: number) => void;
  onRetryUnmatched: (originalLine: string, cardId: string, qty: number) => void;
  onDismiss: () => void;
}

export function ImportResultsSummary({
  results,
  cards,
  onResolveAmbiguous,
  onRetryUnmatched,
  onDismiss,
}: ImportResultsPanelProps) {
  const [showMatched, setShowMatched] = useState(false);
  const [retryInputs, setRetryInputs] = useState<Record<string, string>>({});

  const hasIssues = results.ambiguous.length > 0 || results.unmatched.length > 0;

  const handleRetry = (originalLine: string) => {
    const text = retryInputs[originalLine]?.trim();
    if (!text) return;
    const parsed = parseDeckList(text);
    if (parsed.length === 0) return;
    const result = matchDeckEntries(parsed, cards);
    if (result.matched.length > 0) {
      const { entry, card } = result.matched[0];
      onRetryUnmatched(originalLine, card.id, entry.qty);
      setRetryInputs((prev) => {
        const n = { ...prev };
        delete n[originalLine];
        return n;
      });
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-muted/80 backdrop-blur-sm mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Import Results</span>
          {hasIssues ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Needs attention
            </span>
          ) : (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-400">
              All matched
            </span>
          )}
        </div>
        <button
          aria-label="Dismiss import results"
          className="rounded p-1 text-steel-600 hover:text-foreground transition-colors"
          onClick={onDismiss}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {/* Matched */}
        {results.matched.length > 0 && (
          <section className="px-4 py-3">
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowMatched((v) => !v)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-foreground">
                  {results.matched.length} card{results.matched.length !== 1 ? 's' : ''} matched
                </span>
              </div>
              {showMatched ? (
                <ChevronUp className="h-3.5 w-3.5 text-steel-600" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-steel-600" />
              )}
            </button>
            {showMatched && (
              <ul className="mt-2 space-y-1">
                {results.matched.map(({ entry, card }) => (
                  <li className="flex items-center gap-2 text-xs text-steel-600" key={entry.originalLine}>
                    <span className="font-mono font-semibold text-cobalt-300">{entry.qty}x</span>
                    <span className="text-foreground">{card.name}</span>
                    <span className="text-steel-700">({card.id})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Ambiguous */}
        {results.ambiguous.length > 0 && (
          <section className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-foreground">
                {results.ambiguous.length} ambiguous — pick the right card
              </span>
            </div>
            <ul className="space-y-3">
              {results.ambiguous.map(({ entry, options }) => (
                <li key={entry.originalLine}>
                  <p className="text-[11px] text-steel-600 mb-1">
                    Line: <span className="font-mono text-steel-500">"{entry.originalLine}"</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-cobalt-300 w-6">
                      {entry.qty}x
                    </span>
                    <select
                      className="flex-1 h-8 rounded border border-border bg-surface-interactive px-2 text-xs text-foreground outline-none focus-visible:border-ring"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onResolveAmbiguous(entry.originalLine, e.target.value, entry.qty);
                        }
                      }}
                    >
                      <option value="">Select correct card…</option>
                      {options.map((card: { id: string; name: string }) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Unmatched */}
        {results.unmatched.length > 0 && (
          <section className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-foreground">
                {results.unmatched.length} not found — edit &amp; retry
              </span>
            </div>
            <ul className="space-y-3">
              {results.unmatched.map((entry) => (
                <li key={entry.originalLine}>
                  <p className="text-[11px] text-steel-600 mb-1">
                    Original:{' '}
                    <span className="font-mono text-steel-500">"{entry.originalLine}"</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 h-8 rounded border border-border bg-surface-interactive px-2 text-xs text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring"
                      defaultValue={entry.originalLine}
                      onChange={(e) =>
                        setRetryInputs((prev) => ({
                          ...prev,
                          [entry.originalLine]: e.target.value,
                        }))
                      }
                      placeholder="Correct card name…"
                      type="text"
                    />
                    <button
                      className={cn(
                        'h-8 rounded bg-cobalt-600 px-3 text-xs font-semibold text-white hover:bg-cobalt-500 transition-colors',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                      disabled={!retryInputs[entry.originalLine]?.trim()}
                      onClick={() => handleRetry(entry.originalLine)}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
