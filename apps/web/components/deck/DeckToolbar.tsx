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
  density: DeckDensity;
  onDensityChange: (density: DeckDensity) => void;
}

export function DeckToolbar({
  views,
  viewMode,
  onViewModeChange,
  query,
  onQueryChange,
  sortBy,
  onSortByChange,
  density,
  onDensityChange,
}: DeckToolbarProps): JSX.Element {
  return (
    <section className="sticky top-[12.5rem] z-10 border-b border-border bg-surface/95 py-3 backdrop-blur-md">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="inline-flex items-center rounded-md border border-border bg-surface-interactive p-1">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                aria-label={`View as ${view.label}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors',
                  viewMode === view.id ? 'bg-surface text-foreground shadow-sm' : 'text-steel-600 hover:text-foreground',
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
            className="h-9 w-full rounded-md border border-border bg-surface-interactive pl-8 pr-2 text-sm text-foreground outline-none transition-colors placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search this deck"
            value={query}
          />
        </label>

        <select
          aria-label="Sort cards"
          className="h-9 rounded-md border border-border bg-surface-interactive px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          onChange={(event) => onSortByChange(event.target.value as DeckSortKey)}
          value={sortBy}
        >
          <option value="name">Sort: Name</option>
          <option value="cost">Sort: Cost</option>
          <option value="type">Sort: Type</option>
        </select>

        <div className="inline-flex items-center rounded-md border border-border bg-surface-interactive p-1">
          <Button
            className={cn(
              density === 'comfortable' ? 'shadow-sm' : '',
            )}
            onClick={() => onDensityChange('comfortable')}
            size="sm"
            type="button"
            variant={density === 'comfortable' ? 'secondary' : 'ghost'}
          >
            Comfortable
          </Button>
          <Button
            className={cn(
              density === 'compact' ? 'shadow-sm' : '',
            )}
            onClick={() => onDensityChange('compact')}
            size="sm"
            type="button"
            variant={density === 'compact' ? 'secondary' : 'ghost'}
          >
            Compact
          </Button>
        </div>
      </div>
    </section>
  );
}
