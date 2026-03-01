/**
 * Battlefield Component
 * PHASE 1 IMPLEMENTATION: Official Gundam TCG Playmat Layout
 * 
 * Implements the exact zone layout from the official playmat image:
 * ┌──────────────────────────────────────────┐
 * │ SHIELD AREA  │ BASE AREA  │ BATTLE AREA │
 * ├──────────────────────────────────────────┤
 * │ RESOURCE     │ RESOURCES  │ BATTLE AREA │
 * │ DECK AREA    │ (IN PLAY)  │ (CONTINUED) │
 * ├──────────────────────────────────────────┤
 * │ TRASH AREA   │ CENTER     │DECK AREA    │
 * └──────────────────────────────────────────┘
 */

'use client';

import React, { useState } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { ShieldArea } from './zones/ShieldArea';
import { BaseArea } from './zones/BaseArea';
import { BattleAreaZone } from './zones/BattleAreaZone';
import { ResourceDeckArea } from './zones/ResourceDeckArea';
import { ResourceAreaZone } from './zones/ResourceAreaZone';
import { TrashArea } from './zones/TrashArea';
import { DeckArea } from './zones/DeckArea';
import { GameLog } from './GameLog';
import { PlayerHand } from './PlayerHand';

interface BattlefieldProps {
  playerState: {
    playerId: string;
    name: string;
    hand: CardInstance[];
    deck: CardInstance[];
    discardPile: CardInstance[];
    battleArea: CardInstance[];
    shields: CardInstance[];
    base: CardInstance | null;
    resources: CardInstance[];
    exZone: {
      exBase?: CardInstance;
      exResources: CardInstance[];
    };
    baseHealth: number;
    maxBaseHealth: number;
  };
  opponentState: {
    playerId: string;
    name: string;
    hand: CardInstance[];
    deck: CardInstance[];
    discardPile: CardInstance[];
    battleArea: CardInstance[];
    shields: CardInstance[];
    base: CardInstance | null;
    resources: CardInstance[];
    baseHealth: number;
    maxBaseHealth: number;
  };
  isPlayerTurn: boolean;
  gameLog: any[];
  gamePhase: string;
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onUnitSelected?: (unit: CardInstance, isOpponent: boolean) => void;
  onCardPlayRequested?: (card: CardInstance) => void;
  onShieldDamaged?: (shieldCount: number) => void;
  onSelectCard?: (card: CardInstance) => void;
}

/**
 * Main Battlefield Component
 * Manages all zones with proper grid layout matching official playmat
 */
export function Battlefield({
  playerState,
  opponentState,
  isPlayerTurn,
  gameLog,
  gamePhase,
  cardDatabase,
  selectedCard,
  onUnitSelected,
  onCardPlayRequested,
  onShieldDamaged,
  onSelectCard,
}: BattlefieldProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardInstance | null>(null);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* OPPONENT SIDE - Fixed at top */}
      <div className="border-b-2 border-purple-600/30 bg-slate-900/60 p-4">
        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
          {opponentState.name}'s Field
        </div>
        
        {/* Opponent Playmat - Compact view */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: '1fr 1fr 2fr',
            gridTemplateRows: 'auto auto',
          }}
        >
          {/* Top Row: Shields | Base | Battle Area (upper) */}
          <div className="grid gap-2">
            <ShieldArea
              shields={opponentState.shields}
              isOpponent={true}
              baseHealth={opponentState.baseHealth}
              maxBaseHealth={opponentState.maxBaseHealth}
              onDamaged={onShieldDamaged}
            />
          </div>

          <BaseArea
            baseCard={opponentState.base}
            baseHealth={opponentState.baseHealth}
            maxBaseHealth={opponentState.maxBaseHealth}
            isOpponent={true}
          />

          <div className="row-span-2">
            <BattleAreaZone
              units={opponentState.battleArea}
              isOpponent={true}
              onUnitSelected={(unit) => onUnitSelected?.(unit, true)}
            />
          </div>

          {/* Bottom Row: Resource | Center (empty for now) */}
          <ResourceAreaZone
            resources={opponentState.resources}
            isOpponent={true}
          />

          <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded p-2">
            <div className="text-[10px] text-slate-600 text-center">
              Opponent Hand: {opponentState.hand.length}/7
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GAME AREA - Center split */}
      <div className="flex-1 grid grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* PLAYER SIDE - Left column with all zones */}
        <div className="col-span-1 space-y-4 overflow-y-auto pr-2">
          {/* Shield Area */}
          <ShieldArea
            shields={playerState.shields}
            isOpponent={false}
            baseHealth={playerState.baseHealth}
            maxBaseHealth={playerState.maxBaseHealth}
            onDamaged={onShieldDamaged}
          />

          {/* Base Area */}
          <BaseArea
            baseCard={playerState.base}
            baseHealth={playerState.baseHealth}
            maxBaseHealth={playerState.maxBaseHealth}
            isOpponent={false}
          />

          {/* Resource Deck Area */}
          <ResourceDeckArea
            resourceDeck={playerState.exZone.exResources || []}
            isOpponent={false}
          />

          {/* Trash Area */}
          <TrashArea
            trash={playerState.discardPile}
            isOpponent={false}
          />
        </div>

        {/* BATTLE AREA - Center (largest zone) */}
        <div className="col-span-2">
          <BattleAreaZone
            units={playerState.battleArea}
            isOpponent={false}
            onUnitSelected={(unit) => onUnitSelected?.(unit, false)}
          />
        </div>

        {/* RIGHT SIDE - Resources and Deck */}
        <div className="col-span-1 space-y-4 overflow-y-auto pl-2">
          {/* Resources In Play */}
          <ResourceAreaZone
            resources={playerState.resources}
            isOpponent={false}
          />

          {/* Deck Area */}
          <DeckArea
            deckSize={playerState.deck.length}
            isOpponent={false}
          />

          {/* Game Log Preview */}
          <div className="border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
            <div className="text-xs font-bold text-slate-400 uppercase p-2 border-b border-slate-700">
              Recent Actions
            </div>
            <div className="max-h-32 overflow-y-auto">
              {gameLog.slice(-5).map((entry, i) => (
                <div
                  key={i}
                  className="text-[10px] text-slate-400 px-2 py-1 border-b border-slate-800 last:border-b-0"
                >
                  <span className="text-slate-500">{entry.actionType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PLAYER HAND - Fixed at bottom */}
      <div className="border-t-2 border-purple-600/30 bg-slate-900/60 p-4">
        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
          Your Hand ({playerState.hand.length}/7)
        </div>
        
        <PlayerHand
          cards={playerState.hand}
          cardDatabase={cardDatabase}
          selectedCard={selectedCard || null}
          onSelectCard={onSelectCard || (() => {})}
          onPlayCard={onCardPlayRequested || (() => {})}
          gamePhase={gamePhase}
          isPlayerTurn={isPlayerTurn}
        />
      </div>
    </div>
  );
}
