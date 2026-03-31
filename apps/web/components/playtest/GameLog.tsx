/**
 * Game Log Component
 * Displays action history and rules traces
 */

'use client';

import React, { useEffect, useRef } from 'react';
import type { GameLogEntry } from '@/lib/game/game-engine';

interface GameLogProps {
  entries: GameLogEntry[];
}

export function GameLog({ entries }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const getActionColor = (actionType: string): string => {
    switch (actionType) {
      case 'DRAW':
        return 'text-blue-400';
      case 'PLAY_CARD':
        return 'text-green-400';
      case 'DECLARE_ATTACK':
        return 'text-red-400';
      case 'RESOLVE_COMBAT':
        return 'text-orange-400';
      case 'ADVANCE_PHASE':
        return 'text-purple-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-2 p-2">
      <div className="text-[11px] font-semibold text-slate-200 mb-2 uppercase tracking-wide">Game Log</div>

      {entries.length > 0 ? (
        entries.map((entry, i) => (
          <div key={i} className="text-xs border-l border-slate-500/60 pl-2.5 py-1.5 bg-slate-900/25 rounded-r">
            <div className="flex gap-2">
              <span className="text-slate-300 min-w-fit font-mono text-[10px]">
                T{entry.state?.turnNumber || '?'} {entry.phase}
              </span>
              <span className={`font-semibold ${getActionColor(entry.actionType)}`}>
                {entry.actionType}
              </span>
            </div>
            <div className="text-slate-100 mt-1">{entry.description}</div>
            {entry.rulesTrace && (
              <div className="text-slate-400 italic text-[10px] mt-1">
                {entry.rulesTrace}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-slate-500 py-4">No actions yet</div>
      )}
    </div>
  );
}
