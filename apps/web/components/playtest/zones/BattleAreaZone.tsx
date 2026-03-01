/**
 * Battle Area Zone Component
 * Largest zone where units fight during battle phase
 * Supports 5+ units per row with attack/defense animation
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';

interface BattleAreaZoneProps {
  units: CardInstance[];
  isOpponent: boolean;
  onUnitSelected?: (unit: CardInstance) => void;
}

export function BattleAreaZone({
  units,
  isOpponent,
  onUnitSelected,
}: BattleAreaZoneProps) {
  const rows = Math.ceil(units.length / 5);

  return (
    <div className="border-2 border-slate-700 rounded-lg bg-slate-800/70 p-4 h-full flex flex-col">
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        {isOpponent ? 'Opponent' : 'Your'} Battle Area
      </div>

      {/* Battle Grid */}
      <div className="flex-1 grid gap-3 overflow-y-auto">
        {units.length > 0 ? (
          units.map((unit, index) => {
            const cardDef = getCardById(unit.cardId);
            const ap = cardDef?.ap ?? 0;
            const hp = cardDef?.hp ?? 0;
            const row = Math.floor(index / 5);

            return (
              <div
                key={unit.instanceId}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg
                  border-2 border-slate-600 bg-gradient-to-b from-slate-700 to-slate-800
                  cursor-pointer transition-all duration-200
                  hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50
                  ${unit.state === 'rest' ? 'opacity-60 rotate-6' : ''}
                `}
                onClick={() => onUnitSelected?.(unit)}
                style={{
                  minHeight: '120px',
                  gridColumn: `span ${Math.ceil((index % 5) + 1)}`,
                }}
              >
                {/* Unit Card Display */}
                <div className="text-xs font-bold text-slate-300 text-center truncate w-full">
                  {cardDef?.name || unit.cardId}
                </div>

                {/* Stats Row */}
                <div className="flex gap-4 mt-2 text-sm font-bold">
                  <div className="text-red-400">⚔️ {ap}</div>
                  <div className="text-blue-400">🛡️ {hp}</div>
                </div>

                {/* Damage Markers */}
                {unit.damageMarkers > 0 && (
                  <div className="mt-2 text-xs text-red-400 font-bold">
                    Damage: {unit.damageMarkers}
                  </div>
                )}

                {/* State Indicator */}
                {unit.state === 'rest' && (
                  <div className="mt-2 text-xs text-slate-400 italic">RESTING</div>
                )}

                {/* Select Indicator */}
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-lg opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-32 text-slate-600 italic">
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
