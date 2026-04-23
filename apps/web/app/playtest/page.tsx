'use client';

import React from 'react';
import Link from 'next/link';
import { validateDeck } from '@gundam-forge/shared';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';
import { getStoredDeck } from '@/lib/deck/storage';
import { getDeckById } from '@/lib/data/decks';
import { cards, cardsRecord } from '@/lib/data/cards';
import type { DeckRecord } from '@/lib/data/decks';

type PlaytestMode = 'versus' | 'goldfish';

function ModeSelector({
  deckName,
  onSelect,
}: {
  deckName: string;
  onSelect: (mode: PlaytestMode) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[#0a0e1a] px-6">
      <div className="text-center space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-blue-400">Playtest Mode</p>
        <h1 className="text-2xl font-bold text-white">{deckName}</h1>
        <p className="text-sm text-white/50">Choose how you want to test this deck</p>
      </div>

      <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
        {/* Goldfish */}
        <button
          onClick={() => onSelect('goldfish')}
          className="group flex flex-col gap-3 rounded-xl border border-blue-500/30 bg-blue-950/30 p-6 text-left transition hover:border-blue-400/60 hover:bg-blue-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐟</span>
            <span className="text-base font-bold text-white">Goldfish</span>
            <span className="ml-auto rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-blue-300">
              Recommended
            </span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Play solitaire-style with no opponent. Test your deck&apos;s speed, consistency, and combo lines turn-by-turn.
          </p>
          <ul className="space-y-1 text-xs text-white/40">
            <li>✓ No opponent board</li>
            <li>✓ Stats: turns to first unit, cards played</li>
            <li>✓ Unlimited turns — end when you&apos;re done</li>
          </ul>
        </button>

        {/* VS Bot */}
        <button
          onClick={() => onSelect('versus')}
          className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-white/20 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <span className="text-base font-bold text-white">VS Bot</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Play a full match against an AI opponent. Test your deck in a competitive setting with full rules enforcement.
          </p>
          <ul className="space-y-1 text-xs text-white/40">
            <li>✓ Full two-player game</li>
            <li>✓ AI opponent with strategy</li>
            <li>✓ Win/loss conditions</li>
          </ul>
        </button>
      </div>

      <Link
        href="/decks"
        className="text-xs text-white/30 transition hover:text-white/60"
      >
        ← Back to Decks
      </Link>
    </div>
  );
}

export default function PlaytestPage() {
  const [deck, setDeck] = React.useState<DeckRecord | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<PlaytestMode | null>(() => {
    if (typeof window === 'undefined') return null;
    const m = new URLSearchParams(window.location.search).get('mode');
    if (m === 'versus' || m === 'goldfish') return m as PlaytestMode;
    return null;
  });

  React.useEffect(() => {
    const deckId = new URLSearchParams(window.location.search).get('deckId');

    if (!deckId) {
      setError('No deck ID provided. Navigate here from the Forge or a deck page.');
      return;
    }

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

    const catalogDeck = getDeckById(deckId);
    if (catalogDeck) {
      setDeck(catalogDeck);
      return;
    }

    setError(
      `Deck "${deckId}" was not found in your saved decks or the catalog. It may have been deleted.`,
    );
  }, []);

  const handleModeSelect = React.useCallback((selected: PlaytestMode) => {
    setMode(selected);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', selected);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a0e1a] px-6">
        <p className="text-lg font-bold text-red-400">Cannot Start Playtest</p>
        <p className="max-w-sm text-center text-sm text-white/70">{error}</p>
        <div className="flex gap-4">
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
        <div className="flex gap-4 pt-2">
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

  if (!mode) {
    return <ModeSelector deckName={deck.name} onSelect={handleModeSelect} />;
  }

  return (
    <PlaytestGameEnhanced
      playerDeck={deck}
      opponentDeckId="token-colorless-bot"
      cardDatabase={cardsRecord}
      mode={mode}
      onGameEnd={(winner, reason) => {
        console.log(`Game ended — winner: ${winner}, reason: ${reason}`);
      }}
    />
  );
}
