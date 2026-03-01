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
        return 'text-slate-400';
    }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-2 p-2">
      <div className="text-xs font-bold text-slate-300 mb-2">Game Log</div>

      {entries.length > 0 ? (
        entries.map((entry, i) => (
          <div key={i} className="text-xs border-l border-slate-600 pl-2 py-1">
            <div className="flex gap-2">
              <span className="text-slate-500 min-w-fit">
                T{entry.turnNumber} {entry.phase}
              </span>
              <span className={`font-semibold ${getActionColor(entry.actionType)}`}>
                {entry.actionType}
              </span>
            </div>
            <div className="text-slate-400 mt-1">{entry.description}</div>
            {entry.rulesTrace && (
              <div className="text-slate-600 italic text-[10px] mt-1">
                {entry.rulesTrace}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="text-slate-600 py-4">No actions yet</div>
      )}
    </div>
  );
}
