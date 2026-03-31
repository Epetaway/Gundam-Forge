'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface SparkPoint {
  date: string;
  score: number;
}

interface ArchetypeTrendLineProps {
  /** 7 data points oldest → newest */
  points: SparkPoint[];
  /** Trend direction for the label */
  trendDirection?: 'up' | 'flat' | 'down';
  className?: string;
}

const W = 260;
const H = 60;
const PAD = 6;

function buildPath(points: SparkPoint[]): string {
  if (points.length < 2) return '';
  const xs = points.map((_, i) => PAD + (i / (points.length - 1)) * (W - 2 * PAD));
  const scores = points.map((p) => p.score);
  const min  = Math.min(...scores, 0);
  const max  = Math.max(...scores, 1);
  const ys = scores.map((s) => H - PAD - ((s - min) / (max - min)) * (H - 2 * PAD));

  // Catmull-Rom smoothing via cubic bezier approximation
  const d = points.reduce((acc, _, i) => {
    if (i === 0) return `M ${xs[0]} ${ys[0]}`;
    const cpx1 = (xs[i - 1] + xs[i]) / 2;
    return `${acc} C ${cpx1} ${ys[i - 1]}, ${cpx1} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }, '');

  return d;
}

function buildAreaPath(linePath: string, points: SparkPoint[]): string {
  if (!linePath || points.length < 2) return '';
  const lastX = PAD + ((points.length - 1) / (points.length - 1)) * (W - 2 * PAD);
  return `${linePath} L ${lastX} ${H - PAD} L ${PAD} ${H - PAD} Z`;
}

const TREND_CONFIG = {
  up:   { color: 'hsl(142 71% 45%)', arrow: '↑', label: 'Rising' },
  flat: { color: 'hsl(220 14% 60%)', arrow: '→', label: 'Stable' },
  down: { color: 'hsl(0 72% 51%)',   arrow: '↓', label: 'Falling' },
};

/**
 * ArchetypeTrendLine
 *
 * 7-day sparkline area chart showing meta proximity over time.
 * The SVG path animates in via Framer Motion pathLength on mount.
 */
export function ArchetypeTrendLine({
  points,
  trendDirection = 'flat',
  className,
}: ArchetypeTrendLineProps) {
  const config = TREND_CONFIG[trendDirection];
  const linePath = buildPath(points);
  const areaPath = buildAreaPath(linePath, points);

  // Hover tooltip state
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const dotXs = points.map((_, i) => PAD + (i / Math.max(1, points.length - 1)) * (W - 2 * PAD));
  const scores = points.map((p) => p.score);
  const min  = Math.min(...scores, 0);
  const max  = Math.max(...scores, 1);
  const dotYs = scores.map((s) => H - PAD - ((s - min) / (max - min)) * (H - 2 * PAD));

  if (points.length < 2) {
    return (
      <div className={cn('flex items-center justify-center h-16 text-xs text-steel-600 italic', className)}>
        Not enough data yet
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)} data-testid="archetype-trend-line">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel-500">
          7-Day Trend
        </span>
        <span
          className="font-mono text-xs font-semibold"
          style={{ color: config.color }}
        >
          {config.arrow} {config.label}
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-label={`7-day meta trend: ${config.label}`}
        role="img"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={config.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={config.color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && (
          <motion.path
            d={areaPath}
            fill="url(#trend-area-grad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        )}

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={config.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${config.color}70)` }}
        />

        {/* Dot hit areas */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle
              cx={dotXs[i]}
              cy={dotYs[i]}
              r="10"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              aria-label={`${pt.date}: ${Math.round(pt.score)}`}
              tabIndex={0}
              role="button"
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            />
            <circle
              cx={dotXs[i]}
              cy={dotYs[i]}
              r={hoverIdx === i ? 4.5 : 2.5}
              fill={config.color}
              style={{ transition: 'r 0.15s ease' }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hoverIdx !== null && (
          <g>
            <rect
              x={Math.min(dotXs[hoverIdx] - 20, W - 50)}
              y={dotYs[hoverIdx] - 26}
              width="44"
              height="18"
              rx="4"
              fill="hsl(220 30% 8%)"
              stroke={config.color}
              strokeWidth="1"
            />
            <text
              x={Math.min(dotXs[hoverIdx] - 20, W - 50) + 22}
              y={dotYs[hoverIdx] - 13}
              textAnchor="middle"
              fontSize="10"
              fill="white"
              fontFamily="monospace"
            >
              {Math.round(points[hoverIdx].score)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
