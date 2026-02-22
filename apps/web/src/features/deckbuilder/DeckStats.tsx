import { useMemo } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import type { ResolvedDeckEntry } from './deckSelectors';

interface DeckStatsProps {
  resolvedEntries: ResolvedDeckEntry[];
}

export function DeckStats({ resolvedEntries }: DeckStatsProps) {
  const stats = useMemo(() => {
    const totalCards = resolvedEntries.reduce((sum, e) => sum + e.qty, 0);
    const totalCost = resolvedEntries.reduce((sum, e) => sum + e.card.cost * e.qty, 0);
    const totalPower = resolvedEntries.reduce((sum, e) => sum + (e.card.power ?? 0) * e.qty, 0);
    
    const costs = resolvedEntries.flatMap((e) => Array(e.qty).fill(e.card.cost));
    const avgCost = totalCards > 0 ? (totalCost / totalCards).toFixed(2) : '0.00';
    const avgPower = totalCards > 0 ? (totalPower / totalCards).toFixed(2) : '0.00';
    
    // Median cost
    const sortedCosts = [...costs].sort((a, b) => a - b);
    const mid = Math.floor(sortedCosts.length / 2);
    const medianCost = sortedCosts.length > 0
      ? sortedCosts.length % 2 === 0
        ? ((sortedCosts[mid - 1] + sortedCosts[mid]) / 2).toFixed(2)
        : sortedCosts[mid].toFixed(2)
      : '0.00';

    // Color distribution
    const colorCounts: Record<string, number> = {};
    resolvedEntries.forEach((e) => {
      colorCounts[e.card.color] = (colorCounts[e.card.color] || 0) + e.qty;
    });

    // Type distribution
    const typeCounts: Record<string, number> = {};
    resolvedEntries.forEach((e) => {
      typeCounts[e.card.type] = (typeCounts[e.card.type] || 0) + e.qty;
    });

    // Cost curve
    const costCurve: Record<number, number> = {};
    resolvedEntries.forEach((e) => {
      costCurve[e.card.cost] = (costCurve[e.card.cost] || 0) + e.qty;
    });

    return {
      totalCards,
      avgCost,
      avgPower,
      medianCost,
      colorCounts,
      typeCounts,
      costCurve,
    };
  }, [resolvedEntries]);

  const colorEntries = Object.entries(stats.colorCounts).sort((a, b) => b[1] - a[1]);
  const typeEntries = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1]);
  const curveEntries = Object.entries(stats.costCurve)
    .map(([cost, count]) => ({ cost: Number(cost), count }))
    .sort((a, b) => a.cost - b.cost);

  const maxCurveCount = Math.max(...curveEntries.map((e) => e.count), 1);

  const colorGradients: Record<string, string> = {
    White: 'from-card-white to-gray-200',
    Blue: 'from-card-blue to-blue-700',
    Red: 'from-card-red to-red-700',
    Green: 'from-card-green to-green-700',
    Black: 'from-card-black to-gray-800',
    Colorless: 'from-gray-400 to-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Cards', value: stats.totalCards },
          { label: 'Avg Cost', value: stats.avgCost },
          { label: 'Median Cost', value: stats.medianCost },
          { label: 'Avg Power', value: stats.avgPower },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gcg-border bg-white p-3 text-center shadow-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gcg-dark">{value}</p>
          </div>
        ))}
      </div>

      {/* Cost Curve */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Cost Curve Analysis
        </h3>
        {curveEntries.length === 0 ? (
          <p className="text-xs text-gray-500">No cards in deck</p>
        ) : (
          <div className="space-y-2">
            {curveEntries.map(({ cost, count }) => (
              <div key={cost} className="flex items-center gap-3">
                <span className="w-12 text-sm font-bold text-gray-700">{cost}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded border border-gcg-border bg-gcg-light">
                  <div
                    className="h-full bg-gradient-to-r from-gcg-primary to-red-700 transition-all duration-300"
                    style={{ width: `${(count / maxCurveCount) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-bold text-gcg-dark">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color Distribution */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Color Distribution
        </h3>
        {colorEntries.length === 0 ? (
          <p className="text-xs text-gray-500">No cards in deck</p>
        ) : (
          <div className="space-y-2">
            {colorEntries.map(([color, count]) => {
              const percentage = ((count / stats.totalCards) * 100).toFixed(1);
              return (
                <div key={color} className="flex items-center gap-3">
                  <span className="w-20 truncate text-sm font-semibold text-gcg-dark">{color}</span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded border border-gcg-border bg-gcg-light">
                    <div
                      className={`h-full bg-gradient-to-r ${colorGradients[color] || colorGradients.Colorless} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Type Distribution */}
      <div className="rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gcg-dark">
          Type Distribution
        </h3>
        {typeEntries.length === 0 ? (
          <p className="text-xs text-gray-500">No cards in deck</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {typeEntries.map(([type, count]) => {
              const percentage = ((count / stats.totalCards) * 100).toFixed(1);
              return (
                <div
                  key={type}
                  className="rounded-lg border border-gcg-border bg-white p-3 text-center shadow-sm"
                >
                  <p className="text-xs uppercase tracking-wider text-gray-500">{type}</p>
                  <p className="mt-1 text-2xl font-bold text-gcg-dark">{count}</p>
                  <p className="mt-1 text-xs text-gray-600">{percentage}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
