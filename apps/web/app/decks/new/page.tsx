'use client';
import React from 'react';
import Link from 'next/link';
import { DeckSetupProvider } from '@/components/deck/DeckSetupContext';
import DeckSetupForm from '@/components/deck/DeckSetupForm';
import DeckPreviewPanel from '@/components/deck/DeckPreviewPanel';
import { cards } from '@/lib/data/cards';

export default function CreateDeckPage() {
  return (
    <DeckSetupProvider>
      <div className="flex min-h-[calc(100vh-4rem)] bg-background">
        {/* Left Panel: Form */}
        <div className="w-full max-w-md flex-shrink-0 border-r border-border bg-surface p-8 flex flex-col justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt-300 mb-1">Forge</p>
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground mb-6">
              Create New Deck
            </h1>
            <DeckSetupForm cards={cards} />
          </div>
          <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6">
            <Link
              className="text-sm text-cobalt-300 hover:text-cobalt-200 hover:underline"
              href="/decks"
            >
              ← Browse existing decks
            </Link>
            <Link
              className="text-sm text-steel-600 hover:text-foreground hover:underline"
              href="/"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex flex-1 items-center justify-center p-8 bg-surface-muted">
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <DeckPreviewPanel />
            <p className="text-xs text-steel-600 text-center">
              Your deck will be created when you click "Create Deck &amp; Open Forge".<br />
              You can always add more cards inside the Forge builder.
            </p>
          </div>
        </div>
      </div>
    </DeckSetupProvider>
  );
}
