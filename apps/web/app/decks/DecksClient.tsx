'use client';

import Link from 'next/link';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers, Loader2, Swords } from 'lucide-react';
import type { DeckRecord } from '@/lib/data/decks';
import type { EventRecord } from '@/lib/data/events';
import { useDecksQuery } from '@/lib/query/useDecksQuery';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import { Badge } from '@/components/ui/Badge';
import { getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { relativeTime } from '@/lib/utils/relativeTime';
import { rankTrendingDecks, type TrendingDeckRecord } from '@/lib/meta/engine';
import { cn } from '@/lib/utils/cn';
import { features } from '@/lib/features/feature-flags';
import {
  availableDeckArchetypes,
  availableDeckColors,
  filterAndSortDeckBrowserData,
  rankDeckBrowserData,
  type DeckSourceScope,
  type DeckSort,
} from '@/lib/decks/browser';

interface DecksClientProps {
  initialDecks: DeckRecord[];
  events: EventRecord[];
}

const COLOR_PILL_ACTIVE_CLASSES: Record<string, string> = {
  Blue: 'bg-blue-600 text-white border-blue-500',
  Green: 'bg-green-600 text-white border-green-500',
  Red: 'bg-red-600 text-white border-red-500',
  White: 'bg-white text-steel-900 border-steel-300',
  Purple: 'bg-purple-600 text-white border-purple-500',
  Colorless: 'bg-steel-600 text-white border-steel-500',
};

export default function DecksClient({ initialDecks, events }: DecksClientProps): JSX.Element {
  const searchParams = useSearchParams();
  const playtestMode = searchParams.get('action') === 'playtest';
  const decksUxV2Enabled = features.decksUxV2();
  const { data: decks = initialDecks, isFetching } = useDecksQuery({ initialData: initialDecks });
  const [sort, setSort] = React.useState<DeckSort>('newest');
  const [selectedColors, setSelectedColors] = React.useState<string[]>([]);
  const [archetype, setArchetype] = React.useState('All');
  const [sourceFilter, setSourceFilter] = React.useState<DeckSourceScope>('all');

  const rankedDecks = React.useMemo(() => rankDeckBrowserData(decks, events), [decks, events]);

  const archetypeOptions = React.useMemo(() => availableDeckArchetypes(rankedDecks), [rankedDecks]);

  const availableColors = React.useMemo(() => availableDeckColors(rankedDecks), [rankedDecks]);

  const visibleDecks = React.useMemo(
    () =>
      filterAndSortDeckBrowserData(rankedDecks, {
        selectedColors,
        archetype,
        sort,
        sourceScope: decksUxV2Enabled ? sourceFilter : 'all',
      }),
    [rankedDecks, selectedColors, archetype, sort, decksUxV2Enabled, sourceFilter],
  );

  const activeFilterCount = selectedColors.length + (archetype !== 'All' ? 1 : 0) + (decksUxV2Enabled && sourceFilter !== 'all' ? 1 : 0);

  const toggleColor = React.useCallback((color: string) => {
    setSelectedColors((current) => (current.includes(color) ? current.filter((c) => c !== color) : [...current, color]));
  }, []);

  const clearFilters = React.useCallback(() => {
    setSelectedColors([]);
    setArchetype('All');
    if (decksUxV2Enabled) {
      setSourceFilter('all');
    }
  }, [decksUxV2Enabled]);

  return (
    <div className="space-y-4">
      {playtestMode && (
        <div className="rounded-lg border border-cobalt-500/40 bg-cobalt-700/20 px-3 py-2 text-sm text-cobalt-200">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <Swords className="h-4 w-4" aria-hidden="true" />
            Select a deck to start playtesting.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Sort decks by" className="flex flex-wrap gap-2">
          <Button onClick={() => setSort('newest')} size="sm" variant={sort === 'newest' ? 'primary' : 'secondary'} aria-pressed={sort === 'newest'}>
            Newest
          </Button>
          <Button onClick={() => setSort('trending')} size="sm" variant={sort === 'trending' ? 'primary' : 'secondary'} aria-pressed={sort === 'trending'}>
            Trending
          </Button>
          <Button onClick={() => setSort('winRate')} size="sm" variant={sort === 'winRate' ? 'primary' : 'secondary'} aria-pressed={sort === 'winRate'}>
            Win Rate
          </Button>
          <Button onClick={() => setSort('mostViewed')} size="sm" variant={sort === 'mostViewed' ? 'primary' : 'secondary'} aria-pressed={sort === 'mostViewed'}>
            Most Viewed
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-steel-600" aria-live="polite" aria-atomic="true">
          <Badge>{visibleDecks.length} shown</Badge>
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {isFetching ? 'Refreshing decks…' : `${decks.length} total decks`}
        </div>

        <Link href="/forge">
          <Button size="sm" variant="primary">+ Create Deck</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-interactive p-2">
        {decksUxV2Enabled ? (
          <div className="flex w-full flex-wrap items-center gap-1.5 border-b border-border/70 pb-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-500">Source</span>
            <Button
              aria-pressed={sourceFilter === 'all'}
              onClick={() => setSourceFilter('all')}
              size="sm"
              variant={sourceFilter === 'all' ? 'primary' : 'secondary'}
            >
              All
            </Button>
            <Button
              aria-pressed={sourceFilter === 'tournament'}
              onClick={() => setSourceFilter('tournament')}
              size="sm"
              variant={sourceFilter === 'tournament' ? 'primary' : 'secondary'}
            >
              Tournament
            </Button>
            <Button
              aria-pressed={sourceFilter === 'community'}
              onClick={() => setSourceFilter('community')}
              size="sm"
              variant={sourceFilter === 'community' ? 'primary' : 'secondary'}
            >
              Community
            </Button>
            <Badge className="ml-auto">{activeFilterCount} filters</Badge>
          </div>
        ) : null}

        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-500">Colors</span>
        {availableColors.map((color) => {
          const active = selectedColors.includes(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                active
                  ? (COLOR_PILL_ACTIVE_CLASSES[color] ?? 'bg-cobalt-600 text-white border-cobalt-500')
                  : 'border-border bg-surface text-steel-600 hover:text-foreground',
              )}
              aria-pressed={active}
            >
              {color}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="archetype-filter" className="text-xs font-semibold uppercase tracking-[0.08em] text-steel-500">Archetype</label>
          <select
            id="archetype-filter"
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground"
          >
            {archetypeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {!decksUxV2Enabled ? <Badge>{activeFilterCount} filters</Badge> : null}
          <Button size="sm" variant="secondary" onClick={clearFilters}>Reset</Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-steel-600" aria-live="polite" aria-atomic="true">
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {isFetching ? 'Refreshing decks…' : `${visibleDecks.length} decks loaded`}
      </div>

      {visibleDecks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/50 py-16 text-center" role="status">
          <Layers className="mx-auto mb-3 h-8 w-8 text-steel-600" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-widest text-steel-500 mb-3">No matching decks</p>
          <p className="text-sm text-steel-600 mb-6">
            {isFetching ? 'Loading decks…' : 'Try adjusting color/archetype filters or create a new deck.'}
          </p>
          <Link href="/forge">
            <Button variant="primary">+ Create Deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDecks.map((deck) => {
            const previewCard = getCard(deck.entries[0]?.cardId);
            return (
              <DeckPreviewCard
                key={deck.id}
                heroUrl={previewCard ? getCardImage(previewCard) : withBasePath('/hero-bg.png')}
                title={deck.name}
                subtitle={deck.description || ''}
                author={deck.owner || 'Unknown'}
                views={deck.views || 0}
                cardCount={deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0)}
                updatedAgo={relativeTime(deck.updatedAt ?? deck.id)}
                colors={deck.colors || []}
                archetype={deck.archetype}
                tags={[
                  ...(deck.archetype ? [deck.archetype] : []),
                  ...(Number.isFinite(deck.winRate) && deck.winRate > 0 ? [`${(deck.winRate * 100).toFixed(1)}% WR`] : []),
                  ...(deck.source === 'tournament' ? ['Tournament'] : []),
                ]}
                href={`/decks/${deck.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
