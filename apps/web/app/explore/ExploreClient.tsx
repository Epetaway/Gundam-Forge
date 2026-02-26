'use client';

import Link from 'next/link';
import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import type { DeckRecord } from '@/lib/data/decks';
import { getCard } from '@/lib/data/cards';
import { getEvents } from '@/lib/data/events';
import { rankTrendingDecks } from '@/lib/meta/engine';
import { useDecksQuery } from '@/lib/query/useDecksQuery';

interface ExploreClientProps {
  initialDecks: DeckRecord[];
}

type ExploreSort = 'trending' | 'winRate' | 'mostViewed';

export default function ExploreClient({ initialDecks }: ExploreClientProps): JSX.Element {
  const [sort, setSort] = React.useState<ExploreSort>('trending');
  const events = React.useMemo(() => getEvents(), []);
  const { data: decks = initialDecks, isFetching } = useDecksQuery({ initialData: initialDecks });

  const enriched = React.useMemo(() => rankTrendingDecks(decks, events, 50), [decks, events]);

  const visibleDecks = React.useMemo(() => {
    if (sort === 'trending') return enriched;
    if (sort === 'winRate') return [...enriched].sort((a, b) => b.winRate - a.winRate);
    return [...enriched].sort((a, b) => b.views - a.views);
  }, [enriched, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setSort('trending')} size="sm" variant={sort === 'trending' ? 'primary' : 'secondary'}>
          Trending
        </Button>
        <Button onClick={() => setSort('winRate')} size="sm" variant={sort === 'winRate' ? 'primary' : 'secondary'}>
          Win Rate
        </Button>
        <Button onClick={() => setSort('mostViewed')} size="sm" variant={sort === 'mostViewed' ? 'primary' : 'secondary'}>
          Most Viewed
        </Button>
        <span className="ml-auto text-xs text-steel-600">{isFetching ? 'Refreshing deck index...' : `${visibleDecks.length} decks`}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleDecks.map((deck) => {
          const previewCard = getCard(deck.entries[0]?.cardId);
          return (
            <DeckPreviewCard
              key={deck.id}
              heroUrl={previewCard?.imageUrl || '/default-hero.jpg'}
              title={deck.name}
              subtitle={deck.archetype}
              author={deck.owner || 'Unknown'}
              views={deck.views || 0}
              cardCount={deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0)}
              updatedAgo={'recently'}
              colors={deck.colors || []}
              tags={deck.archetype ? [deck.archetype] : []}
              avatarUrl={undefined}
              onClick={() => window.location.href = `/decks/${deck.id}`}
              onMenu={() => {}}
            />
          );
        })}
      </div>
    </div>
  );
}

function getArchetypeAccent(archetype: string): string {
  const key = archetype.toLowerCase();
  if (key.includes('aggro')) return 'bg-red-500';
  if (key.includes('control')) return 'bg-cobalt-500';
  if (key.includes('midrange')) return 'bg-violet-500';
  if (key.includes('ramp')) return 'bg-emerald-500';
  if (key.includes('combo')) return 'bg-amber-500';
  return 'bg-steel-500';
}

function getWinRateTone(winRate: number): string {
  if (winRate >= 0.8) return 'text-emerald-300';
  if (winRate >= 0.7) return 'text-amber-300';
  return 'text-red-300';
}
