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
  setup: 'Setup',
  draw: 'Draw',
  main: 'Main',
  action: 'Action',
  battle: 'Battle',
  end: 'End',
  gameOver: 'Game Over',
};

const PHASE_ORDER: Phase[] = ['setup', 'draw', 'main', 'action', 'battle', 'end'];

export function PhaseIndicator({ currentPhase, turnNumber, activePlayer }: PhaseIndicatorProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-slate-400">
        Turn {turnNumber} - {activePlayer}'s Turn
      </div>
      <div className="flex gap-1">
        {PHASE_ORDER.map((phase, index) => (
          <div
            key={phase}
            className={`px-3 py-1 text-xs rounded font-semibold transition ${
              index === currentIndex
                ? 'bg-purple-600 text-white'
                : index < currentIndex
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-slate-800 text-slate-500'
            }`}
          >
            {PHASE_LABELS[phase]}
          </div>
        ))}
      </div>
    </div>
  );
}
