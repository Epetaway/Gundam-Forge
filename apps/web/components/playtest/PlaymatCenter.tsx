'use client';

import { GameState, CardInstance } from '@/lib/game/game-engine';
import CardInstanceDisplay from './CardInstanceDisplay';
import ShieldsRow from './ShieldsRow';

interface PlaymatCenterProps {
  gameState: GameState;
  selectedCardId?: string;
  onCardSelect?: (instanceId: string) => void;
  onCardRest?: (instanceId: string) => void;
}

export default function PlaymatCenter({
  gameState,
  selectedCardId,
  onCardSelect,
  onCardRest,
}: PlaymatCenterProps) {
  const opponent = gameState.players[gameState.activePlayerId === 'player1' ? 'player2' : 'player1'];
  const player = gameState.players[gameState.activePlayerId];

  if (!opponent || !player) return null;

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 flex flex-col gap-6">
      {/* OPPONENT SIDE (Top) */}
      <div className="flex-1">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Opponent</h3>
          <div className="flex gap-4">
            {/* Opponent Health/Base */}
            <div className="bg-slate-700 rounded border border-slate-600 px-4 py-2">
              <p className="text-xs text-slate-400">Base Health</p>
              <p className="text-xl font-bold text-red-500">
                {opponent.baseHealth}/{opponent.maxBaseHealth}
              </p>
            </div>
            {/* Opponent Resources */}
            <div className="bg-slate-700 rounded border border-slate-600 px-4 py-2">
              <p className="text-xs text-slate-400">Resources</p>
              <p className="text-xl font-bold text-purple-400">{opponent.resources.length}</p>
            </div>
          </div>
        </div>

        {/* Opponent Shields */}
        <div className="mb-4">
          <ShieldsRow shields={opponent.shields} player="opponent" />
        </div>

        {/* Opponent Battle Area */}
        <div className="bg-slate-800 rounded-lg border border-slate-600 p-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">Opponent Battle</p>
          <div className="flex gap-3 flex-wrap min-h-24">
            {opponent.battleArea.length > 0 ? (
              opponent.battleArea.map((card) => (
                <CardInstanceDisplay
                  key={card.instanceId}
                  cardInstance={card}
                  selected={selectedCardId === card.instanceId}
                  onSelect={onCardSelect}
                  onToggleRest={onCardRest}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500">No units deployed</div>
            )}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-slate-500 to-transparent"></div>

      {/* PLAYER SIDE (Bottom) */}
      <div className="flex-1">
        {/* Player Battle Area */}
        <div className="bg-slate-800 rounded-lg border border-slate-600 p-4 mb-4">
          <p className="text-xs font-semibold text-slate-400 mb-2">Your Battle</p>
          <div className="flex gap-3 flex-wrap min-h-24">
            {player.battleArea.length > 0 ? (
              player.battleArea.map((card) => (
                <CardInstanceDisplay
                  key={card.instanceId}
                  cardInstance={card}
                  selected={selectedCardId === card.instanceId}
                  onSelect={onCardSelect}
                  onToggleRest={onCardRest}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500">Drag units here to deploy</div>
            )}
          </div>
        </div>

        {/* Player Shields */}
        <div className="mb-4">
          <ShieldsRow shields={player.shields} player="user" />
        </div>

        {/* Player Health/Base */}
        <div className="flex gap-4">
          <div className="bg-slate-700 rounded border border-slate-600 px-4 py-2">
            <p className="text-xs text-slate-400">Base Health</p>
            <p className="text-xl font-bold text-green-500">
              {player.baseHealth}/{player.maxBaseHealth}
            </p>
          </div>
          <div className="bg-slate-700 rounded border border-slate-600 px-4 py-2">
            <p className="text-xs text-slate-400">Deck</p>
            <p className="text-xl font-bold text-blue-400">{player.deck.length}</p>
          </div>
          <div className="bg-slate-700 rounded border border-slate-600 px-4 py-2">
            <p className="text-xs text-slate-400">Resources</p>
            <p className="text-xl font-bold text-purple-400">{player.resources.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
