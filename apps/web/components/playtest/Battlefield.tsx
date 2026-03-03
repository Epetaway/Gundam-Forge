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
import { ShieldZone } from './zones/ShieldZone';
import { BaseZone } from './zones/BaseZone';
import { BattleZone } from './zones/BattleZone';
import { ResourceDeckZone } from './zones/ResourceDeckZone';
import { ResourceZone } from './zones/ResourceZone';
import { TrashZone } from './zones/TrashZone';
import { DeckZone } from './zones/DeckZone';
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
    resourceDeck: CardInstance[];
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
  onAttackDeclared?: (attackerInstanceId: string, targetInstanceId?: string) => void;
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
  onAttackDeclared,
}: BattlefieldProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardInstance | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Targeting mode state
  const [attackingUnit, setAttackingUnit] = useState<CardInstance | null>(null);

  // Detect mobile for hand tray rendering
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Escape key cancels targeting mode
  useEffect(() => {
    if (!attackingUnit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAttackingUnit(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [attackingUnit]);

  // Get contextual status message based on phase and turn
  const getStatusMessage = (): string => {
    if (!isPlayerTurn) {
      return 'Opponent is thinking...';
    }

    switch (gamePhase) {
      case 'start':
        return 'Start Phase — ready your units. Click "End Phase" when done.';
      case 'draw':
        return 'Draw Phase — drawing your card...';
      case 'resource':
        return 'Resource Phase — click "Place Resource" to move a card from your resource deck.';
      case 'main':
        return 'Main Phase — play cards from your hand, attack with ready units, or end your turn.';
      case 'end':
        return 'End Phase — tidying up. Click "Next Phase" to continue.';
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-gradient-to-br from-surface-muted via-surface to-surface-elevated relative" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* OPPONENT STATUS - Compact strip (player POV only) */}
      <div className="flex-shrink-0 border-b-2 border-cobalt-500/30 bg-surface/60 px-4 py-2 relative z-10">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs text-white font-semibold uppercase tracking-wider">
            {opponentState.name}'s Field
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            <span className="text-foreground font-bold text-sm">{opponentState.shields.length}</span>
            <span className="text-white text-xs">shields</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            <span className="text-foreground font-bold text-sm">{opponentState.battleArea.length}</span>
            <span className="text-white text-xs">units</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="text-foreground font-bold text-sm">{opponentState.resources.length}</span>
            <span className="text-white text-xs">resources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
            <span className="text-foreground font-bold text-sm">{opponentState.hand.length}</span>
            <span className="text-white text-xs">in hand</span>
          </div>

        </div>
      </div>

      {/* TARGETING MODE BANNER */}
      {attackingUnit && (
        <div className="flex-shrink-0 border-b-2 border-amber-500/60 bg-amber-900/20 px-4 py-2 flex items-center gap-3 z-20 relative" role="status" aria-live="assertive">
          <span className="text-amber-300 font-bold text-xs uppercase tracking-wider">Targeting Mode</span>
          <span className="text-amber-200 text-xs">
            Attacking with <strong>{cardDatabase[attackingUnit.cardId]?.name ?? attackingUnit.cardId}</strong> — click an opponent unit or Attack Base
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-amber-500/50 bg-amber-600/20 px-2 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-600/40 transition-colors"
              onClick={() => {
                onAttackDeclared?.(attackingUnit.instanceId, undefined);
                setAttackingUnit(null);
              }}
            >
              ⚔ Attack Base
            </button>
            <button
              type="button"
              className="rounded border border-border px-2 py-1 text-xs text-white hover:text-foreground transition-colors"
              onClick={() => setAttackingUnit(null)}
              aria-label="Cancel attack"
            >
              Cancel (Esc)
            </button>
          </div>
        </div>
      )}

      {/* OPPONENT BATTLE AREA - Unit display with AP/HP stats */}
      {opponentState.battleArea.length > 0 && (
        <div className={`flex-shrink-0 border-b px-4 py-2 ${attackingUnit ? 'border-amber-500/40 bg-amber-900/10' : 'border-border/50 bg-surface/40'}`}>
          <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wider ${attackingUnit ? 'text-amber-400' : 'text-white'}`}>
            {attackingUnit ? '⚔ Select Target — ' : ''}{opponentState.name}&apos;s Battle Area
          </div>
          <div className="flex flex-wrap gap-2">
            {opponentState.battleArea.map((unit) => {
              const card = cardDatabase[unit.cardId];
              const isTargetable = !!attackingUnit;
              return (
                <button
                  key={unit.instanceId}
                  type="button"
                  className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-all ${
                    isTargetable
                      ? 'cursor-pointer border-amber-500/70 bg-amber-900/20 text-amber-200 ring-1 ring-amber-500/40 hover:ring-2 hover:ring-amber-400 hover:bg-amber-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
                      : unit.state === 'rest'
                        ? 'border-steel-700/60 bg-surface-muted text-white cursor-default'
                        : 'border-red-700/50 bg-red-900/10 text-white cursor-default'
                  }`}
                  title={`${card?.name ?? unit.cardId} — AP:${card?.ap ?? 0} HP:${card?.hp ?? 0}${unit.state === 'rest' ? ' (resting)' : ' (ready)'}${isTargetable ? ' — Click to target' : ''}`}
                  onClick={() => {
                    if (isTargetable) {
                      onAttackDeclared?.(attackingUnit.instanceId, unit.instanceId);
                      setAttackingUnit(null);
                    } else {
                      onUnitSelected?.(unit, true);
                    }
                  }}
                  aria-label={isTargetable ? `Attack ${card?.name ?? unit.cardId}` : card?.name ?? unit.cardId}
                >
                  {isTargetable && (
                    <span className="text-amber-400 font-bold text-[10px]">⚔</span>
                  )}
                  <div className="relative h-8 w-6 flex-shrink-0 overflow-hidden rounded">
                    {card?.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt={card?.name ?? ''}
                        className={`h-full w-full object-cover ${unit.state === 'rest' ? 'opacity-60' : ''}`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-surface-elevated text-[8px] text-white">
                        {unit.cardId.slice(0, 3)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="max-w-[80px] truncate font-medium leading-none">
                      {card?.name ?? unit.cardId}
                    </div>
                    <div className="mt-0.5 flex gap-1.5 font-mono text-[10px]">
                      <span className="text-red-400" title="Attack Points">⚔{card?.ap ?? 0}</span>
                      <span className="text-blue-400" title="Hit Points">🛡{card?.hp ?? 0}</span>
                      {unit.damageMarkers > 0 && (
                        <span className="text-amber-400">Dmg:{unit.damageMarkers}</span>
                      )}
                      {unit.state === 'rest' && <span className="text-white italic">rest</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN GAME AREA - Responsive CSS Grid playmat */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 relative z-10 min-h-0">
        {/* LEFT COLUMN - Player zones (Shields, Base, Resources, Trash) */}
        <div className="w-full md:w-48 flex-shrink-0 space-y-2 md:space-y-4 overflow-y-auto md:overflow-y-auto pb-2 min-h-0">
          {/* Shield Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Shield Area
            </div>
            <ShieldZone
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
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Base
            </div>
            <BaseZone
              baseCard={playerState.base}
              cardDatabase={cardDatabase}
              baseHealth={playerState.baseHealth}
              maxBaseHealth={playerState.maxBaseHealth}
              isOpponent={false}
            />
          </div>

          {/* Resource Deck Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Resource Deck
            </div>
            <ResourceDeckZone
              resourceDeck={playerState.resourceDeck || []}
              isOpponent={false}
            />
          </div>

          {/* Trash Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Trash
            </div>
            <TrashZone
              trash={playerState.discardPile}
              cardDatabase={cardDatabase}
              isOpponent={false}
            />
          </div>
        </div>

        {/* CENTER COLUMN - Battle Area (takes most space) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
            Battle Area
          </div>
          <div className="flex-1 overflow-auto">
            <BattleZone
              units={playerState.battleArea}
              cardDatabase={cardDatabase}
              isOpponent={false}
              onUnitSelected={(unit) => {
                if (isPlayerTurn && gamePhase === 'main' && unit.state === 'ready') {
                  setAttackingUnit(unit);
                } else {
                  onUnitSelected?.(unit, false);
                }
              }}
              gamePhase={gamePhase}
              isPlayerTurn={isPlayerTurn}
              attackingUnitId={attackingUnit?.instanceId}
            />
          </div>
        </div>

        {/* RIGHT COLUMN - Resources, Deck, Log */}
        <div className="w-full md:w-48 flex-shrink-0 space-y-2 md:space-y-4 overflow-y-auto pb-2 min-h-0">
          {/* Resources In Play */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Resources
            </div>
            <ResourceZone
              resources={playerState.resources}
              cardDatabase={cardDatabase}
              isOpponent={false}
            />
          </div>

          {/* Deck Area */}
          <div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase mb-1 tracking-wider">
              Deck
            </div>
            <DeckZone
              deckSize={playerState.deck.length}
              resourceDeckSize={playerState.resourceDeck.length}
              isOpponent={false}
            />
          </div>

          {/* Game Log Preview - hidden on mobile to save space */}
          <div className="hidden md:block border border-border rounded-lg bg-surface-elevated/50 overflow-hidden">
            <div className="text-xs font-bold text-white uppercase p-2 border-b border-border">
              Recent Actions
            </div>
            <div className="max-h-40 overflow-y-auto">
              {gameLog.slice(-5).reverse().map((entry, i) => (
                <div
                  key={i}
                  className="text-[10px] text-white px-2 py-1 border-b border-surface last:border-b-0 leading-relaxed"
                >
                  <span className="font-mono text-white mr-1">[T{entry.state.turnNumber ?? '?'}]</span>
                  {entry.description || entry.actionType}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PLAYER HAND - Always visible, flexible height */}
      <div className="flex flex-col flex-shrink-0 relative z-30 w-full">
        {/* Contextual Status Bar */}
        <div className="text-xs text-white text-center py-1.5 bg-surface/50 border-t border-b border-border/50 flex-shrink-0">
          {getStatusMessage()}
        </div>

        {/* Hand Label and Cards */}
        <div className="border-t-2 border-cobalt-500/30 bg-surface/30 px-2 py-3 w-full flex-shrink-0">
          <div className="text-xs font-bold text-white uppercase mb-1 px-2">Hand ({playerState.hand.length}/10)</div>
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
    </div>
  );
}
