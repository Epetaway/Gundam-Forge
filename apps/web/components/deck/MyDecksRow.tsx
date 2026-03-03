'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllStoredDecks, type StoredDeck } from '@/lib/deck/storage';
import { Button } from '@/components/ui/Button';

/**
 * Displays the user's locally-stored decks on the home page.
 * Reads from localStorage — client-only. Returns null when there are no decks.
 */
export function MyDecksRow() {
  const [decks, setDecks] = useState<StoredDeck[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const all = getAllStoredDecks();
    // Sort by most recently updated, show up to 3
    const sorted = [...all].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    setDecks(sorted.slice(0, 3));
  }, []);

  if (!mounted || decks.length === 0) return null;

  return (
    <section className="py-8 border-b border-border">
      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-foreground">Your Decks</h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/forge">View all →</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => {
            const colors: string[] = deck.deckIntent?.colors ?? [];
            const cardCount = deck.entries.reduce((sum, e) => sum + e.qty, 0);
            const updated = new Date(deck.updatedAt);
            const diffMs = Date.now() - updated.getTime();
            const diffHours = Math.floor(diffMs / 3_600_000);
            const diffDays = Math.floor(diffMs / 86_400_000);
            const ago =
              diffHours < 1
                ? 'just now'
                : diffHours < 24
                ? `${diffHours}h ago`
                : `${diffDays}d ago`;

            return (
              <Link
                key={deck.id}
                href={`/forge/decks/${deck.id}`}
                className="group rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-cobalt-600/60 hover:bg-surface-interactive"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground truncate group-hover:text-cobalt-300 transition-colors">
                    {deck.name}
                  </p>
                  <span className="flex-shrink-0 text-[10px] text-steel-600">{ago}</span>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-steel-600">{cardCount} cards</span>
                  {colors.length > 0 && (
                    <span className="text-steel-700">·</span>
                  )}
                  <span className="text-xs text-steel-600">{colors.join(', ')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
