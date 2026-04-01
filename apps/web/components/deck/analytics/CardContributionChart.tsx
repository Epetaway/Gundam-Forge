'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

interface CardContributionChartProps {
  items: DeckViewItem[];
  /** Highlight a specific type bucket on hover */
  className?: string;
}

const TYPE_PALETTE: Record<string, { fill: string; label: string }> = {
  Unit:     { fill: 'hsl(220 90% 64%)', label: 'Unit' },
  Pilot:    { fill: 'hsl(158 64% 52%)', label: 'Pilot' },
  Command:  { fill: 'hsl(42 96% 56%)',  label: 'Command' },
  Base:     { fill: 'hsl(220 20% 80%)', label: 'Base' },
  Resource: { fill: 'hsl(220 14% 46%)', label: 'Resource' },
};

const fallbackColor = 'hsl(220 14% 60%)';

/**
 * CardContributionChart
 *
 * Animated horizontal bars, one per card type bucket, showing how many
 * copies of each type are in the deck. Bars fill left-to-right on mount
 * and re-animate on data change. Hover a bar to see details.
 */
export function CardContributionChart({ items, className }: CardContributionChartProps) {
  const [hoveredType, setHoveredType] = React.useState<string | null>(null);

  const typeCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of items) {
      const t = item.typeLine ?? 'Unknown';
      map[t] = (map[t] ?? 0) + item.qty;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // top 6 types
  }, [items]);

  const total = typeCounts.reduce((s, [, n]) => s + n, 0);

  if (typeCounts.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-24 text-xs text-steel-600 italic', className)}>
        No cards yet
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="card-contribution-chart"
      aria-label="Card type distribution"
    >
      {typeCounts.map(([type, count], idx) => {
        const palette = TYPE_PALETTE[type];
        const fill  = palette?.fill ?? fallbackColor;
        const label = palette?.label ?? type;
        const pct   = total > 0 ? (count / total) * 100 : 0;
        const share = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
        const isHovered = hoveredType === type;

        return (
          <div
            key={type}
            className="group"
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType(null)}
            onFocus={() => setHoveredType(type)}
            onBlur={() => setHoveredType(null)}
            role="presentation"
          >
            <div className="mb-0.5 flex items-center justify-between">
              <span className={cn(
                'font-mono text-[10px] uppercase tracking-wider transition-colors',
                isHovered ? 'text-foreground' : 'text-steel-500',
              )}>
                {label}
              </span>
              <span className={cn(
                'font-mono text-[10px] tabular-nums transition-colors',
                isHovered ? 'text-foreground' : 'text-steel-600',
              )}>
                {count} <span className="text-steel-700">({share}%)</span>
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-interactive">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: fill,
                  boxShadow: isHovered ? `0 0 8px ${fill}90` : 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: 0.55,
                  delay: idx * 0.06,
                  ease: [0.4, 0, 0.2, 1],
                }}
                aria-valuenow={count}
                aria-valuemax={total}
                role="progressbar"
                aria-label={label}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
