import type { DeckViewItem } from '@/lib/deck/sortFilter';

interface DeckStatsProps {
  items: DeckViewItem[];
}

const TYPE_COLORS: Record<string, string> = {
  Unit: '#4c90fa',
  Pilot: '#34d399',
  Command: '#fbbf24',
  Base: '#d5ddeb',
  Resource: '#9aa9bf',
};

const COST_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8+'];

export function DeckStats({ items }: DeckStatsProps): JSX.Element {
  // ── Cost distribution ─────────────────────────────────────────────────────
  const costBuckets = new Array(9).fill(0) as number[];
  for (const item of items) {
    const bucket = Math.min(8, Math.max(0, item.cmc));
    costBuckets[bucket] += item.qty;
  }
  const maxCount = Math.max(1, ...costBuckets);

  // ── Type distribution ─────────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  let totalCards = 0;
  for (const item of items) {
    const t = item.typeLine;
    typeCounts[t] = (typeCounts[t] ?? 0) + item.qty;
    totalCards += item.qty;
  }

  const avgCost =
    totalCards > 0
      ? items.reduce((sum, item) => sum + item.cmc * item.qty, 0) / totalCards
      : 0;

  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-lg border border-border bg-surface-elevated p-4 space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <Chip label="Cards" value={`${totalCards}`} />
        <Chip label="Avg Cost" value={avgCost.toFixed(1)} />
        {typeEntries.slice(0, 4).map(([type, count]) => (
          <Chip key={type} label={type} value={`${count}`} color={TYPE_COLORS[type]} />
        ))}
      </div>

      {/* Cost curve */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">Cost Curve</p>
        <div className="flex items-end gap-1 h-14">
          {costBuckets.map((count, i) => {
            const heightPct = (count / maxCount) * 100;
            return (
              <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
                <span className="font-mono text-[9px] text-text-muted leading-none">
                  {count > 0 ? count : ''}
                </span>
                <div
                  className="w-full rounded-t-sm bg-cobalt-500 transition-all"
                  style={{ height: `${heightPct}%`, minHeight: count > 0 ? 4 : 0 }}
                />
                <span className="font-mono text-[9px] text-text-muted leading-none">{COST_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type breakdown bar */}
      {typeEntries.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted mb-2">Type Split</p>
          <div className="h-3 rounded-full overflow-hidden flex">
            {typeEntries.map(([type, count]) => (
              <div
                key={type}
                title={`${type}: ${count}`}
                className="h-full transition-all"
                style={{
                  width: `${(count / totalCards) * 100}%`,
                  backgroundColor: TYPE_COLORS[type] ?? '#9aa9bf',
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {typeEntries.map(([type, count]) => (
              <span key={type} className="flex items-center gap-1 text-[10px] text-text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[type] ?? '#9aa9bf' }}
                />
                {type} {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 rounded border border-border bg-surface-interactive px-2 py-1">
      {color && (
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
