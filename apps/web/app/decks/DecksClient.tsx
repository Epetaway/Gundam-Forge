'use client';

import Link from 'next/link';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Layers, Loader2, Search, Swords } from 'lucide-react';
import type { DeckRecord } from '@/lib/data/decks';
import type { EventRecord } from '@/lib/data/events';
import { useDecksQuery } from '@/lib/query/useDecksQuery';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { relativeTime } from '@/lib/utils/relativeTime';
import { rankDeckBrowserData, type DeckSort } from '@/lib/decks/browser';

interface DecksClientProps {
  initialDecks: DeckRecord[];
  events: EventRecord[];
}

const SORT_OPTIONS: Array<{ label: string; value: DeckSort }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Trending', value: 'trending' },
  { label: 'Win Rate', value: 'winRate' },
  { label: 'Most Viewed', value: 'mostViewed' },
];

export default function DecksClient({ initialDecks, events }: DecksClientProps): JSX.Element {
  const searchParams = useSearchParams();
  const playtestMode = searchParams.get('action') === 'playtest';
  const { data: decks = initialDecks, isFetching, isError, refetch } = useDecksQuery({ initialData: initialDecks });

  const [sort, setSort] = React.useState<DeckSort>('newest');
  const [query, setQuery] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState<string>('All');
  const [selectedArchetype, setSelectedArchetype] = React.useState<string>('All');

  const ranked = React.useMemo(() => rankDeckBrowserData(decks, events), [decks, events]);

  const colorOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const deck of ranked) {
      for (const color of deck.colors ?? []) set.add(color);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [ranked]);

  const archetypeOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const deck of ranked) {
      if (deck.archetype?.trim()) {
        const normalized = deck.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified');
        set.add(normalized);
      }
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [ranked]);

  const visibleDecks = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = ranked.filter((deck) => {
      const normalizedArchetype = deck.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified');
      const matchesColor = selectedColor === 'All' || (deck.colors ?? []).some((color) => color === selectedColor);
      const matchesArchetype = selectedArchetype === 'All' || normalizedArchetype === selectedArchetype;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        deck.name.toLowerCase().includes(normalizedQuery) ||
        normalizedArchetype.toLowerCase().includes(normalizedQuery) ||
        (deck.owner ?? '').toLowerCase().includes(normalizedQuery);

      return matchesColor && matchesArchetype && matchesQuery;
    });

    switch (sort) {
      case 'trending':
        return [...filtered].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
      case 'winRate':
        return [...filtered].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
      case 'mostViewed':
        return [...filtered].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      case 'newest':
      default:
        return [...filtered].sort((a, b) => {
          const aDate = new Date(a.updatedAt ?? a.id).getTime();
          const bDate = new Date(b.updatedAt ?? b.id).getTime();
          return bDate - aDate;
        });
    }
  }, [query, ranked, selectedArchetype, selectedColor, sort]);

  const resetFilters = (): void => {
    setQuery('');
    setSelectedColor('All');
    setSelectedArchetype('All');
    setSort('newest');
  };

  return (
    <div className="space-y-4">
      {playtestMode ? (
        <div className="rounded-md border border-cobalt-500/40 bg-cobalt-700/20 px-4 py-4 text-sm text-cobalt-200">
          <p className="inline-flex items-center gap-2 font-semibold">
            <Swords className="h-4 w-4" aria-hidden="true" />
            Select a deck to start playtesting.
          </p>
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-surface-elevated p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_200px_180px_auto]">
          <Input
            aria-label="Search decks"
            className="h-11"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by deck name, archetype, or owner"
            startIcon={<Search className="h-4 w-4" />}
            value={query}
          />

          <Select onValueChange={(value) => setSelectedColor(value)} value={selectedColor}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color} value={color}>{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSelectedArchetype(value)} value={selectedArchetype}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Archetype" />
            </SelectTrigger>
            <SelectContent>
              {archetypeOptions.map((archetype) => (
                <SelectItem key={archetype} value={archetype}>{archetype}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSort(value as DeckSort)} value={sort}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button className="w-full lg:w-auto" onClick={resetFilters} size="md" variant="secondary">Reset</Button>
            <Button asChild className="w-full lg:w-auto" size="md" variant="primary">
              <Link href="/forge">Create Deck</Link>
            </Button>
          </div>
        </div>

        <div aria-live="polite" className="mt-4 flex items-center gap-2 text-xs text-text-muted">
          <Search className="h-3.5 w-3.5" />
          <span>{visibleDecks.length} shown of {decks.length}</span>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        </div>
      </section>

      {isError ? (
        <EmptyState
          icon={<AlertCircle className="h-5 w-5 text-red-400" />}
          title="Decks failed to load"
          description="We could not refresh deck data. Try again."
          cta={<Button onClick={() => void refetch()} variant="secondary">Retry</Button>}
        />
      ) : null}

      {!isError && isFetching && visibleDecks.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="status" aria-live="polite">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`deck-skeleton-${index}`} className="aspect-[3/4] animate-pulse rounded-lg border border-border bg-surface-muted" />
          ))}
        </div>
      ) : null}

      {!isError && !isFetching && visibleDecks.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5 text-text-muted" />}
          title="No decks found"
          description="Try broadening color or archetype filters, or start with a new deck."
          cta={
            <Button asChild variant="primary">
              <Link href="/forge">Create Deck</Link>
            </Button>
          }
        />
      ) : null}

      {!isError && visibleDecks.length > 0 ? (
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
                archetype={deck.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified')}
                tags={[
                  ...(Number.isFinite(deck.winRate) && deck.winRate > 0 ? [`${(deck.winRate * 100).toFixed(1)}% WR`] : []),
                  ...(deck.source === 'tournament' ? ['Tournament'] : []),
                ]}
                href={`/decks/${deck.id}`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
