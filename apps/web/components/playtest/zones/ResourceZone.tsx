/**
 * Resource Zone — compact horizontal strip of resource tiles
 * Official GCG layout: resources sit in a row behind the battle area.
 * Ready resources stand upright; rested resources tip sideways.
 */

'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';

interface ResourceZoneProps {
  resources: CardInstance[];
  cardDatabase: Record<string, any>;
  isOpponent: boolean;
}

export function ResourceZone({
  resources,
  cardDatabase,
  isOpponent,
}: ResourceZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: isOpponent ? 'opponent-resources' : 'resources',
    data: { zone: isOpponent ? 'opponent-resources' : 'resources' },
  });

  const readyCount = resources.filter((r) => r.state === 'ready').length;
  const restCount = resources.filter((r) => r.state === 'rest').length;

  return (
    <div
      ref={isOpponent ? undefined : setNodeRef}
      className={`flex items-center gap-1 py-0.5 min-h-[32px] flex-wrap transition-colors duration-200 ${
        !isOpponent && isOver ? 'bg-cyan-950/20 rounded-lg px-1' : ''
      }`}
    >
      {resources.length === 0 ? (
        <span
          className="text-[9px]"
          style={{ color: 'rgba(100,116,139,0.4)' }}
        >
          No resources
        </span>
      ) : (
        <>
          {resources.map((res) => {
            const card = cardDatabase[res.cardId];
            const isResting = res.state === 'rest';
            return (
              <ResourcePip
                key={res.instanceId}
                card={card}
                isResting={isResting}
                label={card?.name ?? res.cardId}
              />
            );
          })}
          {/* Count summary */}
          <span
            className="ml-1 text-[9px] leading-none whitespace-nowrap"
            style={{ color: 'rgba(100,116,139,0.6)' }}
          >
            {readyCount}✦&nbsp;{restCount > 0 ? `/ ${restCount}○` : ''}
          </span>
        </>
      )}
    </div>
  );
}

function ResourcePip({
  card,
  isResting,
  label,
}: {
  card: any;
  isResting: boolean;
  label: string;
}) {
  return (
    <div
      className="flex-shrink-0 relative transition-all duration-300"
      title={`${label} (${isResting ? 'rested' : 'ready'})`}
      style={{
        width: '22px',
        height: '30px',
        transform: isResting ? 'rotate(90deg)' : 'none',
        opacity: isResting ? 0.5 : 1,
      }}
    >
      {card?.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name ?? ''}
          className="w-full h-full object-cover rounded-sm"
        />
      ) : (
        <div
          className="w-full h-full rounded-sm flex items-center justify-center"
          style={{
            border: isResting
              ? '1px solid rgba(71,85,105,0.4)'
              : '1px solid rgba(59,130,246,0.45)',
            background: isResting
              ? 'rgba(30,41,59,0.5)'
              : 'linear-gradient(160deg, rgba(30,58,138,0.5) 0%, rgba(15,23,42,0.7) 100%)',
          }}
        >
          <span
            className="text-[7px] font-bold"
            style={{ color: isResting ? '#475569' : '#60a5fa' }}
          >
            R
          </span>
        </div>
      )}

      {/* Ready glow dot */}
      {!isResting && (
        <div
          className="absolute -top-[2px] -right-[2px] w-[6px] h-[6px] rounded-full"
          style={{
            background: '#3b82f6',
            boxShadow: '0 0 4px rgba(59,130,246,0.6)',
          }}
        />
      )}
    </div>
  );
}
