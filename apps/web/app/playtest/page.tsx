'use client';

import React from 'react';
import Link from 'next/link';
import { validateDeck } from '@gundam-forge/shared';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';
import { getStoredDeck } from '@/lib/deck/storage';
import { getDeckById } from '@/lib/data/decks';
import { cards, cardsRecord } from '@/lib/data/cards';
import type { DeckRecord } from '@/lib/data/decks';

/**
 * /playtest?deckId=<id>
 *
 * Resolves the deck from:
 *   1. localStorage — user's Forge-built StoredDeck
 *   2. Catalog — DeckRecord from the deck catalog
 *
 * StoredDeck and DeckRecord both have `entries: Array<{cardId, qty}>` so
 * conversion is straightforward.
 */
export default function PlaytestPage() {
  const [deck, setDeck] = React.useState<DeckRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const deckId = new URLSearchParams(window.location.search).get('deckId');

    if (!deckId) {
      setError('No deck ID provided. Navigate here from the Forge or a deck page.');
      return;
    }

    // Try localStorage first (Forge-built deck)
    const stored = getStoredDeck(deckId);
    if (stored) {
      const asRecord: DeckRecord = {
        id: stored.id,
        name: stored.name,
        description: stored.description,
        archetype: stored.deckIntent?.packages?.[0] ?? 'Custom',
        owner: 'You',
        colors: stored.deckIntent?.colors ?? [],
        likes: 0,
        views: 0,
        entries: stored.entries,
      };
      setDeck(asRecord);
      return;
    }

    // Fall back to catalog deck
    const catalogDeck = getDeckById(deckId);
    if (catalogDeck) {
      setDeck(catalogDeck);
      return;
    }

    setError(
      `Deck "${deckId}" was not found in your saved decks or the catalog. It may have been deleted.`,
    );
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a0e1a] px-6">
        <p className="text-lg font-bold text-red-400">Cannot Start Playtest</p>
        <p className="max-w-sm text-center text-sm text-white/70">{error}</p>
        <div className="flex gap-3">
          <Link
            href="/forge"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Go to Forge
          </Link>
          <Link
            href="/decks"
            className="rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40"
          >
            Browse Decks
          </Link>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a0e1a]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm text-white/60">Loading deck...</p>
      </div>
    );
  }

  // Validate deck before playtesting
  const validation = validateDeck(deck.entries, cards);
  if (!validation.isValid) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a0e1a] px-6">
        <p className="text-lg font-bold text-red-400">Deck Is Invalid</p>
        <p className="max-w-sm text-center text-sm text-white/70">
          This deck cannot be playtested because it has the following issues:
        </p>
        <ul className="max-w-md space-y-1 text-sm text-red-300">
          {validation.errors.map((err, i) => (
            <li key={i}>• {err}</li>
          ))}
        </ul>
        <div className="flex gap-3 pt-2">
          <Link
            href="/forge"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Fix in Forge →
          </Link>
          <Link
            href="/decks"
            className="rounded border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40"
          >
            Browse Decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PlaytestGameEnhanced
      playerDeck={deck}
      opponentDeckId="token-colorless-bot"
      cardDatabase={cardsRecord}
      onGameEnd={(winner, reason) => {
        console.log(`Game ended — winner: ${winner}, reason: ${reason}`);
      }}
    />
  );
}
