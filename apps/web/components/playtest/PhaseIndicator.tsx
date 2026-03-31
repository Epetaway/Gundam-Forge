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
  const isPlayerTurn = activePlayer === 'You';

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs text-slate-300 whitespace-nowrap">
        Turn {turnNumber} &bull; {turnText}
      </span>
      <span
        className="px-2.5 py-1 text-xs rounded-full font-semibold whitespace-nowrap border"
        style={{
          background: isPlayerTurn ? 'rgba(14,116,144,0.25)' : 'rgba(153,27,27,0.25)',
          borderColor: isPlayerTurn ? 'rgba(34,211,238,0.45)' : 'rgba(252,165,165,0.45)',
          color: isPlayerTurn ? '#67e8f9' : '#fecaca',
        }}
      >
        {phaseLabel} Phase
      </span>
    </div>
  );
}
