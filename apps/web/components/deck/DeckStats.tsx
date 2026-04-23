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

const COLOR_PALETTE: Record<string, string> = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  White: '#f5f5f5',
  Purple: '#a855f7',
  Colorless: '#9ca3af',
};

const COST_LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8+'];
const PHASE_LABELS = ['Early', 'Mid', 'Late'];
const PHASE_CONFIG = [
  { range: [0, 2], label: 'Early', color: 'from-green-600 to-green-500' },
  { range: [3, 5], label: 'Mid', color: 'from-yellow-600 to-yellow-500' },
  { range: [6, 10], label: 'Late', color: 'from-red-600 to-red-500' },
];

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

  // ── Color distribution ────────────────────────────────────────────────────
  const colorCounts: Record<string, number> = {};
  for (const item of items) {
    const color = item.color || 'Colorless';
    colorCounts[color] = (colorCounts[color] ?? 0) + item.qty;
  }

  const avgCost =
    totalCards > 0
      ? items.reduce((sum, item) => sum + item.cmc * item.qty, 0) / totalCards
      : 0;

  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const colorEntries = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

  // ── Generate conic-gradient for pie chart ─────────────────────────────────
  const pieChartGradient = colorEntries.length > 0
    ? (() => {
        let gradientStops: string[] = [];
        let accumulated = 0;
        for (const [color, count] of colorEntries) {
          const percentage = (count / totalCards) * 100;
          const colorValue = COLOR_PALETTE[color] || '#9ca3af';
          gradientStops.push(`${colorValue} ${accumulated}% ${accumulated + percentage}%`);
          accumulated += percentage;
        }
        return `conic-gradient(${gradientStops.join(', ')})`;
      })()
    : 'conic-gradient(#9ca3af 0deg 360deg)';

  return (
    <div className="space-y-4 rounded-lg border border-cobalt-900/65 bg-gradient-to-br from-surface-elevated via-surface to-surface p-4 shadow-[0_8px_24px_rgba(2,6,23,0.35)]">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-4">
        <Chip label="Cards" value={`${totalCards}`} />
        <Chip label="Avg Cost" value={avgCost.toFixed(1)} />
        {typeEntries.slice(0, 4).map(([type, count]) => (
          <Chip key={type} label={type} value={`${count}`} color={TYPE_COLORS[type]} />
        ))}
      </div>

      {/* Two-column layout: Cost Curve + Color Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost curve with phase coloring */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Cost Curve</p>
          <div className="flex items-end gap-1 h-14">
            {costBuckets.map((count, i) => {
              const heightPct = (count / maxCount) * 100;
              // Determine phase color for this bucket
              let phaseColor = 'from-steel-600 to-steel-500';
              for (const phase of PHASE_CONFIG) {
                if (i >= phase.range[0] && i <= phase.range[1]) {
                  phaseColor = phase.color;
                  break;
                }
              }
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
                  <span className="font-mono text-[9px] text-text-muted leading-none">
                    {count > 0 ? count : ''}
                  </span>
                  <div
                    className={`w-full rounded-t-sm bg-gradient-to-t ${phaseColor} transition-all`}
                    style={{ height: `${heightPct}%`, minHeight: count > 0 ? 4 : 0 }}
                  />
                  <span className="font-mono text-[9px] text-text-muted leading-none">{COST_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
          {/* Phase legend */}
          <div className="flex gap-4 mt-2 text-[9px]">
            {PHASE_CONFIG.map((phase) => (
              <div key={phase.label} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${phase.color}`} />
                <span className="text-text-muted">{phase.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Color distribution pie chart */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">Color Distribution</p>
          <div className="flex items-center gap-4">
            {/* Pie chart */}
            <div
              className="flex-shrink-0 w-16 h-16 rounded-full shadow-lg"
              style={{ background: pieChartGradient }}
            />
            {/* Legend */}
            <div className="flex-1 space-y-1">
              {colorEntries.map(([color, count]) => {
                const percentage = ((count / totalCards) * 100).toFixed(0);
                return (
                  <div key={color} className="flex items-center gap-2 text-[9px]">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: COLOR_PALETTE[color] || '#9ca3af' }}
                    />
                    <span className="text-text-muted">{color}</span>
                    <span className="font-mono text-foreground">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
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
    <div className="flex items-center gap-2 rounded border border-cobalt-900/70 bg-surface-interactive px-2 py-1">
      {color && (
        <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      )}
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}
