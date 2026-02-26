'use client';

import Link from 'next/link';
import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CardArtImage } from '@/components/ui/CardArtImage';
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
            <Card
              className="group relative overflow-hidden border-steel-400 bg-surface-elevated transition-all duration-150 hover:-translate-y-0.5 hover:border-cobalt-400/70 hover:shadow-[0_18px_34px_rgba(2,6,23,0.52)]"
              key={deck.id}
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${getArchetypeAccent(deck.archetype)}`} />
              <div className="relative border-b border-border">
                {previewCard ? (
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <CardArtImage
                      alt={previewCard.name}
                      card={previewCard}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      fill
                      sizes="(max-width: 1024px) 80vw, 26vw"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0e1116] to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-surface-interactive" />
                )}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{deck.name}</CardTitle>
                  <Badge variant="accent">{deck.archetype}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-steel-600">
                  <p>{deck.description}</p>
                  <p className="mt-1">By {deck.owner}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md border border-border bg-surface-interactive p-2">
                    <p className="font-mono uppercase tracking-wide text-steel-500">Trend</p>
                    <p className="font-semibold">{deck.trendingScore}</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-interactive p-2">
                    <p className="font-mono uppercase tracking-wide text-steel-500">Win Rate</p>
                    <p className={`font-semibold ${getWinRateTone(deck.winRate)}`}>{(deck.winRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface-interactive p-2">
                    <p className="font-mono uppercase tracking-wide text-steel-500">Events</p>
                    <p className="font-semibold">{deck.eventAppearances}</p>
                  </div>
                </div>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={`/decks/${deck.id}`}>Open deck</Link>
                </Button>
              </CardContent>
            </Card>
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
