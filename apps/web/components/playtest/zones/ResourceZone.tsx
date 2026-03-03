/**
 * Resource Area Zone Component
 * Shows face-up resources in play
 * Resources can be tapped/rested for 90° rotation
 */

'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';
import { getCardById } from '@/lib/data/cards';
import { CardStack } from '../CardStack';

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
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: isOpponent ? 'opponent-resources' : 'resources',
    data: { zone: isOpponent ? 'opponent-resources' : 'resources' },
  });

  return (
    <div
      ref={isOpponent ? undefined : setNodeRef}
      className={`border-2 rounded-lg bg-surface-elevated p-3 transition-colors ${
        !isOpponent && isOver ? 'border-cyan-500 bg-cyan-900/20' : 'border-border'
      }`}
    >
      <div className="text-xs font-bold text-white uppercase mb-2 tracking-wider">
        Resources In Play
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {resources.length > 0 ? (
          resources.map((resource) => {
            const isResting = resource.state === 'rest';
            return (
              <div
                key={resource.instanceId}
                className={`flex justify-center transition-all duration-200 ${isResting ? 'opacity-60' : 'opacity-100'} ${selectedResource === resource.instanceId ? 'ring-2 ring-yellow-400 rounded' : ''}`}
                style={{
                  transform: isResting ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
                onClick={() => setSelectedResource(resource.instanceId)}
              >
                <CardStack
                  cards={resource}
                  cardDatabase={cardDatabase}
                  variant="compact"
                  showCount={false}
                />
              </div>
            );
          })
        ) : (
          <div className="col-span-2 text-white text-xs italic py-2 text-center">
            No resources in play
          </div>
        )}
      </div>

      {/* Count Badge */}
      <div className="bg-cyan-900/50 border border-cyan-600 rounded p-1.5 text-center">
        <div className="text-xs font-bold text-cyan-300">
          {resources.filter(r => r.state === 'ready').length} ready /{' '}
          {resources.filter(r => r.state === 'rest').length} resting
        </div>
      </div>
    </div>
  );
}
