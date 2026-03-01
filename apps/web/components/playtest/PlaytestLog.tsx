'use client';

import { GameLogEntry } from '@/lib/game/game-engine';

interface PlaytestLogProps {
  log: GameLogEntry[];
  compact?: boolean;
}

export default function PlaytestLog({ log, compact = false }: PlaytestLogProps) {
  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        {log.length === 0 ? (
          <p className="text-slate-500 italic">No actions yet</p>
        ) : (
          log.map((entry, idx) => (
            <div key={idx} className="text-slate-300 p-2 bg-slate-900/30 rounded border border-slate-700">
              <div className="font-semibold text-blue-400">{entry.actionType}</div>
              <div className="text-slate-400">{entry.description}</div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h3 className="font-semibold mb-3 text-slate-300">Game Log ({log.length})</h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {log.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No actions yet</p>
        ) : (
          log.map((entry, idx) => (
            <div key={idx} className="border-l-4 border-blue-600 pl-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-blue-400 text-sm">{entry.actionType}</span>
                <span className="text-xs text-slate-500">{entry.phase}</span>
              </div>
              <p className="text-sm text-slate-300">{entry.description}</p>
              <details className="mt-2 cursor-pointer">
                <summary className="text-xs text-slate-500 hover:text-slate-400 select-none">
                  Rules Trace
                </summary>
                <p className="mt-1 text-xs text-slate-400 bg-slate-900/50 p-2 rounded">
                  {entry.rulesTrace}
                </p>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
