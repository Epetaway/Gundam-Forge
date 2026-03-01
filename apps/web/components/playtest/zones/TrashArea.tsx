/**
 * Trash Area Component
 * Shows discarded/destroyed cards
 * Scrollable for viewing card history
 */

'use client';

import React, { useState } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';

interface TrashAreaProps {
  trash: CardInstance[];
  isOpponent: boolean;
}

export function TrashArea({
  trash,
  isOpponent,
}: TrashAreaProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border-2 border-slate-700 rounded-lg bg-slate-800/70 p-3">
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        Trash ({trash.length})
      </div>

      {/* Trash Stack Visual */}
      <div className="relative h-16 mb-3 flex items-center justify-center">
        {trash.length > 0 ? (
          <div className="relative w-12">
            {[0, 1, 2].map(
              (i) =>
                i < Math.min(trash.length, 3) && (
                  <div
                    key={i}
                    className="absolute w-full h-10 bg-gradient-to-b from-red-600/70 to-red-800/70 rounded border-2 border-red-500 shadow-md"
                    style={{
                      transform: `translateY(${i * 2}px) rotate(${i * 5}deg)`,
                    }}
                  />
                ),
            )}
          </div>
        ) : (
          <div className="text-slate-600 text-xs italic">Empty</div>
        )}
      </div>

      {/* Recent Cards Button */}
      {trash.length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-2 py-1.5 bg-red-700/50 hover:bg-red-700 border border-red-600 rounded text-xs text-red-200 transition-colors"
        >
          {showDetails ? 'Hide' : 'View'} {trash.length > 3 ? 'recent (3)' : 'all'}
        </button>
      )}

      {/* Recent Cards List */}
      {showDetails && trash.length > 0 && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
          {trash
            .slice(-3)
            .reverse()
            .map((card) => {
              const cardDef = getCardById(card.cardId);
              return (
                <div
                  key={card.instanceId}
                  className="text-[9px] text-slate-400 px-1.5 py-1 bg-slate-900/50 rounded border border-slate-700"
                >
                  {cardDef?.name || card.cardId}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
