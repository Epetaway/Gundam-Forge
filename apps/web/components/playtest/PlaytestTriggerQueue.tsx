'use client';

import { TriggerEvent } from '@/lib/game/game-engine';

interface PlaytestTriggerQueueProps {
  stack: TriggerEvent[];
  onResolveTrigger: (triggerId: string, chooseResolve?: boolean) => void;
  onResolveAll: () => void;
}

export default function PlaytestTriggerQueue({
  stack,
  onResolveTrigger,
  onResolveAll,
}: PlaytestTriggerQueueProps) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-300 text-sm">Trigger Queue</h3>
        <span className="text-xs px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-300">
          {stack.length} pending
        </span>
      </div>

      {stack.length === 0 ? (
        <p className="text-xs text-slate-500">No pending triggers.</p>
      ) : (
        <>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {stack.map((trigger) => (
              <div key={trigger.id} className="bg-slate-900 border border-slate-700 rounded p-2">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-slate-200">{trigger.type}</p>
                  {trigger.optionalChoice && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2">{trigger.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onResolveTrigger(trigger.id, true)}
                    className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition"
                  >
                    Resolve
                  </button>
                  {trigger.optionalChoice && (
                    <button
                      onClick={() => onResolveTrigger(trigger.id, false)}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium transition"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onResolveAll}
            className="mt-3 w-full px-3 py-2 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold transition"
          >
            Resolve All Triggers
          </button>
        </>
      )}
    </div>
  );
}
