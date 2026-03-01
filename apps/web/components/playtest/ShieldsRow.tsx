'use client';

import { CardInstance } from '@/lib/game/game-engine';

interface ShieldsRowProps {
  shields: CardInstance[];
  player: 'user' | 'opponent';
}

export default function ShieldsRow({ shields, player }: ShieldsRowProps) {
  return (
    <div className={`flex gap-2 ${player === 'opponent' ? 'justify-end' : ''}`}>
      <div className="flex gap-2 bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="text-xs font-semibold text-slate-300 self-center mr-2">
          {shields.length}/5 Shields
        </div>
        <div className="flex gap-2">
          {shields.map((shield, idx) => (
            <div
              key={shield.instanceId || idx}
              className="w-16 h-20 bg-gradient-to-br from-blue-900 to-slate-900 border-2 border-blue-600 rounded flex items-center justify-center"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">?</div>
                <div className="text-xs text-blue-300">Face-Down</div>
              </div>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 5 - shields.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="w-16 h-20 bg-slate-800 border-2 border-dashed border-slate-600 rounded flex items-center justify-center"
            >
              <div className="text-xs text-slate-500">Empty</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
