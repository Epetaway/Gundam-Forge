/**
 * Adaptive Hand Tray Component
 * Desktop: Arc fan layout with hover zoom
 * Mobile: Fixed bottom drawer with swipe gesture
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="w-full h-20 md:h-32 flex items-center justify-center text-slate-500 text-sm">
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
        drawerOpen,
        setDrawerOpen,
      }}
    />
  );
}

/**
 * Desktop Arc Fan Layout
 * Cards arranged in arc with hover zoom effect
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
}: {
  cards: CardInstance[];
  cardDatabase: Record<string, any>;
  selectedCard: CardInstance | null;
  onSelectCard: (card: CardInstance) => void;
  onPlayCard: (card: CardInstance) => void;
  canPlayCards: boolean;
  hoveredCard: string | null;
  setHoveredCard: (id: string | null) => void;
}) {
  const cardCount = cards.length;
  const radius = 220;
  const startAngle = -90 + (cardCount - 1) * 4;
  const angleStep = cardCount > 1 ? 160 / (cardCount - 1) : 0;

  return (
    <div className="relative w-full h-32 flex justify-center items-end px-4">
      <div className="relative w-full h-full max-w-5xl">
        {cards.map((card, index) => {
          const angle = startAngle + index * angleStep;
          const radians = (angle * Math.PI) / 180;
          const x = radius * Math.cos(radians);
          const y = radius * Math.sin(radians);

          const cardData = cardDatabase[card.cardId];
          const isSelected = selectedCard?.instanceId === card.instanceId;
          const isHovered = hoveredCard === card.instanceId;

          return (
            <motion.div
              key={card.instanceId}
              className="absolute"
              style={{
                bottom: '10px',
                left: '50%',
              }}
              animate={{
                x: `calc(-50% + ${x}px)`,
                y: `${y}px`,
                zIndex: isSelected ? 50 : isHovered ? 30 : 10 + index,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button
                onClick={() => onSelectCard(card)}
                onMouseEnter={() => setHoveredCard(card.instanceId)}
                onMouseLeave={() => setHoveredCard(null)}
                className={cn(
                  'relative group transition-all duration-150 ease-out',
                  'flex flex-col items-center',
                  isSelected && 'scale-110',
                  isHovered && !isSelected && 'scale-105 -translate-y-6',
                )}
                title={cardData?.name || card.cardId}
              >
                {/* Card Image */}
                <div
                  className={cn(
                    'relative aspect-[5/7] rounded-lg overflow-hidden',
                    'border-2 shadow-lg transition-all',
                    'w-20 sm:w-24',
                    isSelected
                      ? 'border-yellow-400 shadow-yellow-500/50 ring-2 ring-yellow-300'
                      : isHovered
                        ? 'border-slate-400 shadow-slate-600/50'
                        : 'border-slate-600 shadow-slate-900/50',
                  )}
                >
                  {cardData ? (
                    <CardArtImage
                      card={cardData}
                      alt={cardData.name}
                      priority={false}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center">
                      <span className="text-xs text-slate-400">?</span>
                    </div>
                  )}
                </div>

                {/* Cost Badge */}
                {cardData && (
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold border border-cyan-300 shadow-lg">
                    {cardData.cost || 0}
                  </div>
                )}

                {/* Play Button on Hover (if in main phase) */}
                {canPlayCards && isHovered && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayCard(card);
                    }}
                    className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-green-600/80 hover:bg-green-500 text-white text-xs font-bold rounded opacity-100 transition-colors"
                  >
                    Play
                  </motion.button>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
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
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}) {
  const itemsPerRow = 4;
  const rows = Math.ceil(cards.length / itemsPerRow);
  const drawerHeight = drawerOpen ? Math.min(rows * 120 + 50, 300) : 50;

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t-2 border-purple-600/30 z-40 touch-pan-y"
      animate={{ height: drawerHeight }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Handle Bar */}
      <button
        onClick={() => setDrawerOpen(!drawerOpen)}
        className="w-full h-12 flex items-center justify-center border-b border-slate-700 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-bold text-slate-300 uppercase">
            Hand ({cards.length}/10)
          </div>
          <motion.div animate={{ rotate: drawerOpen ? 180 : 0 }}>
            {drawerOpen ? (
              <ChevronDown size={16} className="text-slate-400" />
            ) : (
              <ChevronUp size={16} className="text-slate-400" />
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
            className="p-3 overflow-y-auto"
            style={{ maxHeight: `calc(${drawerHeight}px - 50px)` }}
          >
            <div className="grid grid-cols-4 gap-2">
              {cards.map((card) => {
                const cardData = cardDatabase[card.cardId];
                const isSelected = selectedCard?.instanceId === card.instanceId;

                return (
                  <button
                    key={card.instanceId}
                    onClick={() => onSelectCard(card)}
                    onMouseEnter={() => setHoveredCard(card.instanceId)}
                    onMouseLeave={() => setHoveredCard(null)}
                    className={cn(
                      'relative group aspect-[5/7] rounded-lg overflow-hidden',
                      'border-2 transition-all',
                      isSelected
                        ? 'border-yellow-400 ring-2 ring-yellow-300 scale-105'
                        : 'border-slate-600 hover:border-slate-400',
                    )}
                    title={cardData?.name || card.cardId}
                  >
                    {cardData ? (
                      <CardArtImage
                        card={cardData}
                        alt={cardData.name}
                        priority={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center">
                        <span className="text-xs text-slate-400">?</span>
                      </div>
                    )}

                    {/* Cost Badge */}
                    {cardData && (
                      <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border border-cyan-300">
                        {cardData.cost || 0}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
