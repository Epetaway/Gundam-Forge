'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { MetaPressureGauge } from './MetaPressureGauge';
import { CardContributionChart } from './CardContributionChart';
import { ArchetypeTrendLine } from './ArchetypeTrendLine';
import { ConsistencyScale } from './ConsistencyScale';
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
  // Derived values: prefer live (from builder) over server snapshot
  const metaScore = liveMetaProximity ?? serverAnalytics?.metaProximityScore ?? 0;
  const consistencyScore = liveConsistencyIndex ?? serverAnalytics?.consistencyIndex ?? 0;
  const trendDirection = serverAnalytics?.trendDirection ?? 'flat';

  const sparklinePoints = React.useMemo(() => {
    if (!serverAnalytics?.sparklineDates?.length) return [];
    return serverAnalytics.sparklineDates.map((date, i) => ({
      date,
      score: serverAnalytics.sparklineScores[i] ?? 0,
    }));
  }, [serverAnalytics]);

  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-surface-elevated',
        className,
      )}
      aria-label="Deck analytics"
      data-testid="deck-analytics-panel"
    >
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-300">
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
            {/* Row 1: Gauge + Consistency */}
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              <MetaPressureGauge
                score={metaScore}
                label="Meta Fit"
                className="flex-shrink-0"
              />
              <ConsistencyScale
                score={consistencyScore}
                className="w-full"
              />
            </div>

            {/* Row 2: Card type contribution */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel-500 mb-2">
                Card Composition
              </p>
              <CardContributionChart items={items} />
            </div>

            {/* Row 3: 7-day sparkline (server data only) */}
            {sparklinePoints.length >= 2 && (
              <ArchetypeTrendLine
                points={sparklinePoints}
                trendDirection={trendDirection}
              />
            )}

            {/* Archetype / rank footnote */}
            {serverAnalytics && (
              <div className="flex flex-wrap gap-3 border-t border-border pt-3">
                {serverAnalytics.archetypePopularityRank !== null && (
                  <Stat
                    label="Archetype Rank"
                    value={`#${serverAnalytics.archetypePopularityRank}`}
                  />
                )}
                {serverAnalytics.colorComboRank !== null && (
                  <Stat
                    label="Color Rank"
                    value={`#${serverAnalytics.colorComboRank}`}
                  />
                )}
                {serverAnalytics.viewCountDelta > 0 && (
                  <Stat
                    label="Views today"
                    value={`+${serverAnalytics.viewCountDelta}`}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-steel-600">{label}</span>
      <span className="font-mono text-sm font-semibold text-cobalt-300">{value}</span>
    </div>
  );
}
