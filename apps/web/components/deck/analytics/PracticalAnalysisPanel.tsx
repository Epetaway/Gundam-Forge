'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import type { DeckAnalyticsDto } from '@/lib/api/deckAnalytics';
import type { DeckViewItem } from '@/lib/deck/sortFilter';
import { buildPracticalDeckAnalysis } from '@/lib/deck/practicalAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface PracticalAnalysisPanelProps {
  items: DeckViewItem[];
  serverAnalytics?: DeckAnalyticsDto | null;
  liveConsistencyIndex?: number;
  className?: string;
}

export function PracticalAnalysisPanel({
  items,
  serverAnalytics,
  liveConsistencyIndex,
  className,
}: PracticalAnalysisPanelProps) {
  const analysis = React.useMemo(
    () => buildPracticalDeckAnalysis(items, serverAnalytics, liveConsistencyIndex),
    [items, serverAnalytics, liveConsistencyIndex],
  );

  const maxCurve = Math.max(1, ...analysis.curve.map((bucket) => bucket.count));

  return (
    <div className={cn('space-y-6', className)} data-testid="practical-analysis-panel">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 border border-cobalt-900/65 bg-surface-interactive p-1">
          <TabsTrigger value="overview" className="min-w-0 rounded-md border border-transparent px-2 py-2 text-[11px] font-semibold text-foreground/85 data-[state=active]:border-cobalt-400/50 data-[state=active]:bg-cobalt-500/20 data-[state=active]:text-foreground sm:text-xs">
            <span className="truncate">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="curve" className="min-w-0 rounded-md border border-transparent px-2 py-2 text-[11px] font-semibold text-foreground/85 data-[state=active]:border-cobalt-400/50 data-[state=active]:bg-cobalt-500/20 data-[state=active]:text-foreground sm:text-xs">
            <span className="truncate">Curve</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="min-w-0 rounded-md border border-transparent px-2 py-2 text-[11px] font-semibold text-foreground/85 data-[state=active]:border-cobalt-400/50 data-[state=active]:bg-cobalt-500/20 data-[state=active]:text-foreground sm:text-xs">
            <span className="truncate">Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="Main" value={`${analysis.mainDeckCount}/50`} tone={analysis.mainDeckCount === 50 ? 'good' : 'warn'} />
            <StatCard label="Resource" value={`${analysis.resourceCount}/10`} tone={analysis.resourceCount >= 8 && analysis.resourceCount <= 10 ? 'good' : 'warn'} />
            <StatCard label="Avg Cost" value={analysis.avgCost.toFixed(1)} tone={analysis.avgCost <= 4 ? 'good' : 'warn'} />
            <StatCard label="Consistency" value={`${Math.round(analysis.consistency)}/100`} tone={analysis.consistency >= 60 ? 'good' : 'warn'} />
          </section>
        </TabsContent>

        <TabsContent value="curve" className="space-y-4">
          <section className="space-y-2">
            <SectionTitle title="Curve Pressure" subtitle="Copies per cost bucket" />
            <div className="space-y-2 rounded border border-cobalt-900/55 bg-surface/40 p-2">
              {analysis.curve.map((bucket) => {
                const width = (bucket.count / maxCurve) * 100;
                return (
                  <div key={bucket.costLabel} className="grid grid-cols-[28px_1fr_32px] items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">{bucket.costLabel}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-interactive">
                      <div className="h-full rounded-full bg-cobalt-400/80" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-right font-mono text-[10px] text-foreground">{bucket.count}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <SectionTitle title="Color Composition" subtitle="Color share and average cost" />
            <div className="space-y-2 md:hidden">
              {analysis.colors.map((row) => (
                <div key={row.color} className="rounded border border-cobalt-900/55 bg-surface/40 p-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span className="font-medium">{row.color}</span>
                    <span className="font-mono text-foreground">{row.count} cards</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-text-muted">
                    <span className="whitespace-nowrap">Share</span>
                    <span className="text-right font-mono text-foreground whitespace-nowrap">{Math.round(row.share)}%</span>
                    <span className="whitespace-nowrap">Avg cost</span>
                    <span className="text-right font-mono text-foreground whitespace-nowrap">{row.avgCost.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-hidden rounded border border-cobalt-900/55 bg-surface/40 md:block">
              <table className="w-full text-left">
                <thead className="border-b border-cobalt-900/55">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    <th className="px-2 py-2 whitespace-nowrap">Color</th>
                    <th className="px-2 py-2 whitespace-nowrap">Qty</th>
                    <th className="px-2 py-2 whitespace-nowrap">Share</th>
                    <th className="px-2 py-2 whitespace-nowrap">Avg Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.colors.map((row) => (
                    <tr key={row.color} className="border-b border-cobalt-950/45 text-xs last:border-b-0">
                      <td className="px-2 py-2 text-foreground whitespace-nowrap">{row.color}</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{row.count}</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{Math.round(row.share)}%</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{row.avgCost.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <section className="space-y-2">
            <SectionTitle title="Role Odds" subtitle="Chance to see at least one role card" />
            <div className="space-y-2 md:hidden">
              {analysis.roles.map((row) => (
                <div key={row.role} className="rounded border border-cobalt-900/55 bg-surface/40 p-2">
                  <div className="flex items-center justify-between text-sm text-foreground">
                    <span className="font-medium">{row.role}</span>
                    <span className="font-mono text-foreground">{row.qty}</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-text-muted">
                    <span className="whitespace-nowrap">By turn 3</span>
                    <span className="text-right font-mono text-foreground whitespace-nowrap">{Math.round(row.oddsByTurn3)}%</span>
                    <span className="whitespace-nowrap">By turn 5</span>
                    <span className="text-right font-mono text-foreground whitespace-nowrap">{Math.round(row.oddsByTurn5)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-hidden rounded border border-cobalt-900/55 bg-surface/40 md:block">
              <table className="w-full text-left">
                <thead className="border-b border-cobalt-900/55">
                  <tr className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    <th className="px-2 py-2 whitespace-nowrap">Role</th>
                    <th className="px-2 py-2 whitespace-nowrap">Qty</th>
                    <th className="px-2 py-2 whitespace-nowrap">By T3</th>
                    <th className="px-2 py-2 whitespace-nowrap">By T5</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.roles.map((row) => (
                    <tr key={row.role} className="border-b border-cobalt-950/45 text-xs last:border-b-0">
                      <td className="px-2 py-2 text-foreground whitespace-nowrap">{row.role}</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{row.qty}</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{Math.round(row.oddsByTurn3)}%</td>
                      <td className="px-2 py-2 font-mono text-foreground whitespace-nowrap">{Math.round(row.oddsByTurn5)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </TabsContent>

      </Tabs>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-0.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-200 leading-tight break-words">{title}</p>
      <p className="text-[11px] text-text-muted break-words">{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' }) {
  return (
    <div className="min-w-0 rounded border border-cobalt-900/70 bg-surface-interactive px-2 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted whitespace-nowrap">{label}</p>
      <p className={cn('mt-0.5 font-mono text-sm font-semibold whitespace-nowrap', tone === 'good' ? 'text-emerald-400' : 'text-amber-300')}>
        {value}
      </p>
    </div>
  );
}
