'use client';

import { CardInstance } from '@/lib/game/game-engine';

interface PlaytestHandProps {
  hand: CardInstance[];
  compact?: boolean;
}

export default function PlaytestHand({ hand, compact = false }: PlaytestHandProps) {
  if (compact) {
    return (
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {hand.length === 0 ? (
          <p className="text-slate-500 text-xs italic">Hand empty</p>
        ) : (
          hand.map((card) => (
            <div
              key={card.instanceId}
              className="text-xs bg-slate-700 rounded p-2 cursor-pointer hover:bg-slate-600 transition"
            >
              <div className="font-semibold truncate">{card.cardId}</div>
              <div className="text-slate-400 text-xs">Instance: {card.instanceId.slice(0, 8)}...</div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h3 className="font-semibold mb-3 text-slate-300">Hand ({hand.length}/7)</h3>

      {hand.length === 0 ? (
        <p className="text-slate-500 text-sm italic">Hand empty</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {hand.map((card) => (
            <div
              key={card.instanceId}
              className="bg-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-600 hover:ring-2 hover:ring-blue-500 transition"
            >
              <div className="text-sm font-semibold text-slate-200 line-clamp-2">{card.cardId}</div>
              <div className="text-xs text-slate-400 mt-2">
                Cost: <span className="text-yellow-400">●</span>
              </div>
              <div
                className="mt-2 px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 text-center"
              >
                ATK: 5 | DEF: 5
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
