/**
 * Battle Area Zone Component
 * Largest zone where units fight during battle phase
 * Supports 5+ units per row with attack/defense display
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';
import { CardStack } from '../CardStack';

interface BattleAreaZoneProps {
  units: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
  onUnitSelected?: (unit: CardInstance) => void;
}

export function BattleAreaZone({
  units,
  cardDatabase,
  isOpponent,
  onUnitSelected,
}: BattleAreaZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: isOpponent ? 'opponent-battle' : 'battle',
    data: { zone: isOpponent ? 'opponent-battle' : 'battle' },
  });

  return (
    <div
      ref={isOpponent ? undefined : setNodeRef}
      className={`border-2 rounded-lg bg-slate-800/70 p-4 h-full flex flex-col transition-colors ${
        !isOpponent && isOver ? 'border-green-500 bg-green-900/20' : 'border-slate-700'
      }`}
    >
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        {isOpponent ? 'Opponent' : 'Your'} Battle Area
      </div>

      {/* Battle Grid */}
      <div className="flex-1 grid gap-3 overflow-y-auto max-h-96">
        {units.length > 0 ? (
          units.map((unit) => (
            <div
              key={unit.instanceId}
              className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-600 bg-gradient-to-b from-slate-700 to-slate-800 hover:border-purple-500 transition-all duration-200 cursor-pointer"
              onClick={() => onUnitSelected?.(unit)}
            >
              <div className="flex-shrink-0">
                <CardStack
                  cards={unit}
                  cardDatabase={cardDatabase}
                  variant="normal"
                  showCount={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-200 truncate">
                  {getCardById(unit.cardId)?.name || unit.cardId}
                </div>
                <div className="flex gap-4 mt-1 text-base font-bold">
                  <div className="text-red-400">⚔️ {(getCardById(unit.cardId) as any)?.ap ?? 0}</div>
                  <div className="text-blue-400">🛡️ {(getCardById(unit.cardId) as any)?.hp ?? 0}</div>
                </div>
                {unit.damageMarkers > 0 && (
                  <div className="mt-1 text-sm text-red-400 font-bold">Damage: {unit.damageMarkers}</div>
                )}
                {unit.state === 'rest' && (
                  <div className="mt-1 text-sm text-slate-400 italic">RESTING</div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm font-medium">
            Battle area empty
          </div>
        )}
      </div>

      {/* Unit Count */}
      <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
        Units in battle: {units.length}
      </div>
    </div>
  );
}
