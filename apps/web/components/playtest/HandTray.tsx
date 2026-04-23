/**
 * Adaptive Hand Tray Component
 * Desktop: Arc fan layout with hover zoom
 * Mobile: Fixed bottom drawer with swipe gesture
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import type { CardInstance } from '@/lib/game/game-engine';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface HandTrayProps {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  gamePhase: string;
  isPlayerTurn: boolean;
  onHoverCardChange?: (cardId: string | null) => void;
  onCardDoubleClick?: (cardId: string) => void;
}

/**
 * Desktop mode: Arc fan layout with hover zoom
 * Mobile mode: Swipeable bottom drawer
 */
export function HandTray({
  cards,
  cardDatabase,
  selectedCard,
  onSelectCard,
  onPlayCard,
  gamePhase,
  isPlayerTurn,
  onHoverCardChange,
  onCardDoubleClick,
}: HandTrayProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const canPlayCards = gamePhase === 'main' && isPlayerTurn;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (cards.length === 0) {
    return (
      <div className="w-full h-20 md:h-32 flex items-center justify-center text-white text-sm">
        Your hand is empty
      </div>
    );
  }

  // DESKTOP: Arc fan layout
  if (!isMobile) {
    return <DesktopArcFan {...{
      cards,
      cardDatabase,
      selectedCard,
      onSelectCard,
      onPlayCard,
      canPlayCards,
      hoveredCard,
      setHoveredCard,
      onHoverCardChange,
      onCardDoubleClick,
    }} />;
  }

  // MOBILE: Bottom drawer with swipe
  return (
    <MobileDrawer
      {...{
        cards,
        cardDatabase,
        selectedCard,
        onSelectCard,
        onPlayCard,
        canPlayCards,
        hoveredCard,
        setHoveredCard,
        onHoverCardChange,
        onCardDoubleClick,
        drawerOpen,
        setDrawerOpen,
      }}
    />
  );
}

/**
 * Thin wrapper that makes a single hand card draggable via dnd-kit
 */
function DraggableHandCard({
  card,
  children,
}: {
  card: CardInstance;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.instanceId,
    data: { card, fromZone: 'hand' },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.5 : 1, touchAction: 'none' }}
    >
      {children}
    </div>
  );
}

/**
 * Desktop Hand Layout
 * Horizontal scrollable row of cards with hover zoom.
 * Replaces the arc-fan which overflowed into the battle area.
 */
function DesktopArcFan({
  cards,
  cardDatabase,
  selectedCard,
  onSelectCard,
  onPlayCard,
  canPlayCards,
  hoveredCard,
  setHoveredCard,
  onHoverCardChange,
  onCardDoubleClick,
}: {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  canPlayCards: boolean;
  hoveredCard: string | null;
  setHoveredCard: (id: string | null) => void;
  onHoverCardChange?: (cardId: string | null) => void;
  onCardDoubleClick?: (cardId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center items-start px-4 pb-2 w-full overflow-visible">
      {cards.map((card) => {
        const cardData = cardDatabase[card.cardId];
        const isSelected = selectedCard?.instanceId === card.instanceId;
        const isHovered = hoveredCard === card.instanceId;

        return (
          <DraggableHandCard key={card.instanceId} card={card}>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => onSelectCard(card)}
                onMouseEnter={() => {
                  setHoveredCard(card.instanceId);
                  onHoverCardChange?.(card.cardId);
                }}
                onMouseLeave={() => {
                  setHoveredCard(null);
                  onHoverCardChange?.(null);
                }}
                onDoubleClick={() => onCardDoubleClick?.(card.cardId)}
                className={cn(
                  'relative group transition-all duration-150 ease-out flex flex-col items-center',
                  isSelected && '-translate-y-2 scale-105',
                  isHovered && !isSelected && '-translate-y-1 scale-[1.03]',
                )}
                title={cardData?.name || card.cardId}
              >
                <div
                  className={cn(
                    'relative aspect-[5/7] rounded-lg overflow-hidden',
                    'border-2 shadow-lg transition-all w-24 sm:w-28',
                    isSelected
                      ? 'border-cyan-300 shadow-cyan-500/35 ring-2 ring-cyan-200/80'
                      : isHovered
                        ? 'border-cyan-400/80 shadow-cyan-500/40'
                        : 'border-steel-600/80 shadow-surface/50',
                  )}
                >
                  {cardData ? (
                    <CardArtImage card={cardData} alt={cardData.name} fill priority={false} loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-surface-muted to-surface-elevated flex items-center justify-center">
                      <span className="text-xs text-white">?</span>
                    </div>
                  )}
                </div>

                {/* Cost badge */}
                {cardData && (
                  <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-cyan-300 shadow-lg">
                    {cardData.cost || 0}
                  </div>
                )}

                {/* Card name on hover */}
                {isHovered && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-slate-100 text-xs px-2 py-1 rounded border border-cyan-400/50 z-50 pointer-events-none shadow-lg">
                    {cardData?.name || card.cardId}
                  </div>
                )}
              </button>

              {/* Play button (main phase only) */}
              {canPlayCards && (isSelected || isHovered) && (
                <button
                  onClick={() => onPlayCard(card)}
                  className="absolute -bottom-6 left-0 right-0 mx-auto w-fit px-4 py-1 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded transition-colors z-[60] shadow-lg"
                >
                  Play
                </button>
              )}
            </div>
          </DraggableHandCard>
        );
      })}
    </div>
  );
}

