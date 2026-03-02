/**
 * Base Area Component
 * Shows the active Base card and base health pool
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { CardStack } from '../CardStack';

interface BaseAreaProps {
  baseCard: CardInstance | null;
  cardDatabase: Record<string, any>;
  baseHealth: number;
  maxBaseHealth: number;
  isOpponent: boolean;
}

export function BaseZone({
  baseCard,
  cardDatabase,
  baseHealth,
  maxBaseHealth,
  isOpponent,
}: BaseAreaProps) {
  const healthPercentage = (baseHealth / maxBaseHealth) * 100;
  const healthColor =
    healthPercentage > 50 ? 'bg-emerald-600' : healthPercentage > 25 ? 'bg-amber-600' : 'bg-red-600';

  return (
    <div className="border-2 border-border rounded-lg bg-surface-elevated p-3">
      <div className="text-xs font-bold text-steel-300 uppercase mb-2 tracking-wider">
        Base Area
      </div>

      {baseCard ? (
        <>
          {/* Base Card Display - Using CardStack */}
          <div className="mb-3 flex justify-center">
            <CardStack
              cards={baseCard}
              cardDatabase={cardDatabase}
              variant="normal"
              showCount={false}
            />
          </div>

          {/* Base Health Display */}
          <div className="space-y-1">
            <div className="text-xs text-steel-500">Base Health</div>
            <div className="bg-surface-muted rounded-lg h-8 overflow-hidden border border-steel-600 flex items-center px-2">
              <div className={`h-full w-full rounded ${healthColor} flex items-center justify-center`}>
                <span className="text-sm font-bold text-foreground drop-shadow">
                  {baseHealth}/{maxBaseHealth}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-muted/40 border-2 border-dashed border-steel-600 rounded-lg p-4 text-center">
          <div className="text-xs text-steel-500 font-medium">No base played yet</div>
          <div className="text-[10px] text-steel-600 mt-1">Play a Base card to start</div>
        </div>
      )}
    </div>
  );
}
