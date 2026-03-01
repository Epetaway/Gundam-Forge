'use client';

import { GameState } from '@/lib/game/game-engine';

interface PlaytestBoardProps {
  gameState: GameState;
}

export default function PlaytestBoard({ gameState }: PlaytestBoardProps) {
  const currentPlayer = gameState.players[gameState.activePlayerId];
  const opponentId = Object.keys(gameState.players).find((id) => id !== gameState.activePlayerId);
  const opponent = opponentId ? gameState.players[opponentId] : null;

  return (
    <div className="space-y-6">
      {/* Opponent Board */}
      {opponent && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-300">{opponent.name}'s Board</h3>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-slate-400">Health:</span>
                <span className={opponent.baseHealth <= 2 ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                  {opponent.baseHealth}/{opponent.maxBaseHealth}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Shields:</span>
                <span className="text-blue-400 ml-2">{opponent.shields.length}/5</span>
              </div>
            </div>
          </div>

          {/* Opponent Battle Area */}
          <div className="bg-slate-900/50 rounded p-3 min-h-24">
            {opponent.battleArea.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Battle area empty</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {opponent.battleArea.map((unit) => (
                  <div
                    key={unit.instanceId}
                    className="bg-slate-700 rounded p-2 text-xs text-center border border-slate-600"
                  >
                    <div className="font-semibold text-slate-200">{unit.cardId}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      ATK 5 / DEF 5
                      {unit.damageMarkers > 0 && <div className="text-red-400">DMG: {unit.damageMarkers}</div>}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        unit.state === 'ready' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {unit.state === 'ready' ? 'Ready' : 'Exhausted'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-slate-700 py-2">
        <p className="text-center text-slate-500 text-sm">↕ ACTION ZONE ↕</p>
      </div>

      {/* Player Board */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-300">{currentPlayer.name}'s Board</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-slate-400">Health:</span>
              <span className={currentPlayer.baseHealth <= 2 ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
                {currentPlayer.baseHealth}/{currentPlayer.maxBaseHealth}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Shields:</span>
              <span className="text-blue-400 ml-2">{currentPlayer.shields.length}/5</span>
            </div>
          </div>
        </div>

        {/* Battle Area */}
        <div className="bg-slate-900/50 rounded p-3 min-h-24">
          {currentPlayer.battleArea.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Battle area empty</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {currentPlayer.battleArea.map((unit) => (
                <div
                  key={unit.instanceId}
                  className="bg-slate-700 rounded p-2 text-xs text-center border-2 border-slate-600 hover:border-blue-500 cursor-pointer transition"
                >
                  <div className="font-semibold text-slate-200">{unit.cardId}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    ATK 5 / DEF 5
                    {unit.damageMarkers > 0 && <div className="text-red-400">DMG: {unit.damageMarkers}</div>}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      unit.state === 'ready' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {unit.state === 'ready' ? 'Ready' : 'Exhausted'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources Zone */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-sm text-slate-400 mb-2">Resources ({currentPlayer.resources.length})</div>
          <div className="flex gap-2 flex-wrap">
            {currentPlayer.resources.map((resource) => (
              <div
                key={resource.instanceId}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  resource.state === 'ready'
                    ? 'bg-green-900/50 text-green-300 border border-green-700'
                    : 'bg-red-900/50 text-red-300 border border-red-700'
                }`}
              >
                {resource.state === 'ready' ? '●' : '○'} Resource
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
