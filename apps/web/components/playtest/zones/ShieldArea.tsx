/**
 * Shield Area Component
 * Displays face-down shield stack with damage indicators
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';

interface ShieldAreaProps {
  shields: CardInstance[];
  isOpponent: boolean;
  baseHealth: number;
  maxBaseHealth: number;
  onDamaged?: (remaining: number) => void;
}

export function ShieldArea({
  shields,
  isOpponent,
  baseHealth,
  maxBaseHealth,
  onDamaged,
}: ShieldAreaProps) {
  const healthPercentage = (baseHealth / maxBaseHealth) * 100;
  const healthColor =
    healthPercentage > 50 ? 'bg-green-600' : healthPercentage > 25 ? 'bg-yellow-600' : 'bg-red-600';

  return (
    <div className="border-2 border-slate-700 rounded-lg bg-slate-800/70 p-3 h-full">
      <div className="text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
        {isOpponent ? 'Opponent' : 'Your'} Shields
      </div>

      {/* Shield Stack Visual */}
      <div className="relative h-24 mb-3 flex items-center justify-center">
        {shields.length > 0 ? (
          <div className="relative w-16">
            {/* Stack effect - multiple offset rectangles */}
            {[0, 1, 2].map(
              (i) =>
                i < shields.length && (
                  <div
                    key={i}
                    className="absolute w-full h-14 bg-gradient-to-b from-blue-600 to-blue-800 rounded border-2 border-blue-400 shadow-lg"
                    style={{
                      transform: `translateY(${i * 4}px)`,
                    }}
                  />
                ),
            )}
          </div>
        ) : (
          <div className="text-slate-600 text-sm italic">No shields</div>
        )}
      </div>

      {/* Shield Count Badge */}
      <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-2 text-center mb-3">
        <div className="text-sm font-bold text-blue-300">Shields: {shields.length}</div>
        <div className="text-xs text-slate-400">Max: 5</div>
      </div>

      {/* Health Bar */}
      <div className="space-y-1">
        <div className="text-xs text-slate-400">HP</div>
        <div className="bg-slate-700 rounded-full h-6 overflow-hidden border border-slate-600">
          <div
            className={`h-full ${healthColor} transition-all duration-300 flex items-center justify-center`}
            style={{ width: `${healthPercentage}%` }}
          >
            <span className="text-xs font-bold text-white drop-shadow">
              {baseHealth}/{maxBaseHealth}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
