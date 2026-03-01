/**
 * CardStack Component
 * Renders a stack of identical cards with proper layering and count badge
 * Supports both single card display and multiple card stacks
 */

'use client';

import React, { useState } from 'react';
import type { CardInstance, CardDefinition } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';

interface CardStackProps {
  /** Card instance(s) to display */
  cards: CardInstance | CardInstance[];
  /** Card database for looking up card data */
  cardDatabase: Record<string, any>;
  /** Optional: Click handler */
  onClick?: () => void;
  /** Optional: CSS class names for customization */
  className?: string;
  /** Stack display variant */
  variant?: 'compact' | 'normal' | 'large';
  /** Show count badge */
  showCount?: boolean;
  /** Can be dragged */
  draggable?: boolean;
  /** Optional: onDragStart handler */
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, card: CardInstance) => void;
}

type StackVariant = 'compact' | 'normal' | 'large';

const VARIANT_CONFIG: Record<StackVariant, { width: string; height: string; offset: string }> = {
  compact: {
    width: 'w-12',    // ~48px
    height: 'h-16',   // ~64px (aspect 5:7)
    offset: 'translate-y-1',
  },
  normal: {
    width: 'w-16',    // ~64px
    height: 'h-24',   // ~96px (aspect 5:7)
    offset: 'translate-y-2',
  },
  large: {
    width: 'w-20',    // ~80px
    height: 'h-28',   // ~112px (aspect 5:7)
    offset: 'translate-y-3',
  },
};

export function CardStack({
  cards,
  cardDatabase,
  onClick,
  className,
  variant = 'normal',
  showCount = true,
  draggable = false,
  onDragStart,
}: CardStackProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Normalize to array
  const cardArray = Array.isArray(cards) ? cards : [cards];
  if (cardArray.length === 0) return null;

  const config = VARIANT_CONFIG[variant];

  // Get first card for display (top of stack)
  const topCard = cardArray[0];
  const topCardData = cardDatabase[topCard.cardId];
  const stackSize = cardArray.length;
  const isFaceDown = topCard.faceDown || topCard.zone === 'shields';

  // Determine which cards to show visually (max 3 visible layers)
  const visibleCards = cardArray.slice(0, Math.min(3, cardArray.length));

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200',
        isHovered && 'scale-105',
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(e) => {
        if (draggable && onDragStart && topCard) {
          onDragStart(e, topCard);
        }
      }}
      draggable={draggable}
      style={{ aspectRatio: '5 / 7' }}
      title={topCardData?.name || topCard.cardId}
    >
      {/* Stack layers (max 3 visible) */}
      <div className={cn('relative', config.width, config.height)}>
        {visibleCards.map((card, index) => {
          const cardData = cardDatabase[card.cardId];

          return (
            <div
              key={card.instanceId || index}
              className={cn(
                'absolute inset-0 rounded-lg overflow-hidden border-2 border-slate-600',
                'shadow-lg transition-all duration-200',
                isHovered && 'border-slate-400 shadow-slate-500/50',
              )}
              style={{
                transform: `${config.offset.replace('translate-y-', 'translateY(') + index * 4}px)`,
                zIndex: visibleCards.length - index,
              }}
            >
              {isFaceDown ? (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center border-2 border-purple-500/30">
                  <div className="text-center">
                    <div className="text-4xl opacity-30">🛡️</div>
                    <div className="text-[10px] text-purple-300/50 font-bold uppercase tracking-wider mt-1">Shield</div>
                  </div>
                </div>
              ) : cardData ? (
                <CardArtImage
                  card={cardData}
                  alt={cardData.name}
                  fill
                  priority={false}
                  loading="lazy"
                  quality={75}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center text-slate-400">
                  <span className="text-xs">?</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Count badge (top-right) */}
      {showCount && stackSize > 1 && (
        <div className="absolute -top-2 -right-2 flex items-center justify-center">
          <div className="min-w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-purple-300 shadow-lg">
            ×{stackSize}
          </div>
        </div>
      )}

      {/* Single card indicator */}
      {showCount && stackSize === 1 && topCardData && (
        <div className="absolute -top-2 -left-2 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-cyan-300 shadow-lg">
          {topCardData.cost || '0'}
        </div>
      )}

      {/* Tap indicator for mobile */}
      {isHovered && (
        <div className="absolute inset-0 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs font-bold">Tap</span>
        </div>
      )}
    </div>
  );
}

/**
 * CardStackRow Component
 * Renders multiple stacks in a horizontal row with proper spacing
 */
interface CardStackRowProps {
  stacks: (CardInstance | CardInstance[])[];
  cardDatabase: Record<string, any>;
  onStackClick?: (cardIndex: number) => void;
  variant?: StackVariant;
  maxStacks?: number;
  className?: string;
}

export function CardStackRow({
  stacks,
  cardDatabase,
  onStackClick,
  variant = 'normal',
  maxStacks,
  className,
}: CardStackRowProps) {
  const displayStacks = maxStacks ? stacks.slice(0, maxStacks) : stacks;

  if (displayStacks.length === 0) {
    return (
      <div className={cn('text-slate-600 text-sm italic p-4', className)}>
        No cards
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 p-2 flex-wrap', className)}>
      {displayStacks.map((stack, index) => (
        <CardStack
          key={index}
          cards={stack}
          cardDatabase={cardDatabase}
          onClick={() => onStackClick?.(index)}
          variant={variant}
          showCount={true}
        />
      ))}
      {maxStacks && stacks.length > maxStacks && (
        <div className="flex items-center justify-center px-2 text-slate-400 text-xs">
          +{stacks.length - maxStacks} more
        </div>
      )}
    </div>
  );
}
