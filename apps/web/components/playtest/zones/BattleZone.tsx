/**
 * Battle Zone — horizontal row of portrait card tiles
 * Official GCG layout: units fill a flex row, each shown as a portrait tile
 * with card art, AP/HP stats, and state indicators.
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';

interface BattleZoneProps {
  units: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
  onUnitSelected?: (unit: CardInstance) => void;
  gamePhase?: string;
  isPlayerTurn?: boolean;
  attackingUnitId?: string;
  /** When true (targeting mode, opponent side), all units become clickable attack targets */
  isTargeting?: boolean;
}

export function BattleZone({
  units,
  cardDatabase,
  isOpponent,
  onUnitSelected,
  gamePhase = '',
  isPlayerTurn = false,
  attackingUnitId,
  isTargeting = false,
}: BattleZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: isOpponent ? 'opponent-battle' : 'battle',
    data: { zone: isOpponent ? 'opponent-battle' : 'battle' },
  });

  const canShowAttackButton =
    !isOpponent && isPlayerTurn && gamePhase === 'main';

  return (
    <div
      ref={isOpponent ? undefined : setNodeRef}
      className={`flex-1 min-h-0 flex items-center px-1 min-w-0 transition-colors duration-200 ${
        !isOpponent && isOver
          ? 'bg-emerald-950/25 rounded-lg'
          : ''
      }`}
    >
      {units.length === 0 ? (
        <div
          className={`w-full flex items-center justify-center text-xs font-medium py-2 ${
            !isOpponent && isOver
              ? 'text-emerald-400/60'
              : isOpponent
              ? 'text-red-300/15'
              : 'text-blue-300/15'
          }`}
        >
          {!isOpponent && isOver ? '⊕ Drop to play' : 'Empty'}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 items-center py-1">
          {units.map((unit) => {
            const card = cardDatabase[unit.cardId];
            const isAttacking = unit.instanceId === attackingUnitId;
            const isResting = unit.state === 'rest';
            const canAttack =
              canShowAttackButton && !isResting && !attackingUnitId;

            return (
              <UnitTile
                key={unit.instanceId}
                unit={unit}
                card={card}
                isAttacking={isAttacking}
                isResting={isResting}
                isTargetable={isTargeting}
                canAttack={canAttack}
                onUnitSelected={onUnitSelected}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface UnitTileProps {
  unit: CardInstance;
  card: any;
  isAttacking: boolean;
  isResting: boolean;
  isTargetable: boolean;
  canAttack: boolean;
  onUnitSelected?: (unit: CardInstance) => void;
}

function UnitTile({
  unit,
  card,
  isAttacking,
  isResting,
  isTargetable,
  canAttack,
  onUnitSelected,
}: UnitTileProps) {
  const ap = card?.ap ?? 0;
  const hp = card?.hp ?? 0;
  const dmg = unit.damageMarkers ?? 0;
  const remainingHp = Math.max(0, hp - dmg);
  const hpDamaged = dmg > 0;

  let borderStyle = 'border-cobalt-700/40 hover:border-cobalt-500/60';
  if (isAttacking)
    borderStyle = 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20 shadow-md';
  else if (isTargetable)
    borderStyle =
      'border-amber-500/50 ring-1 ring-amber-400/30 cursor-pointer hover:ring-2 hover:ring-amber-400/70 hover:border-amber-400/70';
  else if (isResting)
    borderStyle = 'border-slate-700/35 opacity-70';

  return (
    <div
      className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 group select-none ${borderStyle}`}
      style={{ width: '52px', height: '72px' }}
      title={`${card?.name ?? unit.cardId} — AP:${ap} HP:${remainingHp}/${hp}${isResting ? ' (resting)' : ' (ready)'}${isTargetable ? ' — Click to target' : ''}`}
      onClick={() => onUnitSelected?.(unit)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onUnitSelected?.(unit);
        }
      }}
      aria-label={
        isTargetable
          ? `Attack ${card?.name ?? unit.cardId}`
          : card?.name ?? unit.cardId
      }
    >
      {/* Card art */}
      {card?.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name ?? ''}
          className={`absolute inset-0 w-full h-full object-cover object-top ${
            isResting ? 'opacity-55 saturate-50' : ''
          }`}
        />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center text-[9px] font-mono ${
            isResting ? 'opacity-55' : ''
          }`}
          style={{
            background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
            color: '#64748b',
          }}
        >
          {(unit.cardId ?? '').slice(0, 5)}
        </div>
      )}

      {/* Bottom gradient overlay for stat readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
        }}
      />

      {/* AP / HP stats */}
      <div className="absolute bottom-[3px] left-[3px] right-[3px] flex justify-between items-end pointer-events-none">
        <span
          className="text-[8px] font-bold leading-tight px-0.5 rounded"
          style={{
            color: '#fca5a5',
            background: 'rgba(0,0,0,0.55)',
          }}
        >
          ⚔{ap}
        </span>
        <span
          className="text-[8px] font-bold leading-tight px-0.5 rounded"
          style={{
            color: hpDamaged ? '#fbbf24' : '#93c5fd',
            background: 'rgba(0,0,0,0.55)',
          }}
        >
          {remainingHp}/{hp}
        </span>
      </div>

      {/* REST badge */}
      {isResting && (
        <div className="absolute top-[3px] right-[3px] pointer-events-none">
          <span
            className="text-[7px] font-bold leading-tight rounded px-[3px] py-[1px]"
            style={{
              background: 'rgba(30,41,59,0.85)',
              color: '#94a3b8',
            }}
          >
            REST
          </span>
        </div>
      )}

      {/* ATK badge */}
      {isAttacking && (
        <div className="absolute top-[3px] left-[3px] pointer-events-none">
          <span
            className="text-[7px] font-bold leading-tight rounded px-[3px] py-[1px]"
            style={{
              background: 'rgba(146,64,14,0.85)',
              color: '#fde68a',
            }}
          >
            ATK
          </span>
        </div>
      )}

      {/* Target crosshair on hover (opponent in targeting mode) */}
      {isTargetable && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span
            className="text-lg drop-shadow-lg"
            style={{ color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.5)' }}
          >
            ⚔
          </span>
        </div>
      )}

      {/* Attack overlay (player units, main phase, ready, no current attacker) */}
      {canAttack && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(127,29,29,0.45)' }}
          onClick={(e) => {
            e.stopPropagation();
            onUnitSelected?.(unit);
          }}
          aria-label={`Attack with ${card?.name ?? unit.cardId}`}
        >
          <span
            className="text-[10px] font-bold rounded px-1.5 py-0.5"
            style={{
              background: 'rgba(153,27,27,0.8)',
              color: '#fecaca',
            }}
          >
            ⚔ Attack
          </span>
        </button>
      )}
    </div>
  );
}
