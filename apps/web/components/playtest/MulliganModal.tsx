/**
 * Mulligan Modal Component
 * Allows player to keep or redraw their opening hand
 */

'use client';

import React, { useState } from 'react';
import { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';

interface MulliganModalProps {
  hand: CardInstance[];
  onMulliganAccept: () => void;
  onMulliganReject: () => void;
  isLoading?: boolean;
}

export function MulliganModal({
  hand,
  onMulliganAccept,
  onMulliganReject,
  isLoading = false,
}: MulliganModalProps) {
  const [choice, setChoice] = useState<'keep' | 'mulligan' | null>(null);

  const handleKeep = () => {
    setChoice('keep');
    setTimeout(() => onMulliganReject(), 500);
  };

  const handleMulligan = () => {
    setChoice('mulligan');
    setTimeout(() => onMulliganAccept(), 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border-2 border-purple-600 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Mulligan Decision</h2>
          <p className="text-slate-300">
            You can redraw your entire opening hand one time. What would you like to do?
          </p>
        </div>

        {/* Hand Display */}
        <div className="mb-8">
          <p className="text-sm text-slate-400 mb-3">Your opening hand (7 cards):</p>
          <div className="grid grid-cols-7 gap-2 max-h-24 overflow-y-auto">
            {hand.map((card) => {
              const cardDef = getCardById(card.cardId);
              return (
                <div
                  key={card.instanceId}
                  className="flex flex-col items-center gap-1 p-2 bg-slate-700/50 rounded border border-slate-600 hover:border-slate-400 transition"
                >
                  <img
                    src={cardDef?.imageUrl || '/images/placeholder.png'}
                    alt={cardDef?.name || card.cardId}
                    className="w-full h-16 object-cover rounded"
                  />
                  <span className="text-xs text-slate-300 text-center truncate w-full">
                    {cardDef?.name || card.cardId}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-slate-700/50 rounded border border-slate-600">
            <div className="text-sm font-semibold text-slate-300 mb-2">Keep This Hand</div>
            <p className="text-xs text-slate-400">
              Proceed with your current opening hand. You cannot mulligan again.
            </p>
          </div>
          <div className="p-4 bg-slate-700/50 rounded border border-slate-600">
            <div className="text-sm font-semibold text-slate-300 mb-2">Mulligan (Redraw)</div>
            <p className="text-xs text-slate-400">
              Shuffle all cards back into your deck and draw 7 new cards. This is your only mulligan.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleKeep}
            disabled={isLoading || choice !== null}
            className={`flex-1 py-3 px-4 rounded font-semibold transition ${
              choice === 'keep' || isLoading
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {choice === 'keep' && isLoading ? 'Keeping hand...' : 'Keep This Hand'}
          </button>

          <button
            onClick={handleMulligan}
            disabled={isLoading || choice !== null}
            className={`flex-1 py-3 px-4 rounded font-semibold transition ${
              choice === 'mulligan' || isLoading
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {choice === 'mulligan' && isLoading ? 'Redrawing hand...' : 'Mulligan (Redraw)'}
          </button>
        </div>

        {/* Rules Reference */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            📋 Official Mulligan Rule: Each player may mulligan (redraw) their opening hand once.
            Mulligan is performed by shuffling all 7 cards back into your deck and drawing 7 new cards.
          </p>
        </div>
      </div>
    </div>
  );
}
