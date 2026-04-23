'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { PracticalAnalysisPanel } from './PracticalAnalysisPanel';
import type { DeckViewItem } from '@/lib/deck/sortFilter';
import type { DeckAnalyticsDto } from '@/lib/api/deckAnalytics';

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function SkeletonBar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'rounded bg-surface-interactive animate-pulse',
        className,
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-4" aria-label="Loading analytics…" role="status">
      {/* Gauge placeholder */}
      <div className="flex justify-center">
        <SkeletonBar className="h-20 w-36 rounded-lg" />
      </div>
      {/* Consistency bar placeholder */}
      <div className="space-y-2">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-3 w-full" />
      </div>
      {/* Type bars placeholder */}
      <div className="space-y-2">
        {[80, 60, 45, 30].map((w) => (
          <SkeletonBar key={w} className="h-2.5" style={{ width: `${w}%` }} />
        ))}
      </div>
      {/* Trend sparkline placeholder */}
      <SkeletonBar className="h-16 w-full rounded-lg" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function AnalyticsEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel-600">
        No Analytics Yet
      </p>
      <p className="text-xs text-steel-600 max-w-[200px]">
        Save and publish this deck to start generating analytics data.
      </p>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface DeckAnalyticsPanelProps {
  /** Items currently in the deck (live from builder or view). */
  items: DeckViewItem[];
  /**
   * Server-fetched analytics DTO. Pass `undefined` while loading.
   * Pass `null` when loaded but no data is available.
   */
  serverAnalytics: DeckAnalyticsDto | null | undefined;
  /** Override metaProximity with a client-computed value for live builder updates. */
  liveMetaProximity?: number;
  /** Override consistencyIndex with a client-computed value. */
  liveConsistencyIndex?: number;
  className?: string;
  isLoading?: boolean;
}

/**
 * DeckAnalyticsPanel
 *
 * The main container that composes all four chart components into a
 * cohesive, cinematic analytics view. It:
 * - Shows a skeleton while loading.
 * - Uses server analytics for the sparkline (needs historical data).
 * - Prefers live client-computed scores for gauge + consistency (instant updates).
 * - Respects prefers-reduced-motion via Framer Motion's global setting.
 */
export function DeckAnalyticsPanel({
  items,
  serverAnalytics,
  liveMetaProximity,
  liveConsistencyIndex,
  className,
  isLoading = false,
}: DeckAnalyticsPanelProps) {
  void liveMetaProximity;

  return (
    <section
      className={cn(
        'rounded-lg border border-cobalt-900/65 bg-gradient-to-br from-surface-elevated via-surface to-surface shadow-[0_8px_24px_rgba(2,6,23,0.35)]',
        className,
      )}
      aria-label="Deck analytics"
      data-testid="deck-analytics-panel"
    >
      {/* Header */}
      <div className="border-b border-cobalt-900/65 px-4 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-200">
          Deck Analytics
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyticsSkeleton />
          </motion.div>
        ) : serverAnalytics === null && items.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnalyticsEmpty />
          </motion.div>
        ) : (
          <motion.div
            key="data"
            className="space-y-6 p-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <PracticalAnalysisPanel
              items={items}
              serverAnalytics={serverAnalytics ?? undefined}
              liveConsistencyIndex={liveConsistencyIndex}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
