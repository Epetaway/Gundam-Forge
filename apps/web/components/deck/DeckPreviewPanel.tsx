'use client';
import type { CardColor } from '@gundam-forge/shared';
import { cn } from '@/lib/utils/cn';
import { useDeckSetupContext } from './DeckSetupContext';

const COLOR_STYLES: Record<CardColor, { bg: string; text: string; label: string }> = {
  Blue:      { bg: 'bg-blue-600',   text: 'text-white',     label: 'Blue' },
  Green:     { bg: 'bg-green-600',  text: 'text-white',     label: 'Green' },
  Red:       { bg: 'bg-red-600',    text: 'text-white',     label: 'Red' },
  White:     { bg: 'bg-white',      text: 'text-steel-900', label: 'White' },
  Purple:    { bg: 'bg-purple-600', text: 'text-white',     label: 'Purple' },
  Colorless: { bg: 'bg-steel-600',  text: 'text-white',     label: 'Colorless' },
};

export default function DeckPreviewPanel() {
  const { name, visibility, archetype, description, colors, decklist } = useDeckSetupContext();

  const lineCount = decklist.trim()
    ? decklist.split('\n').filter((l) => l.trim()).length
    : 0;

  const displayName = name.trim() || 'New Deck';

  return (
    <div className="panel-level-2 w-full max-w-sm rounded-lg border border-border p-6 space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-300 mb-1">
          Deck Preview
        </p>
        <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-foreground truncate">
          {displayName}
        </h2>
      </div>

      {/* Colors */}
      {colors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => {
            const style = COLOR_STYLES[c];
            return (
              <span
                className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', style.bg, style.text)}
                key={c}
              >
                {style.label}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-steel-600 italic">No colors selected</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 text-xs text-steel-600">
        {archetype && (
          <span className="rounded border border-cobalt-400/30 bg-cobalt-400/10 px-2 py-0.5 font-medium text-cobalt-300">
            {archetype}
          </span>
        )}
        <span className="capitalize">{visibility}</span>
      </div>

      {description && (
        <p className="text-sm text-steel-600 line-clamp-3">{description}</p>
      )}

      {/* Import preview */}
      {lineCount > 0 && (
        <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-steel-600">
          <span className="font-semibold text-cobalt-300">{lineCount}</span>{' '}
          {lineCount === 1 ? 'line' : 'lines'} ready to import
        </div>
      )}

      {/* Hint */}
      {!name.trim() && colors.length === 0 && !archetype && (
        <p className="text-xs text-steel-700 italic">
          Fill in the form to see your deck preview here.
        </p>
      )}
    </div>
  );
}
