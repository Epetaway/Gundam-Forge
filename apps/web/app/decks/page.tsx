import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getDeckCardCount, getDecks } from '@/lib/data/decks';

export default function DecksPage(): JSX.Element {
  const decks = getDecks();

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Curated and community-style lists represented in a stable schema for SSR rendering and API portability."
        eyebrow="Deck Archive"
        title="Deck Library"
      />

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
                <p>{getDeckCardCount(deck)} cards • by {deck.owner}</p>
                <p>{deck.likes} likes • {deck.views} views</p>
              </div>
              <Button asChild className="w-full" variant="secondary">
                <Link href={`/decks/${deck.id}`}>Open deck</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
