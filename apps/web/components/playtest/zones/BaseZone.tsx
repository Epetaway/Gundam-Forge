/**
 * Base Area Component
 * Shows the active Base card and base health pool
 * Health is derived from the base card's hp value
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
  // Get health from the base card if available
  // Always use official card database for hp value
  const baseCardData = baseCard ? cardDatabase[baseCard.cardId] : null;
  const cardHp = baseCardData?.hp ?? maxBaseHealth;
  // Ensure current health doesn't exceed max and is never negative
  const currentHealth = baseCard ? Math.min(Math.max(baseHealth, 0), cardHp) : 0;
  const healthPercentage = cardHp > 0 ? (currentHealth / cardHp) * 100 : 0;
  const healthColor =
    healthPercentage > 50 ? 'bg-emerald-600' : healthPercentage > 25 ? 'bg-amber-600' : 'bg-red-600';

  return (
    <div className="border-2 border-border rounded-lg bg-surface-elevated p-3">
      <div className="text-xs font-bold text-white uppercase mb-2 tracking-wider">
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
            <div className="text-xs text-white">{baseCardData?.name ?? 'Base'} Health</div>
            <div className="bg-surface-muted rounded-lg h-8 overflow-hidden border border-steel-600 flex items-center px-2">
              <div className={`h-full w-full rounded ${healthColor} flex items-center justify-center`}>
                <span className="text-sm font-bold text-foreground drop-shadow">
                  {currentHealth}/{cardHp}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-muted/40 border-2 border-dashed border-steel-600 rounded-lg p-4 text-center">
          <div className="text-xs text-white font-medium">No base played yet</div>
          <div className="text-[10px] text-white mt-1">Play a Base card to start</div>
        </div>
      )}
    </div>
  );
}
