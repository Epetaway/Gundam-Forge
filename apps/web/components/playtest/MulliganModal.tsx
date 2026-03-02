/**
 * Mulligan Modal Component
 * Allows player to keep or redraw their opening hand
 */

'use client';

import React, { useState } from 'react';
import { CardInstance } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { SETUP_RULES } from '@/lib/game/rules-constants';

interface MulliganModalProps {
  hand: CardInstance[];
  cardDatabase: Record<string, any>;
  onMulliganAccept: () => void;
  onMulliganReject: () => void;
  isLoading?: boolean;
}

export function MulliganModal({
  hand,
  cardDatabase,
  onMulliganAccept,
  onMulliganReject,
  isLoading = false,
}: MulliganModalProps) {
  const [choice, setChoice] = useState<'keep' | 'mulligan' | null>(null);

  const handleConfirm = () => {
    if (choice === 'keep') {
      onMulliganReject();
      return;
    }

    if (choice === 'mulligan') {
      onMulliganAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-elevated border-2 border-cobalt-600 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Mulligan Decision</h2>
          <p className="text-steel-300">
            You can redraw your entire opening hand one time. What would you like to do?
          </p>
        </div>

        {/* Hand Display */}
        <div className="mb-8">
          <p className="text-sm text-steel-500 mb-3">Your opening hand ({hand.length} cards):</p>
          <div className="flex gap-2 overflow-x-auto pb-2 max-h-48">
            {hand.map((card) => {
              const cardDef = cardDatabase[card.cardId];
              return (
                <div
                  key={card.instanceId}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="relative w-24 h-32 rounded border-2 border-border overflow-hidden hover:border-steel-400 transition shadow-md">
                    {cardDef ? (
                      <CardArtImage
                        card={cardDef}
                        alt={cardDef.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-muted flex items-center justify-center">
                        <span className="text-xs text-steel-500 text-center px-1">
                          {card.cardId}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-steel-300 text-center w-24 truncate">
                    {cardDef?.name || card.cardId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-surface-muted/50 rounded border border-border">
            <div className="text-sm font-semibold text-steel-300 mb-2">Keep This Hand</div>
            <p className="text-xs text-steel-500">
              Proceed with your current opening hand. You cannot mulligan again.
            </p>
          </div>
          <div className="p-4 bg-surface-muted/50 rounded border border-border">
            <div className="text-sm font-semibold text-steel-300 mb-2">Mulligan (Redraw)</div>
            <p className="text-xs text-steel-500">
              Shuffle all cards back into your deck and draw {SETUP_RULES.openingHandSize} new cards. This is your only mulligan.
            </p>
          </div>
        </div>

        {/* Selection Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setChoice('keep')}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded font-semibold transition ${
              choice === 'keep'
                ? 'bg-green-600 text-white'
                : 'bg-surface-elevated text-steel-200 hover:bg-surface border border-border'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Keep This Hand
          </button>

          <button
            onClick={() => setChoice('mulligan')}
            disabled={isLoading}
            className={`flex-1 py-3 px-4 rounded font-semibold transition ${
              choice === 'mulligan'
                ? 'bg-cobalt-600 text-white'
                : 'bg-surface-elevated text-steel-200 hover:bg-surface border border-border'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Mulligan (Redraw)
          </button>
        </div>

        {/* Confirm Action */}
        <div className="mt-4">
          <button
            onClick={handleConfirm}
            disabled={isLoading || choice === null}
            className="w-full py-3 px-4 rounded font-semibold transition bg-cobalt-600 text-white hover:bg-cobalt-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? 'Applying choice...'
              : choice === 'mulligan'
                ? `Confirm Mulligan (${SETUP_RULES.openingHandSize} card redraw)`
                : choice === 'keep'
                  ? 'Confirm Keep Hand'
                  : 'Choose an option to continue'}
          </button>
        </div>

        {/* Rules Reference */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Official Mulligan Rule: Each player may mulligan their opening hand only once.
            A mulligan reshuffles the entire opening hand and redraws {SETUP_RULES.openingHandSize} cards.
          </p>
        </div>
      </div>
    </div>
  );
}
