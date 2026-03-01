'use client';

import { Phase } from '@/lib/game/game-engine';

interface PlaytestPhaseIndicatorProps {
  currentPhase: Phase;
  turnNumber: number;
}

// Official GCG phase sequence: start → draw → resource → main → end
const phaseSequence: Phase[] = ['start', 'draw', 'resource', 'main', 'end'];

export default function PlaytestPhaseIndicator({
  currentPhase,
  turnNumber,
}: PlaytestPhaseIndicatorProps) {
  const phaseDescriptions: Record<Phase, string> = {
    start: 'Ready all rested cards. Start-of-turn effects fire.',
    draw: 'Draw one card from main deck.',
    resource: 'Place top of Resource Deck into Resource Area (enters active).',
    main: 'Play cards, activate abilities, declare attacks.',
    end: 'Discard to 10. End-of-turn effects. Pass turn.',
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
              {currentPhase === 'start' && (
                <>
                  <li>All rested cards become active (untap)</li>
                  <li>Once-per-turn abilities reset</li>
                  <li>Start-of-turn effects fire</li>
                </>
              )}
              {currentPhase === 'resource' && (
                <>
                  <li>Take top card of Resource Deck</li>
                  <li>Place it into Resource Area (enters active)</li>
                  <li>Skip if Resource Deck is empty</li>
                </>
              )}
              {currentPhase === 'end' && (
                <>
                  <li>Discard down to 10 cards</li>
                  <li>End-of-turn effects resolve (e.g. Repair X)</li>
                  <li>Pass turn to opponent</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
