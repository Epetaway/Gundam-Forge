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

      <div className="grid gap-4 md:grid-cols-2">
        {decks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-steel-500">Empty</p>
            <h2 className="text-xl font-semibold text-foreground">No decks yet</h2>
            <p className="max-w-xs text-sm text-steel-600">Create your first deck to get started.</p>
            <Link href="/decks/new">
              <Button size="sm" variant="primary">+ Create Deck</Button>
            </Link>
          </div>
        ) : (
          <>
            {decks.length <= 5 && (
              <div className="col-span-full rounded-lg border border-cobalt-500/30 bg-surface/50 px-4 py-3 text-sm text-steel-500">
                Community decks coming soon — more shared builds will appear here as pilots submit their lists.
              </div>
            )}
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
          </>
        )}
      </div>
    </div>
  );
}
