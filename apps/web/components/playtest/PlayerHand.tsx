/**
 * Player Hand Component
 * Displays cards in hand in an arc arrangement with full artwork
 */

'use client';

import React, { useState } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

interface PlayerHandProps {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  gamePhase: string;
  isPlayerTurn: boolean;
}

export function PlayerHand({
  cards,
  cardDatabase,
  selectedCard,
  onSelectCard,
  onPlayCard,
  gamePhase,
  isPlayerTurn,
}: PlayerHandProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const canPlayCards = gamePhase === 'main' && isPlayerTurn;

  if (cards.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center text-slate-500">
        Your hand is empty
      </div>
    );
  }

  // Calculate arc properties
  const cardCount = cards.length;
  const radius = 280;
  const startAngle = -90 + (cardCount - 1) * 5;
  const angleStep = cardCount > 1 ? 180 / (cardCount - 1) : 0;

  return (
    <div className="relative w-full h-80 flex justify-center items-end px-4">
      {/* Arc container */}
      <div className="relative w-full h-full max-w-4xl">
        {cards.map((card, index) => {
          const angle = startAngle + index * angleStep;
          const radians = (angle * Math.PI) / 180;
          const x = radius * Math.cos(radians);
          const y = radius * Math.sin(radians);

          const cardData = cardDatabase[card.cardId];
          const isSelected = selectedCard?.instanceId === card.instanceId;
          const isHovered = hoveredCard === card.instanceId;

          return (
            <div
              key={card.instanceId}
              className="absolute"
              style={{
                bottom: '20px',
                left: '50%',
                transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px)`,
                zIndex: isSelected ? 50 : isHovered ? 30 : 10 + index,
              }}
            >
              <button
                onClick={() => onSelectCard(card)}
                onMouseEnter={() => setHoveredCard(card.instanceId)}
                onMouseLeave={() => setHoveredCard(null)}
                className={cn(
                  'relative group transition-all duration-150 ease-out',
                  'flex flex-col items-center',
                  isSelected && 'scale-110',
                  isHovered && !isSelected && 'scale-105 -translate-y-4',
                )}
                title={cardData?.name || card.cardId}
              >
                {/* Card Image */}
                <div
                  className={cn(
                    'relative aspect-[5/7] rounded-lg overflow-hidden',
                    'border-2 shadow-lg transition-all',
                    'w-20 sm:w-24 md:w-28',
                    isSelected
                      ? 'border-yellow-400 shadow-yellow-500/50 ring-2 ring-yellow-300'
                      : 'border-slate-600 shadow-slate-900/50 hover:border-slate-500',
                  )}
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
                      <div className="text-center text-xs text-slate-400 px-1 font-mono">
                        {card.cardId}
                      </div>
                    </div>
                  )}
                </div>

                {/* Play Button - Only show when selected */}
                {isSelected && canPlayCards && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayCard(card);
                    }}
                    className="mt-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-semibold transition shadow-lg whitespace-nowrap"
                  >
                    Play Card
                  </button>
                )}

                {/* Card Name Tooltip */}
                {cardData && (isSelected || isHovered) && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs font-semibold text-white whitespace-nowrap pointer-events-none">
                    {cardData.name}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Play Phase Indicator */}
      {!canPlayCards && (
        <div className="absolute bottom-2 right-4 text-xs text-slate-500">
          Cannot play - wait for Main Phase
        </div>
      )}
    </div>
  );
}
