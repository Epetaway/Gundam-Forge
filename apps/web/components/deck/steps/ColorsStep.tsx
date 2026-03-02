'use client';

import { ChevronDown } from 'lucide-react';
import type { CardColor } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';

interface ColorsStepProps {
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  colors: CardColor[];
  onColorsChange: (colors: CardColor[]) => void;
  showError?: boolean;
  onBack?: () => void;
}

const GUNDAM_COLORS: { value: CardColor; label: string; bg: string; text: string; border: string }[] = [
  { value: 'Blue', label: 'Blue', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-500' },
  { value: 'Green', label: 'Green', bg: 'bg-green-600', text: 'text-white', border: 'border-green-500' },
  { value: 'Red', label: 'Red', bg: 'bg-red-600', text: 'text-white', border: 'border-red-500' },
  { value: 'White', label: 'White', bg: 'bg-white', text: 'text-steel-900', border: 'border-steel-300' },
  { value: 'Purple', label: 'Purple', bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-500' },
  { value: 'Colorless', label: 'Colorless', bg: 'bg-steel-600', text: 'text-white', border: 'border-steel-500' },
];

export default function ColorsStep({
  expanded,
  onExpandChange,
  colors,
  onColorsChange,
  showError = false,
  onBack,
}: ColorsStepProps) {
  const nonColorlessColors = colors.filter((c) => c !== 'Colorless');

  const handleColorToggle = (color: CardColor) => {
    if (colors.includes(color)) {
      onColorsChange(colors.filter((c) => c !== color));
    } else {
      const nonColorless = colors.filter((c) => c !== 'Colorless');
      if (color !== 'Colorless' && nonColorless.length >= 2) return;
      onColorsChange([...colors, color]);
    }
  };

  const isValid = colors.length >= 1 && colors.length <= 2 && nonColorlessColors.length >= 1;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => onExpandChange(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 hover:bg-surface transition-colors',
          showError ? 'bg-red-500/5' : '',
        )}
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cobalt-400 bg-cobalt-900/40 px-2 py-0.5 rounded">
            Step 2
          </span>
          <span className="font-semibold text-sm text-foreground">Colors</span>
          <span className="text-xs text-steel-600">(required, max 2)</span>
          {isValid && (
            <span className="text-xs text-green-400">
              ✓ {nonColorlessColors.join('/')}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-steel-600 transition-transform',
            expanded ? 'rotate-180' : '',
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-border bg-surface-interactive/50 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {GUNDAM_COLORS.map((c) => {
              const active = colors.includes(c.value);
              const nonColorlessAtMax = nonColorlessColors.length >= 2 && c.value !== 'Colorless' && !active;
              return (
                <button
                  key={c.value}
                  onClick={() => handleColorToggle(c.value)}
                  disabled={nonColorlessAtMax}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                    active
                      ? `${c.bg} ${c.text} ${c.border} ring-2 ring-cobalt-400/60`
                      : 'border-border bg-surface-interactive text-steel-600 hover:border-cobalt-400/40 hover:text-foreground',
                    nonColorlessAtMax ? 'opacity-40 cursor-not-allowed' : '',
                  )}
                  type="button"
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {showError && !isValid && (
            <p className="text-xs text-red-400">
              Please select 1–2 non-Colorless colors
            </p>
          )}

          <p className="text-xs text-steel-600">
            Selected colors will filter the card catalog to matching cards (plus Colorless).
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs text-steel-500 hover:text-foreground text-left"
            >
              ← Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}
