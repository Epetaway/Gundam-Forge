'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SeriesStepProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  series: string[];
  onSeriesChange: (series: string[]) => void;
}

const SERIES_OPTIONS = [
  'UC-Era',
  'Gundam-Wing',
  'Gundam-Hathaway',
  'Gundam-00',
  'Gundam-SEED',
  'Gundam-IBO',
];

export default function SeriesStep({
  expanded,
  onExpandChange,
  series,
  onSeriesChange,
}: SeriesStepProps) {
  const [anySeriesMode, setAnySeriesMode] = useState(series.length === 0);

  const handleToggleSeries = (seriesName: string) => {
    if (anySeriesMode) setAnySeriesMode(false);
    
    const newSeries = series.includes(seriesName)
      ? series.filter((s) => s !== seriesName)
      : series.length >= 2
        ? series
        : [...series, seriesName];

    if (newSeries.length === 0) {
      setAnySeriesMode(true);
    }

    onSeriesChange(newSeries);
  };

  const handleAnySeriesToggle = () => {
    if (!anySeriesMode) {
      setAnySeriesMode(true);
      onSeriesChange([]);
    } else {
      setAnySeriesMode(false);
    }
  };

  return (
    <div className="border-b border-cobalt-900/60 last:border-b-0">
      <button
        onClick={() => onExpandChange(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cobalt-400 bg-cobalt-900/40 px-2 py-0.5 rounded">
            Step 1
          </span>
          <span className="font-semibold text-sm text-foreground">Series / Era</span>
          <span className="text-xs text-steel-600">(max 2)</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-steel-600 transition-transform',
            expanded ? 'rotate-180' : '',
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 py-4 border-t border-cobalt-900/60 bg-surface-interactive/50 flex flex-col gap-4">
          {/* Any Series Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="any-series"
              checked={anySeriesMode}
              onChange={handleAnySeriesToggle}
              className="w-4 h-4 rounded border border-cobalt-900/70 bg-surface-interactive cursor-pointer"
            />
            <label htmlFor="any-series" className="text-sm text-foreground cursor-pointer font-medium">
              Any Series (default)
            </label>
          </div>

          {/* Series Chips */}
          {!anySeriesMode && (
            <div className="flex flex-wrap gap-2">
              {SERIES_OPTIONS.map((s) => {
                const active = series.includes(s);
                const atMax = series.length >= 2 && !active;
                return (
                  <button
                    key={s}
                    onClick={() => handleToggleSeries(s)}
                    disabled={atMax}
                    className={cn(
                      'px-4 py-2 text-xs font-medium rounded-full border transition-all',
                      active
                        ? 'bg-cobalt-600 text-white border-cobalt-500 ring-2 ring-cobalt-400/40'
                        : 'bg-surface-interactive border-cobalt-900/70 text-steel-600 hover:border-cobalt-400/40 hover:text-foreground',
                      atMax ? 'opacity-40 cursor-not-allowed' : '',
                    )}
                    type="button"
                  >
                    {s.replace('Gundam-', '').replace('-Era', ' Era')}
                  </button>
                );
              })}
            </div>
          )}

          {/* Help Text */}
          <p className="text-xs text-steel-600 leading-relaxed">
            Series filtering limited by available card tags. Your selections will be applied if card data is available.
          </p>
        </div>
      )}
    </div>
  );
}
