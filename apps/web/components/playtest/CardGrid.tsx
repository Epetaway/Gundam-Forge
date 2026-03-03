'use client';

import React from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

interface CardGridProps {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard?: CardInstance | null;
  onSelectCard?: (card: CardInstance) => void;
  gap?: string;
  columns?: number;
  maxHeight?: string;
  canInteract?: boolean;
}

export function CardGrid({
  cards,
  cardDatabase,
  selectedCard,
  onSelectCard,
  gap = 'gap-2',
  columns = 4,
  maxHeight = 'max-h-96',
  canInteract = true,
}: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-white">
        No cards
      </div>
    );
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-4';

  return (
    <div className={cn('overflow-y-auto', maxHeight)}>
      <div className={cn('grid', gridColsClass, gap, 'p-2')}>
        {cards.map((card) => {
          const cardData = cardDatabase[card.cardId];
          const isSelected = selectedCard?.instanceId === card.instanceId;

          return (
            <button
              key={card.instanceId}
              onClick={() => canInteract && onSelectCard?.(card)}
              disabled={!canInteract}
              className={cn(
                'relative aspect-[5/7] rounded-lg overflow-hidden transition-all',
                'border-2 hover:shadow-lg',
                isSelected
                  ? 'border-yellow-400 shadow-lg shadow-yellow-500/50'
                  : 'border-slate-600 hover:border-slate-500',
                canInteract && 'cursor-pointer',
              )}
              title={cardData?.name || card.cardId}
            >
              {cardData ? (
                <CardArtImage
                  card={cardData}
                  alt={cardData.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <div className="text-center text-xs text-white px-1">
                    {card.cardId}
                  </div>
                </div>
              )}

              {/* Quantity Badge for deck view */}
              {card.state === 'ready' && (
                <div className="absolute bottom-1 right-1 bg-black/70 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-white border border-slate-400">
                  1
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
