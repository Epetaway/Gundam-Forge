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

  const colorBarColors: Record<string, string> = {
    White: 'from-gray-300 to-gray-400',
    Blue: 'from-blue-500 to-blue-600',
    Red: 'from-red-500 to-red-600',
    Green: 'from-green-500 to-green-600',
    Purple: 'from-purple-500 to-purple-600',
    Colorless: 'from-gray-400 to-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-gf-text">Deck Analytics</h2>
          <p className="text-sm text-gf-text-secondary mt-1">
            {total} cards ·{' '}
            {validation.isValid ? (
              <span className="text-green-600 font-medium">Valid</span>
            ) : (
              <span className="text-red-600 font-medium">Invalid</span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Cards', value: total, color: 'text-gf-blue' },
          { label: 'Unique Cards', value: Object.keys(validation.metrics.costCurve).length, color: 'text-purple-600' },
          { label: 'Types', value: typeRows.length, color: 'text-green-600' },
          { label: 'Colors', value: colorRows.length, color: 'text-gf-orange' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gf-border bg-white p-5 shadow-sm">
            <p className="text-sm text-gf-text-secondary">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Cost Curve */}
      <div className="rounded-xl border border-gf-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gf-text">Cost Curve Distribution</h3>
        {costCurveRows.length === 0 ? (
          <p className="text-sm text-gf-text-secondary">No data available</p>
        ) : (
          <div className="space-y-3">
            {costCurveRows.map((row) => (
              <div key={row.cost} className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gf-blue text-xs font-bold text-white">
                  {row.cost}
                </div>
                <div className="h-8 flex-1 overflow-hidden rounded-lg bg-gf-light">
                  <div
                    className="h-8 rounded-lg bg-gradient-to-r from-gf-blue to-blue-600 transition-all duration-300 flex items-center pl-3"
                    style={{ width: `${Math.max((row.count / curveMax) * 100, 8)}%` }}
                  >
                    <span className="text-xs font-bold text-white">{row.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Type Distribution */}
        <div className="rounded-xl border border-gf-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gf-text">Type Distribution</h3>
          <div className="space-y-3">
            {typeRows.map((row) => {
              const pct = total > 0 ? ((row.count / total) * 100).toFixed(0) : '0';
              return (
                <div key={row.type} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-medium text-gf-text">{row.type}</span>
                  <div className="h-7 flex-1 overflow-hidden rounded-lg bg-gf-light">
                    <div
                      className="h-7 rounded-lg bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 flex items-center pl-3"
                      style={{ width: `${Math.max((row.count / typeMax) * 100, 10)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{row.count}</span>
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-gf-text-secondary">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Distribution */}
        <div className="rounded-xl border border-gf-border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gf-text">Color Distribution</h3>
          {colorRows.length === 0 ? (
            <p className="text-sm text-gf-text-secondary">No colors yet</p>
          ) : (
            <div className="space-y-3">
              {colorRows.map((row) => {
                const pct = total > 0 ? ((row.count / total) * 100).toFixed(0) : '0';
                return (
                  <div key={row.color} className="flex items-center gap-3">
                    <span className="w-16 text-sm font-medium text-gf-text">{row.color}</span>
                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-gf-light">
                      <div
                        className={`h-7 rounded-lg bg-gradient-to-r ${colorBarColors[row.color] || 'from-blue-500 to-blue-600'} transition-all duration-300 flex items-center pl-3`}
                        style={{ width: `${Math.max((row.count / colorMax) * 100, 10)}%` }}
                      >
                        <span className="text-xs font-bold text-white">{row.count}</span>
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-gf-text-secondary">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
