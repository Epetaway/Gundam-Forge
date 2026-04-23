'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FilterChip {
  id: string;
  label: string;
  value: string | string[];
  icon?: React.ReactNode;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  totalCards: number;
  totalAvailable: number;
  onRemoveChip: (chipId: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  chips,
  totalCards,
  totalAvailable,
  onRemoveChip,
  onClearAll,
}: ActiveFilterChipsProps): JSX.Element | null {
  if (chips.length === 0) {
    return null;
  }

  const percentage = Math.round((totalCards / totalAvailable) * 100);

  return (
    <div className="space-y-2 rounded-lg border border-cobalt-900/40 bg-surface-elevated/50 p-4 backdrop-blur-sm">
      {/* Filter count and progress */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
            Filtering{' '}
            <span className="font-semibold text-foreground">{totalCards}</span>
            {' '}
            of{' '}
            <span className="font-semibold text-cobalt-400">{totalAvailable}</span>
            {' '}
            cards
          </span>
          {percentage < 100 && (
            <div className="relative inline-flex h-5 w-12 items-center">
              <div className="absolute inset-0 h-full w-full rounded-full bg-steel-900" />
              <div
                className="absolute left-0 h-full rounded-full bg-gradient-to-r from-cobalt-600 to-cobalt-400 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-white">
                {percentage}%
              </span>
            </div>
          )}
        </div>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-steel-400 transition-colors hover:text-foreground"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const valueStr = Array.isArray(chip.value)
            ? chip.value.join(', ')
            : chip.value;
          const displayValue = valueStr.length > 15
            ? `${valueStr.substring(0, 12)}...`
            : valueStr;

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveChip(chip.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-cobalt-500/60 bg-cobalt-600/20 px-2 py-1',
                'text-xs font-medium text-cobalt-300 transition-all',
                'hover:bg-cobalt-600/30 hover:border-cobalt-400',
                'active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-400',
              )}
              title={`Remove: ${chip.label} · ${valueStr}`}
              aria-label={`Remove filter: ${chip.label} · ${valueStr}`}
            >
              <span>{chip.label}:</span>
              <span className="font-mono">{displayValue}</span>
              <X className="h-3 w-3 ml-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* Filter logic explanation */}
      <div className="text-[11px] text-steel-500 space-y-0.5">
        <p>
          <span className="text-cobalt-400">●</span>{' '}
          Different filter <strong>types</strong> use <strong>AND</strong> logic (all must match)
        </p>
        <p>
          <span className="text-cobalt-400">●</span>{' '}
          Multiple values <strong>within</strong> a type use <strong>OR</strong> logic (any can match)
        </p>
      </div>
    </div>
  );
}
