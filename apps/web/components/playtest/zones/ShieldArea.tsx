/**
 * Shield Area Component
 * Displays face-down shield stack with damage indicators
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { CardStack } from '../CardStack';

interface ShieldAreaProps {
  shields: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
  baseHealth: number;
  maxBaseHealth: number;
  onDamaged?: (remaining: number) => void;
}

export function ShieldArea({
  shields,
  cardDatabase,
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

      {/* Shield Stack Visual - Using CardStack component */}
      <div className="mb-3 flex items-center justify-center">
        {shields.length > 0 ? (
          <CardStack
            cards={shields}
            cardDatabase={cardDatabase}
            variant="compact"
            showCount={true}
            className="flex justify-center"
          />
        ) : (
          <div className="text-slate-400 text-sm font-medium py-4">No shields</div>
        )}
      </div>

      {/* Shield Count Badge */}
      <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-2 text-center mb-3">
        <div className="text-sm font-bold text-blue-300">Shields: {shields.length}</div>
        <div className="text-xs text-slate-400">Max: 6</div>
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
