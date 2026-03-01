'use client';

import { Phase } from '@/lib/game/game-engine';

interface PlaytestPhaseIndicatorProps {
  currentPhase: Phase;
  turnNumber: number;
}

const phaseSequence: Phase[] = ['setup', 'draw', 'main', 'action', 'battle', 'end'];

export default function PlaytestPhaseIndicator({
  currentPhase,
  turnNumber,
}: PlaytestPhaseIndicatorProps) {
  const phaseDescriptions: Record<Phase, string> = {
    setup: 'Ready units and resources',
    draw: 'Draw one card from deck',
    main: 'Play units and non-attack abilities',
    action: 'Declare attacks, activate abilities',
    battle: 'Block and resolve combat',
    end: 'End turn',
    gameOver: 'Game Over',
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-300">Turn {turnNumber}</h3>
          <div
            className={`px-3 py-1 rounded-full text-sm font-bold ${
              currentPhase === 'gameOver'
                ? 'bg-red-900 text-red-200'
                : 'bg-blue-900 text-blue-200'
            }`}
          >
            {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
          </div>
        </div>
        <p className="text-sm text-slate-400">{phaseDescriptions[currentPhase]}</p>
      </div>

      {/* Phase Progress Bar */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-semibold">Phase Progress</p>
        <div className="flex gap-1">
          {phaseSequence.map((phase, idx) => (
            <button
              key={phase}
              disabled
              className={`flex-1 h-2 rounded-sm transition ${
                phase === currentPhase
                  ? 'bg-blue-500'
                  : phaseSequence.indexOf(currentPhase) > idx
                    ? 'bg-slate-600'
                    : 'bg-slate-700'
              }`}
              title={phase}
            />
          ))}
        </div>
        <div className="flex gap-1 text-xs text-slate-400">
          {phaseSequence.map((phase) => (
            <div key={phase} className="flex-1 text-center">
              {phase.slice(0, 3)}
            </div>
          ))}
        </div>
      </div>

      {/* Current Phase Details */}
      {currentPhase !== 'gameOver' && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
            <p className="text-sm font-semibold text-blue-300 mb-1">Current Phase: {currentPhase}</p>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              {currentPhase === 'draw' && (
                <>
                  <li>Draw one card from deck</li>
                  <li>You may mulligan at start of game</li>
                </>
              )}
              {currentPhase === 'main' && (
                <>
                  <li>Play units from hand</li>
                  <li>Activate non-attack abilities</li>
                  <li>Use resources for abilities</li>
                </>
              )}
              {currentPhase === 'action' && (
                <>
                  <li>Declare attacking units</li>
                  <li>Opponent declares blockers</li>
                  <li>Activate attack abilities</li>
                </>
              )}
              {currentPhase === 'battle' && (
                <>
                  <li>Resolve combat damage</li>
                  <li>Trigger destroyed effects</li>
                </>
              )}
              {currentPhase === 'end' && (
                <>
                  <li>Discard down to 10 cards</li>
                  <li>Reset once-per-turn abilities</li>
                </>
              )}
              {currentPhase === 'setup' && (
                <>
                  <li>Ready all units and resources</li>
                  <li>Reset once-per-turn abilities</li>
                  <li>Draw shield if deck available</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
