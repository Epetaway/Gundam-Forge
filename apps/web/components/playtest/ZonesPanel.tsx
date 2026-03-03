'use client';

import { PlayerState } from '@/lib/game/game-engine';

interface ZonesPanelProps {
  player: PlayerState;
}

export default function ZonesPanel({ player }: ZonesPanelProps) {
  return (
    <div className="space-y-4">
      {/* Library */}
      <div className="bg-gradient-to-br from-surface-interactive to-surface-elevated rounded-lg border border-steel-600 p-4 cursor-pointer hover:border-blue-500 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Library</h3>
          <span className="text-2xl font-bold text-blue-400">{player.deck.length}</span>
        </div>
        <div className="text-[10px] text-white">
          {player.deck.length === 0 ? 'Empty' : `${player.deck.length} cards remaining`}
        </div>
      </div>

      {/* Discard / Graveyard */}
      <div className="bg-gradient-to-br from-surface-interactive to-surface-elevated rounded-lg border border-steel-600 p-4 cursor-pointer hover:border-orange-500 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Trash</h3>
          <span className="text-2xl font-bold text-orange-400">{player.discardPile.length}</span>
        </div>
        <div className="text-[10px] text-white">
          {player.discardPile.length === 0 ? 'Empty' : `${player.discardPile.length} cards discarded`}
        </div>
      </div>

      {/* Exile / RFG */}
      <div className="bg-gradient-to-br from-surface-interactive to-surface-elevated rounded-lg border border-steel-600 p-4 cursor-pointer hover:border-purple-500 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Exile</h3>
          <span className="text-2xl font-bold text-purple-400">0</span>
        </div>
        <div className="text-[10px] text-white">No cards exiled</div>
      </div>

      {/* Divider */}
      <div className="border-t border-steel-600 pt-4">
        {/* Health Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-surface-interactive/50 rounded">
            <span className="text-sm font-semibold text-white">Base Health</span>
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                player.baseHealth <= 2 ? 'text-red-400' : 'text-green-400'
              }`}>
                {player.baseHealth}
              </div>
              <span className="text-white">/ {player.maxBaseHealth}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-surface-interactive/50 rounded">
            <span className="text-sm font-semibold text-white">Shields</span>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-400">{player.shields.length}</div>
              <span className="text-white">/ 5</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-surface-interactive/50 rounded">
            <span className="text-sm font-semibold text-white">Resources</span>
            <div className="text-2xl font-bold text-green-400">{player.resources.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
