/**
 * Resource Deck Area Component
 * Shows face-down resource deck stack
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';

interface ResourceDeckAreaProps {
  resourceDeck: CardInstance[];
  isOpponent: boolean;
}

export function ResourceDeckArea({
  resourceDeck,
  isOpponent,
}: ResourceDeckAreaProps) {
  return (
    <div className="border-2 border-slate-700 rounded-lg bg-slate-800/70 p-3">
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        Resource Deck
      </div>

      {/* Deck Stack Visual */}
      <div className="relative h-20 mb-3 flex items-center justify-center">
        {resourceDeck.length > 0 ? (
          <div className="relative w-12">
            {[0, 1, 2].map(
              (i) =>
                i < Math.min(resourceDeck.length, 3) && (
                  <div
                    key={i}
                    className="absolute w-full h-12 bg-gradient-to-b from-cyan-600 to-cyan-800 rounded border-2 border-cyan-400 shadow-md"
                    style={{
                      transform: `translateY(${i * 2}px)`,
                    }}
                  />
                ),
            )}
          </div>
        ) : (
          <div className="text-slate-600 text-xs italic">Empty</div>
        )}
      </div>

      {/* Count Badge */}
      <div className="bg-cyan-900/50 border border-cyan-600 rounded-lg p-2 text-center">
        <div className="text-xs font-bold text-cyan-300">
          {resourceDeck.length} cards
        </div>
      </div>
    </div>
  );
}
