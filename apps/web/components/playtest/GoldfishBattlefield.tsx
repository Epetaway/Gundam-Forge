'use client';

import React from 'react';
import type { CardInstance, GameState, GameAction } from '@/lib/game/game-engine';
import type { GameEngine } from '@/lib/game';
import { BattleZone } from './zones/BattleZone';
import { ShieldZone } from './zones/ShieldZone';
import { ResourceZone } from './zones/ResourceZone';
import { HandTray } from './HandTray';

export interface GoldfishStats {
  cardsPlayed: number;
  resourcesPlaced: number;
  firstUnitTurn: number | null;
}

interface GoldfishBattlefieldProps {
  gameState: GameState;
  engine: GameEngine;
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onAction: (action: GameAction) => void;
  onSelectCard: (card: CardInstance) => void;
  goldfishStats: GoldfishStats;
}

export function GoldfishBattlefield({
  gameState,
  engine,
  cardDatabase,
  selectedCard,
  onAction,
  onSelectCard,
  goldfishStats,
}: GoldfishBattlefieldProps) {
  const playerState = gameState.players['player1'];
  const isPlayerTurn = gameState.activePlayerId === 'player1';
  const phase = gameState.phase;

  const resourceCount = playerState.resources.length;
  const resourceDeckCount = playerState.resourceDeck?.length ?? 0;
  const totalResourceSlots = resourceCount + resourceDeckCount;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0e1a]">
      {/* Goldfish Stats Bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-white/10 bg-[#0d1220]/80 px-4 py-2">
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-blue-400/70">Turn</span>
          <span className="font-mono text-sm font-bold text-blue-300">{gameState.turnNumber}</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Cards Played</span>
          <span className="font-mono text-sm font-semibold text-white/80">{goldfishStats.cardsPlayed}</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Resources</span>
          <span className="font-mono text-sm font-semibold text-white/80">{resourceCount}/{totalResourceSlots > 0 ? totalResourceSlots : 10}</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Units on Board</span>
          <span className="font-mono text-sm font-semibold text-white/80">{playerState.battleArea.length}</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">First Unit</span>
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {goldfishStats.firstUnitTurn !== null ? `T${goldfishStats.firstUnitTurn}` : '—'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs text-white/30">
          <span>Deck: {playerState.deck.length}</span>
          <span>Discard: {playerState.discardPile.length}</span>
        </div>
      </div>

      {/* Battlefield */}
      <div className="flex flex-1 flex-col gap-1 overflow-hidden p-3">
        {/* Resource Zone */}
        <div className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Resources</span>
            <span className="font-mono text-[10px] text-white/40">{resourceCount} active</span>
          </div>
          <ResourceZone
            resources={playerState.resources}
            cardDatabase={cardDatabase}
            isOpponent={false}
          />
        </div>

        {/* Battle Area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Battle Area</span>
            <span className="font-mono text-[10px] text-white/40">{playerState.battleArea.length}/6 units</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <BattleZone
              units={playerState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent={false}
              gamePhase={phase}
              isPlayerTurn={isPlayerTurn}
              onUnitSelected={(unit) => onSelectCard(unit)}
            />
          </div>
        </div>

        {/* Shields + Base Row */}
        <div className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <div className="mb-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Base &amp; Shields</span>
          </div>
          <ShieldZone
            shields={playerState.shields}
            cardDatabase={cardDatabase}
            isOpponent={false}
            baseHealth={playerState.baseHealth}
            maxBaseHealth={playerState.maxBaseHealth}
          />
        </div>
      </div>

      {/* Hand Tray */}
      <div className="shrink-0 border-t border-white/10">
        <HandTray
          cards={playerState.hand}
          cardDatabase={cardDatabase}
          selectedCard={selectedCard}
          onSelectCard={onSelectCard}
          onPlayCard={(card) =>
            onAction({
              type: 'PLAY_CARD',
              playerId: 'player1',
              timestamp: Date.now(),
              payload: { cardInstanceId: card.instanceId },
            })
          }
          gamePhase={phase}
          isPlayerTurn={isPlayerTurn}
        />
      </div>
    </div>
  );
}
