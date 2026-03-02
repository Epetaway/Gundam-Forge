/**
 * Phase Indicator Component
 * Shows current game phase and turn number
 */

'use client';

import React from 'react';
import type { Phase } from '@/lib/game/game-engine';

interface PhaseIndicatorProps {
  currentPhase: Phase;
  turnNumber: number;
  activePlayer: 'You' | 'Opponent';
}

const PHASE_LABELS: Record<Phase, string> = {
  start: 'Start',
  draw: 'Draw',
  resource: 'Resource',
  main: 'Main',
  end: 'End',
  gameOver: 'Game Over',
};

export function PhaseIndicator({ currentPhase, turnNumber, activePlayer }: PhaseIndicatorProps) {
  const phaseLabel = PHASE_LABELS[currentPhase] ?? currentPhase;
  // Grammatically correct "Your Turn" vs "Opponent's Turn"
  const turnText = activePlayer === 'You' ? 'Your Turn' : "Opponent's Turn";

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-steel-500 whitespace-nowrap">
        Turn {turnNumber} &bull; {turnText}
      </span>
      <span className="px-2.5 py-1 text-xs rounded font-bold bg-cobalt-600 text-foreground whitespace-nowrap">
        {phaseLabel} Phase
      </span>
    </div>
  );
}
