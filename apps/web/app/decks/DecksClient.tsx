'use client';

import Link from 'next/link';
import type { DeckRecord } from '@/lib/data/decks';
import { useDecksQuery } from '@/lib/query/useDecksQuery';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface DecksClientProps {
  initialDecks: DeckRecord[];
}

export default function DecksClient({ initialDecks }: DecksClientProps): JSX.Element {
  const { data: decks = initialDecks, isFetching } = useDecksQuery({ initialData: initialDecks });

  return (
    <div className="space-y-4">
      <div className="text-xs text-steel-600">{isFetching ? 'Refreshing decks...' : `${decks.length} decks loaded`}</div>

      {decks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/50 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-steel-500 mb-3">Deck library empty</p>
          <p className="text-sm text-steel-600 mb-6">
            {isFetching ? 'Loading decks...' : 'No decks have been added to the library yet. Start by creating your first deck!'}
          </p>
          <Link href="/decks/new">
            <Button variant="primary">Create Deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {decks.map((deck) => (
            <Card key={deck.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{deck.name}</CardTitle>
                  <Badge variant="accent">{deck.archetype}</Badge>
                </div>
                <CardDescription>{deck.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {deck.colors.map((color) => (
                    <Badge key={color}>{color}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-steel-600">
                  <p>{deck.entries.reduce((sum, entry) => sum + entry.qty, 0)} cards • by {deck.owner}</p>
                  <p>{deck.likes} likes • {deck.views} views</p>
                </div>
                <Button asChild className="w-full" variant="secondary">
                  <Link href={`/decks/${deck.id}`}>Open deck</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
