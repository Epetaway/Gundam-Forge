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
    <section className="space-y-4 rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="relative rounded-lg border border-gcg-border bg-gcg-light p-4">
        <h2 className="text-xl font-bold tracking-wider text-gcg-dark">Deck Diagnostics</h2>
        <p className="mt-1 text-xs uppercase tracking-widest text-gray-600">
          Deck Analysis: {total} cards · {validation.isValid ? <span className="text-green-600">● Valid</span> : <span className="text-red-600">● Invalid</span>}
        </p>
      </div>

      {/* Cost Curve */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Cost Curve Distribution
        </h3>
        {costCurveRows.length === 0 ? (
          <p className="text-xs text-gray-500">No data available</p>
        ) : (
          <ul className="space-y-2">
            {costCurveRows.map((row) => (
              <li key={row.cost} className="flex items-center gap-3">
                <span className="w-12 text-sm font-bold text-gray-700">{row.cost}</span>
                <div className="h-6 flex-1 overflow-hidden rounded border border-gcg-border bg-gcg-light">
                  <div
                    className="h-6 bg-gradient-to-r from-gcg-primary to-red-700 transition-all duration-300"
                    style={{ width: `${(row.count / curveMax) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold text-gcg-dark">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Type Distribution */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Type Distribution
        </h3>
        <ul className="space-y-2">
          {typeRows.map((row) => (
            <li key={row.type} className="flex items-center gap-3">
              <span className="w-20 truncate text-sm font-semibold text-gcg-dark">{row.type}</span>
              <div className="h-6 flex-1 overflow-hidden rounded border border-gcg-border bg-gcg-light">
                <div
                  className="h-6 bg-gradient-to-r from-green-500 to-green-700 transition-all duration-300"
                  style={{ width: `${(row.count / typeMax) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-sm font-bold text-gcg-dark">{row.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Color Distribution */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Color Distribution
        </h3>
        {colorRows.length === 0 ? (
          <p className="text-xs text-gray-500">No colors yet</p>
        ) : (
          <ul className="space-y-2">
            {colorRows.map((row) => (
              <li key={row.color} className="flex items-center gap-3">
                <span className="w-20 truncate text-sm font-semibold text-gcg-dark">{row.color}</span>
                <div className="h-6 flex-1 overflow-hidden rounded border border-gcg-border bg-gcg-light">
                  <div
                    className="h-6 bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300"
                    style={{ width: `${(row.count / colorMax) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold text-gcg-dark">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
