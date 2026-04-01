'use client';

import type { CardColor } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';

interface ColorsStepProps {
  colors: CardColor[];
  onColorsChange: (colors: CardColor[]) => void;
  showError?: boolean;
}

const GUNDAM_COLORS: { value: CardColor; label: string; bg: string; text: string }[] = [
  { value: 'Blue', label: 'Blue', bg: 'bg-blue-600', text: 'text-white' },
  { value: 'Green', label: 'Green', bg: 'bg-green-600', text: 'text-white' },
  { value: 'Red', label: 'Red', bg: 'bg-red-600', text: 'text-white' },
  { value: 'White', label: 'White', bg: 'bg-white', text: 'text-steel-900' },
  { value: 'Purple', label: 'Purple', bg: 'bg-purple-600', text: 'text-white' },
  { value: 'Colorless', label: 'Colorless', bg: 'bg-steel-600', text: 'text-white' },
];

export default function ColorsStep({
  colors,
  onColorsChange,
  showError = false,
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
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Colors</p>
        <p className="text-xs text-steel-600">Select 1-2 non-Colorless colors. Colorless can be added as support.</p>
      </div>

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
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                active
                  ? `${c.bg} ${c.text} ring-2 ring-cobalt-400/60`
                  : 'text-steel-600 hover:text-foreground',
                nonColorlessAtMax ? 'cursor-not-allowed opacity-40' : '',
              )}
              type="button"
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {isValid && (
        <p className="text-xs text-green-400">Ready: {nonColorlessColors.join(' / ')}</p>
      )}

      {showError && !isValid && (
        <p className="rounded-md bg-red-500/10 px-2.5 py-1.5 text-xs text-red-400">
          Please select 1-2 non-Colorless colors.
        </p>
      )}

      <p className="text-xs text-steel-600">
        Colors directly affect starter recommendations and Forge card filtering.
      </p>
    </div>
  );
}
