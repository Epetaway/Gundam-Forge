/**
 * Player Hand Component
 * Displays cards in hand with play options
 */

'use client';

import React from 'react';
import type { CardInstance, Phase } from '@/lib/game/game-engine';

interface PlayerHandProps {
  cards: CardInstance[];
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  gamePhase: Phase;
  isPlayerTurn: boolean;
}

export function PlayerHand({
  cards,
  selectedCard,
  onSelectCard,
  onPlayCard,
  gamePhase,
  isPlayerTurn,
}: PlayerHandProps) {
  const canPlayCards = gamePhase === 'main' && isPlayerTurn;

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.length > 0 ? (
        cards.map((card) => (
          <div
            key={card.instanceId}
            onClick={() => onSelectCard(card)}
            className={`p-3 rounded border-2 cursor-pointer transition ${
              selectedCard?.instanceId === card.instanceId
                ? 'border-yellow-400 bg-yellow-900/30'
                : 'border-slate-600 bg-slate-800 hover:border-slate-500'
            }`}
          >
            <div className="text-sm font-bold mb-1">{card.cardId}</div>

            {selectedCard?.instanceId === card.instanceId && canPlayCards && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayCard(card);
                }}
                className="w-full mt-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold transition"
              >
                Play Card
              </button>
            )}

            {selectedCard?.instanceId === card.instanceId && !canPlayCards && (
              <div className="text-xs text-slate-400 mt-2">
                Can only play in Main Phase
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="col-span-2 text-center text-slate-500 py-8">
          No cards in hand
        </div>
      )}
    </div>
  );
}
