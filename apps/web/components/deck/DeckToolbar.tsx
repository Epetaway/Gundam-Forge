'use client';

import { Search } from 'lucide-react';
import type { ComponentType } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { DeckDensity, DeckSortKey, DeckViewMode } from '@/lib/deck/sortFilter';

export interface DeckToolbarViewOption {
  id: DeckViewMode;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface DeckToolbarProps {
  views: DeckToolbarViewOption[];
  viewMode: DeckViewMode;
  onViewModeChange: (mode: DeckViewMode) => void;
  query: string;
  onQueryChange: (value: string) => void;
  sortBy: DeckSortKey;
  onSortByChange: (key: DeckSortKey) => void;
  showSort?: boolean;
  density: DeckDensity;
  onDensityChange: (density: DeckDensity) => void;
  showDensity?: boolean;
  /** Optional buttons/actions rendered at the far-right of the toolbar row */
  actions?: React.ReactNode;
}

export function DeckToolbar({
  views,
  viewMode,
  onViewModeChange,
  query,
  onQueryChange,
  sortBy,
  onSortByChange,
  showSort = true,
  density,
  onDensityChange,
  showDensity = true,
  actions,
}: DeckToolbarProps): JSX.Element {
  return (
    <section className="sticky top-56 z-10 py-4 md:top-56">
      <div className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:flex-wrap">
          <div className="inline-flex items-center rounded-md border border-cobalt-900/70 p-1">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                aria-label={`View as ${view.label}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-2 text-xs font-semibold transition-colors',
                  viewMode === view.id
                    ? 'bg-cobalt-600/20 text-cobalt-100 shadow-sm ring-1 ring-cobalt-400/50'
                    : 'text-steel-600 hover:bg-surface-muted hover:text-foreground',
                )}
                key={view.id}
                onClick={() => onViewModeChange(view.id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                {view.label}
              </button>
            );
          })}
          </div>

          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-steel-500" />
            <input
              className="h-12 w-full rounded-md border border-cobalt-900/70 bg-transparent pl-8 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-steel-500 focus-visible:border-cobalt-400/70 focus-visible:ring-2 focus-visible:ring-cobalt-500/25"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search this deck"
              value={query}
            />
          </label>

          {showSort && (
            <select
              aria-label="Sort cards"
              className="h-12 rounded-md border border-cobalt-900/70 bg-transparent px-4 text-sm text-foreground outline-none transition-colors focus-visible:border-cobalt-400/70 focus-visible:ring-2 focus-visible:ring-cobalt-500/25"
              onChange={(event) => onSortByChange(event.target.value as DeckSortKey)}
              value={sortBy}
            >
              <option value="name">Sort: Name</option>
              <option value="cost">Sort: Cost</option>
              <option value="type">Sort: Type</option>
            </select>
          )}

          {showDensity && (
            <div className="inline-flex items-center rounded-md border border-cobalt-900/70 p-1">
              <Button
                className={cn(density === 'comfortable' ? 'shadow-sm' : '')}
                onClick={() => onDensityChange('comfortable')}
                size="sm"
                type="button"
                variant={density === 'comfortable' ? 'secondary' : 'ghost'}
              >
                Comfortable
              </Button>
              <Button
                className={cn(density === 'compact' ? 'shadow-sm' : '')}
                onClick={() => onDensityChange('compact')}
                size="sm"
                type="button"
                variant={density === 'compact' ? 'secondary' : 'ghost'}
              >
                Compact
              </Button>
            </div>
          )}

          {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
