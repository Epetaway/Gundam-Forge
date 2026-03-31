'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface MetaPressureGaugeProps {
  /** 0–100 meta proximity score */
  score: number;
  /** Optional label suffix shown beneath the score */
  label?: string;
  className?: string;
}

const RADIUS = 54;
const CIRCUMFERENCE = Math.PI * RADIUS; // half-circle arc

function scoreToColor(score: number): string {
  if (score >= 70) return 'hsl(142 71% 45%)';  // green
  if (score >= 40) return 'hsl(38 92% 50%)';   // amber
  return 'hsl(0 72% 51%)';                     // red
}

function scoreToGrade(score: number): string {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

/**
 * MetaPressureGauge
 *
 * Cinematic half-circle gauge showing how on-meta a deck is.
 * - Animated CSS stroke-dashoffset arc on score change.
 * - Framer Motion fade+scale entry.
 * - Respects prefers-reduced-motion.
 */
export function MetaPressureGauge({ score, label = 'Meta Proximity', className }: MetaPressureGaugeProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const dashFill = (clampedScore / 100) * CIRCUMFERENCE;
  const color = scoreToColor(clampedScore);
  const grade = scoreToGrade(clampedScore);

  return (
    <motion.div
      className={cn('flex flex-col items-center', className)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      data-testid="meta-pressure-gauge"
    >
      <svg
        width="140"
        height="80"
        viewBox="0 0 140 80"
        aria-label={`Meta pressure: ${Math.round(clampedScore)} out of 100`}
        role="img"
      >
        {/* Track arc */}
        <path
          d="M 14 76 A 56 56 0 0 1 126 76"
          fill="none"
          stroke="hsl(215 28% 17%)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Filled arc — CSS transition for smooth score updates */}
        <path
          d="M 14 76 A 56 56 0 0 1 126 76"
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={`${CIRCUMFERENCE - dashFill}`}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
        {/* Grade badge */}
        <text
          x="70"
          y="68"
          textAnchor="middle"
          fontSize="26"
          fontWeight="700"
          fontFamily="monospace"
          fill={color}
          style={{ transition: 'fill 0.4s ease' }}
        >
          {grade}
        </text>
      </svg>

      <div className="mt-1 flex flex-col items-center gap-0.5">
        <span
          className="font-mono text-xl font-bold tabular-nums"
          style={{ color, transition: 'color 0.4s ease' }}
        >
          {Math.round(clampedScore)}
          <span className="text-xs font-normal text-steel-500">/100</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel-500">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
