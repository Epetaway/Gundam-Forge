/**
 * Deck Area Component
 * Shows face-down main deck
 * Click to draw cards
 */

'use client';

import React from 'react';

interface DeckAreaProps {
  deckSize: number;
  resourceDeckSize?: number;
  isOpponent: boolean;
  onDrawCard?: () => void;
}

export function DeckZone({
  deckSize,
  resourceDeckSize = 0,
  isOpponent,
  onDrawCard,
}: DeckAreaProps) {
  const totalDeck = deckSize + resourceDeckSize;
  const totalRequired = 60; // Official GCG: 50 main + 10 resource
  const deckComplete = totalDeck === totalRequired;
  const deckStatus = totalDeck < totalRequired 
    ? `${totalDeck}/${totalRequired} (need ${totalRequired - totalDeck} more)`
    : totalDeck > totalRequired
      ? `${totalDeck}/${totalRequired} (too many)`
      : `${totalDeck}/${totalRequired} ✓`;

  return (
    <div className="border-2 border-border rounded-lg bg-surface-elevated p-3">
      <div className="text-xs font-bold text-white uppercase mb-2 tracking-wider">
        {isOpponent ? 'Opponent' : 'Your'} Deck
      </div>

      {/* Main Deck Stack Visual */}
      <div
        className={`
          relative h-24 mb-3 flex items-center justify-center cursor-pointer
          transition-transform duration-200 hover:scale-105
        `}
        onClick={onDrawCard}
      >
        {deckSize > 0 ? (
          <div className="relative w-14">
            {[0, 1, 2].map(
              (i) =>
                i < Math.min(deckSize, 3) && (
                  <div
                    key={i}
                    className="absolute w-full h-16 bg-gradient-to-b from-indigo-600 to-indigo-900 rounded border-2 border-indigo-400 shadow-lg hover:shadow-indigo-500/50"
                    style={{
                      transform: `translateY(${i * 3}px)`,
                    }}
                  />
                ),
            )}
          </div>
        ) : (
          <div className="text-white text-sm italic">Deck empty</div>
        )}
      </div>

      {/* Official GCG Deck Breakdown */}
      <div className="space-y-2 mb-3">
        <div className="bg-blue-900/40 border border-blue-600 rounded-lg p-2">
          <div className="text-xs text-blue-300 mb-1">
            <strong>Main Deck:</strong> {deckSize} cards
          </div>
          <div className="text-xs text-blue-300">
            <strong>Resource Deck:</strong> {resourceDeckSize} cards
          </div>
          <div className={`text-xs font-semibold mt-1 ${
            deckComplete 
              ? 'text-green-300' 
              : totalDeck > totalRequired
                ? 'text-red-300'
                : 'text-amber-300'
          }`}>
            {deckStatus}
          </div>
        </div>
      </div>

      {/* Count Badge */}
      <div className="bg-indigo-900/50 border border-indigo-600 rounded-lg p-2 text-center">
        <div className="text-sm font-bold text-indigo-300">{deckSize} cards</div>
        <div className="text-xs text-white">Click to draw</div>
      </div>

      {/* Deck Status Warning */}
      {!isOpponent && totalDeck < totalRequired && (
        <div className="mt-2 px-2 py-1 bg-amber-900/50 border border-amber-600 rounded text-xs text-amber-300">
          ⚠️ Deck incomplete ({totalRequired - totalDeck} cards needed)
        </div>
      )}

      {!isOpponent && totalDeck > totalRequired && (
        <div className="mt-2 px-2 py-1 bg-red-900/50 border border-red-600 rounded text-xs text-red-300">
          ⚠️ Deck too large (remove {totalDeck - totalRequired} cards)
        </div>
      )}

      {deckSize < 5 && deckSize > 0 && (
        <div className="mt-2 px-2 py-1 bg-amber-900/50 border border-amber-600 rounded text-xs text-amber-300">
          ⚠️ Main deck running low
        </div>
      )}

      {deckSize === 0 && (
        <div className="mt-2 px-2 py-1 bg-red-900/50 border border-red-600 rounded text-xs text-red-300">
          ⚠️ Main deck is empty
        </div>
      )}
    </div>
  );
}