/**
 * Mobile Bottom Drawer
 * Swipeable drawer that shows/hides cards
 */
function MobileDrawer({
  cards,
  cardDatabase,
  selectedCard,
  onSelectCard,
  onPlayCard,
  canPlayCards,
  hoveredCard,
  setHoveredCard,
  onHoverCardChange,
  onCardDoubleClick,
  drawerOpen,
  setDrawerOpen,
}: {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  canPlayCards: boolean;
  hoveredCard: string | null;
  setHoveredCard: (id: string | null) => void;
  onHoverCardChange?: (cardId: string | null) => void;
  onCardDoubleClick?: (cardId: string) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}) {
  const itemsPerRow = 4;
  const rows = Math.ceil(cards.length / itemsPerRow);
  const drawerHeight = drawerOpen ? Math.min(rows * 120 + 50, 300) : 50;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-surface/95 border-t-2 border-cobalt-500/30 z-50 touch-pan-y"
      animate={{ height: drawerHeight }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Handle Bar */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="w-full h-12 flex items-center justify-center border-b border-border hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-bold text-white uppercase">
            Hand ({cards.length}/10)
          </div>
          <motion.div animate={{ rotate: drawerOpen ? 180 : 0 }}>
            {drawerOpen ? (
              <ChevronDown size={16} className="text-white" />
            ) : (
              <ChevronUp size={16} className="text-white" />
            )}
          </motion.div>
        </div>
      </button>

      {/* Cards Grid */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 overflow-y-auto"
            style={{ maxHeight: `calc(${drawerHeight}px - 50px)` }}
          >
            <div className="grid grid-cols-4 gap-2">
              {cards.map((card) => {
                const cardData = cardDatabase[card.cardId];
                const isSelected = selectedCard?.instanceId === card.instanceId;

                return (
                  <DraggableHandCard key={card.instanceId} card={card}>
                  <button
                    onClick={() => onSelectCard(card)}
                    onMouseEnter={() => {
                      setHoveredCard(card.instanceId);
                      onHoverCardChange?.(card.cardId);
                    }}
                    onMouseLeave={() => {
                      setHoveredCard(null);
                      onHoverCardChange?.(null);
                    }}
                    onDoubleClick={() => onCardDoubleClick?.(card.cardId)}
                    className={cn(
                      'relative group aspect-[5/7] rounded-lg overflow-hidden',
                      'border-2 transition-all',
                      isSelected
                        ? 'border-yellow-400 ring-2 ring-yellow-300 scale-105'
                        : 'border-steel-600 hover:border-steel-400',
                    )}
                    title={cardData?.name || card.cardId}
                  >
                    {cardData ? (
                      <CardArtImage
                        card={cardData}
                        alt={cardData.name}
                        fill
                        priority={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-surface-muted to-surface-elevated flex items-center justify-center">
                        <span className="text-xs text-white">?</span>
                      </div>
                    )}

                    {/* Cost Badge */}
                    {cardData && (
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border border-cyan-300 shadow">
                        {cardData.cost || 0}
                      </div>
                    )}
                  </button>
                  </DraggableHandCard>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
