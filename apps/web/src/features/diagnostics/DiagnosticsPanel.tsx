import { useMemo } from 'react';
import type { DeckValidationResult } from '@gundam-forge/shared';

interface DiagnosticsPanelProps {
  validation: DeckValidationResult;
}

const maxValue = (values: number[]) => (values.length === 0 ? 1 : Math.max(...values, 1));

export function DiagnosticsPanel({ validation }: DiagnosticsPanelProps) {
  const costCurveRows = useMemo(() => {
    return Object.entries(validation.metrics.costCurve)
      .map(([cost, count]) => ({ cost: Number(cost), count }))
      .sort((a, b) => a.cost - b.cost);
  }, [validation.metrics.costCurve]);

  const typeRows = useMemo(
    () => Object.entries(validation.metrics.typeCounts).map(([type, count]) => ({ type, count })),
    [validation.metrics.typeCounts]
  );

  const colorRows = useMemo(() => {
    return Object.entries(validation.metrics.colorCounts)
      .map(([color, count]) => ({ color, count: count ?? 0 }))
      .sort((a, b) => a.color.localeCompare(b.color));
  }, [validation.metrics.colorCounts]);

  const total = validation.metrics.totalCards;
  const curveMax = maxValue(costCurveRows.map((row) => row.count));
  const typeMax = maxValue(typeRows.map((row) => row.count));
  const colorMax = maxValue(colorRows.map((row) => row.count));

  return (
    <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-lg font-semibold">Diagnostics</h2>
      <p className="text-sm text-slate-400">Deck size: {total} · {validation.isValid ? 'Valid' : 'Invalid'}</p>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Curve (cost → count)</h3>
        {costCurveRows.length === 0 ? (
          <p className="text-sm text-slate-400">No data</p>
        ) : (
          <ul className="space-y-1">
            {costCurveRows.map((row) => (
              <li key={row.cost} className="flex items-center gap-2 text-sm">
                <span className="w-12 text-slate-400">{row.cost}</span>
                <div className="h-2 flex-1 rounded bg-slate-800">
                  <div
                    className="h-2 rounded bg-sky-500"
                    style={{ width: `${(row.count / curveMax) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Type counts</h3>
        <ul className="space-y-1">
          {typeRows.map((row) => (
            <li key={row.type} className="flex items-center gap-2 text-sm">
              <span className="w-20 text-slate-400">{row.type}</span>
              <div className="h-2 flex-1 rounded bg-slate-800">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{ width: `${(row.count / typeMax) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300">Color distribution</h3>
        {colorRows.length === 0 ? (
          <p className="text-sm text-slate-400">No colors yet</p>
        ) : (
          <ul className="space-y-1">
            {colorRows.map((row) => (
              <li key={row.color} className="flex items-center gap-2 text-sm">
                <span className="w-20 text-slate-400">{row.color}</span>
                <div className="h-2 flex-1 rounded bg-slate-800">
                  <div
                    className="h-2 rounded bg-fuchsia-500"
                    style={{ width: `${(row.count / colorMax) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
