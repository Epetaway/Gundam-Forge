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
      .sort((a, b) => b.count - a.count);
  }, [validation.metrics.colorCounts]);

  const total = validation.metrics.totalCards;
  const curveMax = maxValue(costCurveRows.map((row) => row.count));
  const typeMax = maxValue(typeRows.map((row) => row.count));
  const colorMax = maxValue(colorRows.map((row) => row.count));

  const avgCost = useMemo(() => {
    if (total === 0) return 0;
    let sum = 0;
    for (const { cost, count } of costCurveRows) sum += cost * count;
    return sum / total;
  }, [costCurveRows, total]);

  const colorBarColors: Record<string, string> = {
    White: 'from-gray-300 to-gray-400',
    Blue: 'from-blue-500 to-blue-600',
    Red: 'from-red-500 to-red-600',
    Green: 'from-green-500 to-green-600',
    Purple: 'from-purple-500 to-purple-600',
    Colorless: 'from-gray-400 to-gray-500',
  };

  const colorDotColors: Record<string, string> = {
    White: 'bg-gray-300',
    Blue: 'bg-blue-500',
    Red: 'bg-red-500',
    Green: 'bg-green-500',
    Purple: 'bg-purple-500',
    Colorless: 'bg-gray-400',
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
              <span className="text-red-600 font-medium">
                {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {validation.warnings.length > 0 && (
              <>
                {' · '}
                <span className="text-yellow-600 font-medium">
                  {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: 'Total Cards', value: total, color: 'text-gf-blue' },
          { label: 'Avg Cost', value: avgCost.toFixed(1), color: 'text-purple-600' },
          { label: 'Types', value: typeRows.length, color: 'text-green-600' },
          { label: 'Colors', value: colorRows.length, color: 'text-orange-500' },
          { label: 'Unique', value: costCurveRows.length > 0 ? Object.values(validation.metrics.costCurve).reduce((a, b) => a + (b > 0 ? 1 : 0), 0) : 0, color: 'text-pink-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gf-border bg-gf-white p-4 shadow-sm">
            <p className="text-[10px] text-gf-text-muted uppercase tracking-wide">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Validation Summary */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="rounded-xl border border-gf-border bg-gf-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gf-text">Validation Summary</h3>
          <div className="space-y-2">
            {validation.errors.map((err, i) => (
              <div key={`e-${i}`} className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-red-800">{err}</span>
              </div>
            ))}
            {validation.warnings.map((warn, i) => (
              <div key={`w-${i}`} className="flex items-start gap-2.5 rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2">
                <svg className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-yellow-800">{warn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Curve */}
      <div className="rounded-xl border border-gf-border bg-gf-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold text-gf-text">Cost Curve Distribution</h3>
        {costCurveRows.length === 0 ? (
          <p className="text-sm text-gf-text-secondary">No data available</p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {costCurveRows.map((row) => {
              const heightPct = Math.max((row.count / curveMax) * 100, 5);
              return (
                <div key={row.cost} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] font-bold text-gf-text">{row.count}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-gf-blue to-blue-400 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gf-dark text-[9px] font-bold text-white">
                    {row.cost}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Type Distribution */}
        <div className="rounded-xl border border-gf-border bg-gf-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gf-text">Type Distribution</h3>
          <div className="space-y-3">
            {typeRows.map((row) => {
              const pct = total > 0 ? ((row.count / total) * 100).toFixed(0) : '0';
              return (
                <div key={row.type} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-gf-text">{row.type}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-lg bg-gf-light">
                    <div
                      className="h-6 rounded-lg bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 flex items-center pl-2.5"
                      style={{ width: `${Math.max((row.count / typeMax) * 100, 10)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white">{row.count}</span>
                    </div>
                  </div>
                  <span className="w-10 text-right text-[10px] text-gf-text-secondary">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Color Distribution */}
        <div className="rounded-xl border border-gf-border bg-gf-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gf-text">Color Distribution</h3>
          {colorRows.length === 0 ? (
            <p className="text-sm text-gf-text-secondary">No colors yet</p>
          ) : (
            <>
              {/* Visual ring */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative h-32 w-32">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      const strokeWidth = 12;
                      const radius = 44;
                      const circumference = 2 * Math.PI * radius;
                      return colorRows.map((row) => {
                        const pct = total > 0 ? row.count / total : 0;
                        const dash = pct * circumference;
                        const gap = circumference - dash;
                        const el = (
                          <circle
                            key={row.color}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke={
                              { White: '#d1d5db', Blue: '#3b82f6', Red: '#ef4444', Green: '#22c55e', Purple: '#a855f7', Colorless: '#9ca3af' }[row.color] || '#6b7280'
                            }
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-gf-text">{total}</span>
                    <span className="text-[9px] text-gf-text-muted">cards</span>
                  </div>
                </div>
              </div>

              {/* Legend bars */}
              <div className="space-y-2.5">
                {colorRows.map((row) => {
                  const pct = total > 0 ? ((row.count / total) * 100).toFixed(0) : '0';
                  return (
                    <div key={row.color} className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${colorDotColors[row.color] || 'bg-gray-400'}`} />
                      <span className="w-16 text-xs font-medium text-gf-text">{row.color}</span>
                      <div className="h-5 flex-1 overflow-hidden rounded bg-gf-light">
                        <div
                          className={`h-5 rounded bg-gradient-to-r ${colorBarColors[row.color] || 'from-blue-500 to-blue-600'} transition-all duration-300`}
                          style={{ width: `${Math.max((row.count / colorMax) * 100, 8)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] text-gf-text-secondary">{row.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
