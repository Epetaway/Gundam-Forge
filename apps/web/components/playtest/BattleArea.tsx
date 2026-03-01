/**
 * Battle Area Component
 * Displays units in play and handles selection with animations
 */

'use client';

import React, { useState } from 'react';
import { AnimatedCard } from './AnimatedCard';
import type { CardInstance } from '@/lib/game/game-engine';

interface BattleAreaProps {
  units: (CardInstance & { cardDef?: any })[];
  isOpponent: boolean;
  onSelectUnit: (unit: CardInstance) => void;
  selectedUnitId?: string;
}

export function BattleArea({
  units,
  isOpponent,
  onSelectUnit,
  selectedUnitId,
}: BattleAreaProps) {
  const [destroyingIds, setDestroyingIds] = useState<Set<string>>(new Set());

  return (
    <div className="grid grid-cols-3 gap-3">
      {units.length > 0 ? (
        units.map((unit) => (
          <AnimatedCard
            key={unit.instanceId}
            card={unit}
            isOpponent={isOpponent}
            onSelect={onSelectUnit}
            isSelected={selectedUnitId === unit.instanceId}
            isDestroying={destroyingIds.has(unit.instanceId)}
          />
        ))
      ) : (
        <div className="col-span-3 text-center text-slate-500 py-8">
          No units in battle
        </div>
      )}
    </div>
  );
}
