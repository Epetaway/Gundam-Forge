/**
 * Animated Card Component
 * Card display with attack, damage, and destruction animations
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  attackAnimation,
  damageFloatAnimation,
  unitDestructionAnimation,
} from '@/lib/animations/variants';
import { CardInstance } from '@/lib/game/game-engine';

interface AnimatedCardProps {
  card: CardInstance & { cardDef?: any };
  isOpponent?: boolean;
  onSelect?: (card: CardInstance) => void;
  isSelected?: boolean;
  showDamage?: boolean;
  damageAmount?: number;
  isDestroying?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  card,
  isOpponent = false,
  onSelect,
  isSelected = false,
  showDamage = false,
  damageAmount = 0,
  isDestroying = false,
  onClick,
}: AnimatedCardProps) {
  const [isAttacking, setIsAttacking] = useState(false);

  const cardDef = card.cardDef || { name: 'Unknown', atk: 0, def: 0 };

  return (
    <motion.div
      layout
      variants={
        isDestroying
          ? unitDestructionAnimation
          : isAttacking
            ? attackAnimation
            : undefined
      }
      initial={isDestroying ? 'initial' : undefined}
      animate={isDestroying ? 'destroy' : isAttacking ? 'attack' : 'rest'}
      className={`relative cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-yellow-400 scale-105'
          : 'hover:scale-102 ring-1 ring-slate-600'
      } ${isOpponent ? 'ring-red-600' : 'ring-blue-600'}`}
      onClick={() => {
        onSelect?.(card);
        onClick?.();
      }}
      onAnimationComplete={() => {
        if (isAttacking) setIsAttacking(false);
      }}
    >
      {/* Card Display */}
      <div className="relative bg-slate-800 border border-slate-600 rounded overflow-hidden">
        {/* Card Image or Placeholder */}
        <div className="h-24 bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center text-xs text-slate-400 overflow-hidden">
          {cardDef.imageUrl ? (
            <img
              src={cardDef.imageUrl}
              alt={cardDef.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <div className="font-bold text-yellow-500">{cardDef.atk || '-'}</div>
              <div className="text-xs">ATK</div>
            </div>
          )}
        </div>

        {/* Card Stats */}
        <div className="p-2 text-xs">
          <div className="font-semibold text-white truncate">{cardDef.name}</div>
          <div className="flex justify-between mt-1 text-slate-300">
            <span>⚔️ {cardDef.atk || '-'}</span>
            <span>🛡️ {cardDef.def || '-'}</span>
          </div>
        </div>

        {/* Damage Markers */}
        {card.damageMarkers > 0 && (
          <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {card.damageMarkers}
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-4 border-yellow-400 rounded pointer-events-none" />
        )}

        {/* State Indicator */}
        {card.state === 'rest' && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
            <div className="text-xs font-bold text-slate-300">RESTING</div>
          </div>
        )}
      </div>

      {/* Floating Damage Numbers */}
      {showDamage && damageAmount > 0 && (
        <motion.div
          variants={damageFloatAnimation}
          initial="initial"
          animate="animate"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-red-500 pointer-events-none select-none"
        >
          -{damageAmount}
        </motion.div>
      )}
    </motion.div>
  );
}
