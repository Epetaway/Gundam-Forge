/**
 * Battlefield Component
 * PHASE 1 IMPLEMENTATION: Official Gundam TCG Playmat Layout with Responsive CSS Grid
 * 
 * Implements the exact zone layout from the official playmat image with proper responsive behavior:
 * 
 * DESKTOP (≥1024px):
 * ┌──────────────────────────────────────────────────────┐
 * │ OPPONENT FIELD (minimal view)                        │
 * ├──────────────────────────────────────────────────────┤
 * │ SHIELDS │ BASE │ BATTLE (2x spans) │ RESOURCES │ LOG │
 * │ TRASH   │ ──── │ BATTLE (cont.)   │ DECK      │     │
 * └──────────────────────────────────────────────────────┘
 * │ HAND TRAY (bottom, arc layout)                       │
 * └──────────────────────────────────────────────────────┘
 * 
 * TABLET (640px-1023px): Stacked 2-column layout
 * MOBILE (<640px): Single column, vertical scroll
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { ShieldArea } from './zones/ShieldArea';
import { BaseArea } from './zones/BaseArea';
import { BattleAreaZone } from './zones/BattleAreaZone';
import { ResourceDeckArea } from './zones/ResourceDeckArea';
import { ResourceAreaZone } from './zones/ResourceAreaZone';
import { TrashArea } from './zones/TrashArea';
import { DeckArea } from './zones/DeckArea';
import { GameLog } from './GameLog';
import { HandTray } from './HandTray';

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
 * Manages all zones with CSS Grid layout matching official playmat
 * Fully responsive: desktop, tablet, mobile
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for hand tray rendering
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* OPPONENT SIDE - Responsive header */}
      <div className="flex-shrink-0 border-b-2 border-purple-600/30 bg-slate-900/60 p-2 md:p-4 overflow-y-auto max-h-32 md:max-h-40">
        <div className="text-xs md:text-sm text-slate-400 mb-2 uppercase tracking-wider font-semibold">
          {opponentState.name}'s Field
        </div>
        
        {/* Opponent Playmat - Responsive compact grid */}
        <div
          className="grid gap-2 md:gap-3"
          style={{
            gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr) minmax(120px, 2fr) minmax(80px, 1fr)',
            gridTemplateRows: 'auto auto',
          }}
        >
          {/* Shields */}
          <div className="col-span-1">
            <ShieldArea
              shields={opponentState.shields}
              cardDatabase={cardDatabase}
              isOpponent={true}
              baseHealth={opponentState.baseHealth}
              maxBaseHealth={opponentState.maxBaseHealth}
              onDamaged={onShieldDamaged}
            />
          </div>

          {/* Base */}
          <BaseArea
            baseCard={opponentState.base}
            cardDatabase={cardDatabase}
            baseHealth={opponentState.baseHealth}
            maxBaseHealth={opponentState.maxBaseHealth}
            isOpponent={true}
          />

          {/* Battle Area - spans 1 row, 2 cols */}
          <div className="col-span-1 row-span-2">
            <BattleAreaZone
              units={opponentState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent={true}
              onUnitSelected={(unit) => onUnitSelected?.(unit, true)}
            />
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <ResourceAreaZone
              resources={opponentState.resources}
              cardDatabase={cardDatabase}
              isOpponent={true}
            />
          </div>

          {/* Hand count indicator */}
          <div className="col-span-3 bg-slate-800/40 border border-dashed border-slate-600 rounded-lg p-1 md:p-2 text-center">
            <div className="text-[10px] md:text-xs text-slate-400">
              Hand: {opponentState.hand.length}/10
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GAME AREA - Responsive CSS Grid playmat */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4">
        {/* LEFT COLUMN - Player zones (Shields, Base, Resources, Trash) */}
        <div className="w-full md:w-48 flex-shrink-0 space-y-2 md:space-y-4 overflow-y-auto md:overflow-y-auto pb-2">
          {/* Shield Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Shield Area
            </div>
            <ShieldArea
              shields={playerState.shields}
              cardDatabase={cardDatabase}
              isOpponent={false}
              baseHealth={playerState.baseHealth}
              maxBaseHealth={playerState.maxBaseHealth}
              onDamaged={onShieldDamaged}
            />
          </div>

          {/* Base Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Base
            </div>
            <BaseArea
              baseCard={playerState.base}
              cardDatabase={cardDatabase}
              baseHealth={playerState.baseHealth}
              maxBaseHealth={playerState.maxBaseHealth}
              isOpponent={false}
            />
          </div>

          {/* Resource Deck Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Resource Deck
            </div>
            <ResourceDeckArea
              resourceDeck={playerState.exZone.exResources || []}
              isOpponent={false}
            />
          </div>

          {/* Trash Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Trash
            </div>
            <TrashArea
              trash={playerState.discardPile}
              cardDatabase={cardDatabase}
              isOpponent={false}
            />
          </div>
        </div>

        {/* CENTER COLUMN - Battle Area (takes most space) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
            Battle Area
          </div>
          <div className="flex-1 overflow-auto">
            <BattleAreaZone
              units={playerState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent={false}
              onUnitSelected={(unit) => onUnitSelected?.(unit, false)}
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Resources, Deck, Log */}
        <div className="w-full md:w-48 flex-shrink-0 space-y-2 md:space-y-4 overflow-y-auto pb-2">
          {/* Resources In Play */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Resources
            </div>
            <ResourceAreaZone
              resources={playerState.resources}
              cardDatabase={cardDatabase}
              isOpponent={false}
            />
          </div>

          {/* Deck Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-slate-300 uppercase mb-1 tracking-wider">
              Deck
            </div>
            <DeckArea
              deckSize={playerState.deck.length}
              isOpponent={false}
            />
          </div>

          {/* Game Log Preview - hidden on mobile to save space */}
          <div className="hidden md:block border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
            <div className="text-xs font-bold text-slate-400 uppercase p-2 border-b border-slate-700">
              Recent Actions
            </div>
            <div className="max-h-40 overflow-y-auto">
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

      {/* PLAYER HAND - Fixed at bottom with responsive sizing */}
      <div className="flex-shrink-0 border-t-2 border-purple-600/30 bg-slate-900/60 p-2 md:p-4">
        <HandTray
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
