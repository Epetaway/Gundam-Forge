/**
 * Shield Zone — horizontal row of 6 face-down portrait card tiles
 * Official GCG layout: shields line the front of each player's side
 */

'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';

interface ShieldAreaProps {
  shields: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
  baseHealth: number;
  maxBaseHealth: number;
  onDamaged?: (remaining: number) => void;
}

const TOTAL_SLOTS = 6;

export function ShieldZone({
  shields,
  isOpponent,
  baseHealth,
  maxBaseHealth,
}: ShieldAreaProps) {
  const hpPct = maxBaseHealth > 0 ? Math.max(0, (baseHealth / maxBaseHealth) * 100) : 0;
  const hpColor =
    hpPct > 50 ? '#10b981' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col gap-1">
      {/* 6-slot horizontal shield row */}
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
          const filled = i < shields.length;
          return (
            <div
              key={i}
              title={filled ? `Shield ${i + 1} (face-down)` : 'Empty shield slot'}
              className={`relative flex-shrink-0 w-9 h-[52px] rounded overflow-hidden border transition-all ${
                filled
                  ? 'border-cobalt-600/50 shadow-sm shadow-cobalt-900/30'
                  : 'border-slate-700/25 border-dashed'
              }`}
              style={
                filled
                  ? {
                      background:
                        'linear-gradient(135deg, #0d1a35 0%, #0a1228 50%, #060e20 100%)',
                    }
                  : undefined
              }
            >
              {filled && (
                <>
                  {/* Card back diamond pattern */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-[18px] h-[18px] border border-cobalt-500/25 rotate-45 rounded-sm"
                    />
                    <div
                      className="absolute w-[10px] h-[10px] border border-cobalt-400/15 rotate-45 rounded-sm"
                    />
                  </div>
                  {/* Subtle gradient sheen */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, transparent 60%)',
                    }}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Shield count pill */}
        <div className="ml-1 flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] font-bold text-cobalt-400 leading-none">
            {shields.length}
          </span>
          <span className="text-[8px] text-slate-600 leading-none">shields</span>
        </div>
      </div>

      {/* HP bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(51,65,85,0.3)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
          />
        </div>
        <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
          {baseHealth}/{maxBaseHealth}
        </span>
      </div>
    </div>
  );
}
