/**
 * Trash Area Component
 * Shows discarded/destroyed cards
 * Scrollable for viewing card history
 */

'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';
import { CardStack } from '../CardStack';

interface TrashAreaProps {
  trash: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
}

export function TrashArea({
  trash,
  cardDatabase,
  isOpponent,
}: TrashAreaProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: isOpponent ? 'opponent-trash' : 'trash',
    data: { zone: isOpponent ? 'opponent-trash' : 'trash' },
  });

  return (
    <div
      ref={isOpponent ? undefined : setNodeRef}
      className={`border-2 rounded-lg bg-slate-800/70 p-3 transition-colors ${
        !isOpponent && isOver ? 'border-red-500 bg-red-900/20' : 'border-slate-700'
      }`}
    >
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        Trash ({trash.length})
      </div>

      {/* Trash Stack Visual - Using CardStack */}
      <div className="mb-3 flex items-center justify-center">
        {trash.length > 0 ? (
          <CardStack
            cards={trash}
            cardDatabase={cardDatabase}
            variant="compact"
            showCount={true}
            className="flex justify-center"
          />
        ) : (
          <div className="text-slate-600 text-xs italic py-4">Empty</div>
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
