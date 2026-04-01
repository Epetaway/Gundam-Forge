'use client';
import * as React from 'react';
import Link from 'next/link';
import type { CardColor } from '@gundam-forge/shared';
import { getPackagesByIds } from '@gundam-forge/shared';
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
  const { name, visibility, deckIntent, decklist } = useDeckSetupContext();
  const { clans, colors, packages } = deckIntent;
  const [browseQuery, setBrowseQuery] = React.useState('');

  const selectedPackages = React.useMemo(
    () => getPackagesByIds(packages),
    [packages],
  );

  const lineCount = decklist.trim()
    ? decklist.split('\n').filter((l) => l.trim()).length
    : 0;

  const displayName = name.trim() || 'New Deck';
  const packageLabel = packages.length > 0 ? `${packages.length} package${packages.length === 1 ? '' : 's'}` : '';

  return (
    <div className="panel-level-2 w-full max-w-sm rounded-lg border border-cobalt-900/65 p-6 space-y-4">
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
        {packageLabel && (
          <span className="rounded border border-cobalt-400/30 bg-cobalt-400/10 px-2 py-0.5 font-medium text-cobalt-300">
            {packageLabel}
          </span>
        )}
        <span className="capitalize">{visibility}</span>
      </div>

      <div className="rounded-md border border-cobalt-900/65 bg-cobalt-900/10 px-3 py-2.5">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt-300">Intent Summary</p>

        <div className="grid grid-cols-1 gap-1.5 text-xs text-steel-600">
          <p>
            <span className="font-semibold text-foreground">Factions:</span>{' '}
            {clans.length > 0 ? clans.join(', ') : 'Any'}
          </p>
          <p>
            <span className="font-semibold text-foreground">Colors:</span>{' '}
            {colors.length > 0 ? colors.join(', ') : 'Not set'}
          </p>
          <p>
            <span className="font-semibold text-foreground">Packages:</span>{' '}
            {packages.length > 0 ? packages.length : 'None'}
          </p>
        </div>

        {selectedPackages.length > 0 && (
          <div className="mt-2.5 border-t border-cobalt-900/60 pt-2">
            <p className="mb-1 text-[11px] font-semibold text-steel-500">Selected Mechanics</p>
            <div className="flex flex-wrap gap-1">
              {selectedPackages.map((pkg) => (
                <span
                  key={pkg.id}
                  className="inline-flex items-center rounded border border-cobalt-500/30 bg-cobalt-600/30 px-2 py-0.5 text-[10px] text-cobalt-200"
                >
                  {pkg.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import preview */}
      {lineCount > 0 && (
        <div className="rounded-md border border-cobalt-900/65 bg-surface px-3 py-2 text-xs text-steel-600">
          <span className="font-semibold text-cobalt-300">{lineCount}</span>{' '}
          {lineCount === 1 ? 'line' : 'lines'} ready to import
        </div>
      )}

      {/* Hint */}
      {!name.trim() && colors.length === 0 && !packageLabel && (
        <p className="text-xs text-steel-700 italic">
          Fill in the form to see your deck preview here.
        </p>
      )}

      {/* Browse Public Decks */}
      <div className="border-t border-cobalt-900/65 pt-4 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel-500">
          Browse Public Decks
        </p>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Search decks…"
            value={browseQuery}
            onChange={(e) => setBrowseQuery(e.target.value)}
            className={cn(
              'min-w-0 flex-1 rounded border border-cobalt-900/65 bg-surface px-2.5 py-1.5 text-xs text-foreground',
              'placeholder:text-steel-600 focus:border-cobalt-500 focus:outline-none focus:ring-1 focus:ring-cobalt-500/40',
            )}
            aria-label="Search public decks"
          />
          <Link
            href={`/decks${browseQuery.trim() ? `?q=${encodeURIComponent(browseQuery.trim())}` : ''}`}
            className={cn(
              'flex-shrink-0 rounded border border-cobalt-600 bg-cobalt-600/10 px-3 py-1.5',
              'text-xs font-semibold text-cobalt-400 transition-colors hover:bg-cobalt-600/20',
            )}
          >
            Browse
          </Link>
        </div>
      </div>
    </div>
  );
}
