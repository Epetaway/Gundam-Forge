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
  onUnitSelected?: (unit: CardInstance, isOpponent: boolean) => void;
  onCardPlayRequested?: (card: CardInstance) => void;
  onShieldDamaged?: (shieldCount: number) => void;
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
  onUnitSelected,
  onCardPlayRequested,
  onShieldDamaged,
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
        
        {/* Hand Display - Horizontal fan/tray layout */}
        <div className="flex gap-2 overflow-x-auto pb-2 items-end h-28">
          {playerState.hand.length > 0 ? (
            playerState.hand.map((card, index) => (
              <div
                key={card.instanceId}
                className="flex-shrink-0 h-full cursor-pointer group relative"
                style={{
                  transform: `translateY(${Math.abs(Math.floor(playerState.hand.length / 2) - index) * 4}px)`,
                }}
              >
                {/* Card Placeholder */}
                <div
                  className={`
                    w-20 h-28 rounded border-2 transition-all duration-200
                    bg-gradient-to-b from-slate-700 to-slate-800
                    hover:from-purple-700 hover:to-purple-800
                    hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/50
                    border-slate-600
                    flex flex-col items-center justify-center p-1
                    group-hover:scale-110 group-hover:z-50
                  `}
                  onClick={() => onCardPlayRequested?.(card)}
                >
                  <div className="text-[8px] font-bold text-slate-300 text-center truncate w-full">
                    {card.cardId.substring(0, 5)}
                  </div>
                </div>

                {/* Hover Tooltip */}
                <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-50 bg-slate-800 border border-slate-600 rounded p-2 w-32 text-xs text-slate-300">
                  <div className="font-bold">{card.cardId}</div>
                  <div className="text-slate-500 text-[9px] mt-1">Click to play</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-sm italic">Draw cards to play</div>
          )}
        </div>
      </div>

      {/* Mobile notice */}
      <div className="fixed bottom-4 left-4 text-xs text-slate-500 max-w-xs hidden sm:block">
        ⌄ Scroll hand left/right • Click cards to play • No horizontal page scroll ✓
      </div>
    </div>
  );
}
