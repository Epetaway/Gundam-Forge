'use client';

import * as React from 'react';

type TrendDirection = 'up' | 'flat' | 'down';

interface ArchetypeTrend {
  archetypeId: string;
  rank: number;
  winRate?: number;
  playRate?: number;
  trendDirection?: TrendDirection;
}

interface TrendsResponse {
  ok: boolean;
  snapshotDate: string;
  topArchetypes: ArchetypeTrend[];
  validationErrors?: string[];
}

function trendBadge(trend?: TrendDirection): { label: string; className: string } {
  if (trend === 'up') return { label: 'UP', className: 'text-green-400 bg-green-500/15' };
  if (trend === 'down') return { label: 'DOWN', className: 'text-red-400 bg-red-500/15' };
  return { label: 'FLAT', className: 'text-amber-300 bg-amber-500/15' };
}

export function MetaArchetypesSidebar(): JSX.Element {
  const [data, setData] = React.useState<TrendsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/meta/trends', { cache: 'no-store' });
        const json = (await res.json()) as TrendsResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(`Failed to load trends: ${String(err)}`);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="w-72 rounded-lg border border-steel-700 bg-surface-950/90 p-3 shadow-xl backdrop-blur">
      <header className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-cobalt-300">Meta Archetypes</p>
        <p className="text-[11px] text-steel-400">
          {data?.snapshotDate ? `Snapshot ${data.snapshotDate}` : 'Loading latest snapshot...'}
        </p>
      </header>

      {error && <p className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-300">{error}</p>}

      <ul className="space-y-1.5">
        {(data?.topArchetypes ?? []).slice(0, 6).map((entry) => {
          const badge = trendBadge(entry.trendDirection);
          return (
            <li key={`${entry.archetypeId}-${entry.rank}`} className="rounded border border-steel-800 bg-surface-900/60 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-surface-foreground">#{entry.rank}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}>{badge.label}</span>
              </div>
              <p className="mt-1 text-xs text-surface-foreground/90">{entry.archetypeId}</p>
              <p className="mt-1 text-[11px] text-steel-400">
                WR {entry.winRate !== undefined ? `${Math.round(entry.winRate * 100)}%` : '--'}
                {' · '}
                PR {entry.playRate !== undefined ? `${Math.round(entry.playRate * 100)}%` : '--'}
              </p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
