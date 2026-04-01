'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface ConsistencyScaleProps {
  /** 0–100 consistency score */
  score: number;
  className?: string;
}

interface Zone {
  label: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
  warning?: string;
}

const ZONES: Zone[] = [
  { label: 'Poor',      min: 0,  max: 34, color: 'hsl(0 72% 42%)',    textColor: 'hsl(0 72% 72%)',   warning: 'Deck may be too inconsistent for competitive play.' },
  { label: 'Average',   min: 35, max: 54, color: 'hsl(30 80% 42%)',   textColor: 'hsl(30 90% 68%)',  warning: 'Some consistency issues. Consider tightening your core.' },
  { label: 'Solid',     min: 55, max: 74, color: 'hsl(38 88% 46%)',   textColor: 'hsl(38 90% 70%)' },
  { label: 'Strong',    min: 75, max: 89, color: 'hsl(142 60% 38%)',  textColor: 'hsl(142 60% 65%)' },
  { label: 'Excellent', min: 90, max: 100, color: 'hsl(142 71% 44%)', textColor: 'hsl(142 71% 68%)' },
];

function getZone(score: number): Zone {
  return ZONES.find((z) => score >= z.min && score <= z.max) ?? ZONES[0];
}

/**
 * ConsistencyScale
 *
 * Linear 0–100 scale with CSS3 animated fill, colour-coded zones,
 * and a subtle warning message for low scores.
 * Re-animates the fill whenever the score changes.
 */
export function ConsistencyScale({ score, className }: ConsistencyScaleProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const zone = getZone(clamped);

  return (
    <motion.div
      className={cn('space-y-2', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      data-testid="consistency-scale"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel-500">
          Consistency
        </span>
        <span
          className="font-mono text-xs font-semibold"
          style={{ color: zone.textColor, transition: 'color 0.4s ease' }}
        >
          {zone.label}
        </span>
      </div>

      {/* Track */}
      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-surface-interactive"
        role="meter"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Consistency: ${Math.round(clamped)} out of 100 — ${zone.label}`}
      >
        {/* Zone segments (static, cosmetic) */}
        <div className="absolute inset-0 flex">
          {ZONES.map((z, index) => {
            const next = ZONES[index + 1];
            const zoneWidth = next ? next.min - z.min : 100 - z.min;

            return (
              <div
                key={z.label}
                className="h-full opacity-15"
                style={{
                  width: `${zoneWidth}%`,
                  background: z.color,
                }}
              />
            );
          })}
        </div>

        {/* Filled bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: zone.color,
            boxShadow: `0 0 10px ${zone.color}80`,
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
          }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Score label */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tabular-nums text-steel-600">0</span>
        <span
          className="font-mono text-sm font-bold tabular-nums"
          style={{ color: zone.textColor, transition: 'color 0.4s ease' }}
        >
          {Math.round(clamped)}
          <span className="text-xs font-normal text-steel-600">/100</span>
        </span>
        <span className="font-mono text-xs tabular-nums text-steel-600">100</span>
      </div>

      {/* Warning message for low scores */}
      {zone.warning && (
        <motion.p
          key={zone.label}
          className="rounded border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-400"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
        >
          {zone.warning}
        </motion.p>
      )}
    </motion.div>
  );
}
