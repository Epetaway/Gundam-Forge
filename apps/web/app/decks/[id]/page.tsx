// Required for static export: generateStaticParams
import { deckCatalog } from '@/lib/data/decks';

export function generateStaticParams() {
  return deckCatalog.map(deck => ({ id: deck.id }));
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReferenceCardTile } from '@/components/cards/ReferenceCardTile';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { getDeckById, getDeckCardCount, getResolvedEntries } from '@/lib/data/decks';

interface DeckViewPageProps {
  params: {
    id: string;
  };
}

export default function DeckViewPage({ params }: DeckViewPageProps): JSX.Element {
  const foundDeck = getDeckById(params.id);
  if (!foundDeck) notFound();
  const deck = foundDeck;

  const entries = getResolvedEntries(deck);
  const previewCard = entries[0]?.card;

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        actions={
          <Button asChild variant="secondary">
            <Link href="/forge">Clone in Forge</Link>
          </Button>
        }
        description={deck.description}
        eyebrow="Deck View"
        title={deck.name}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-steel-50 text-xs uppercase tracking-wide text-steel-600">
                <tr>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr className="border-b border-border/70" key={entry.cardId}>
                    <td className="px-4 py-3 font-semibold">{entry.qty}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.card?.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-steel-500">{entry.card?.id}</p>
                    </td>
                    <td className="px-4 py-3">{entry.card?.type}</td>
                    <td className="px-4 py-3">{entry.card?.color}</td>
                    <td className="px-4 py-3">{entry.card?.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="space-y-3 py-3">
              {previewCard ? (
                <ReferenceCardTile
                  card={previewCard}
                  qty={deck.entries.find((entry) => entry.cardId === previewCard.id)?.qty ?? 1}
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                {deck.colors.map((color) => (
                  <Badge key={color} variant="accent">{color}</Badge>
                ))}
              </div>
              <div className="space-y-1 text-xs text-steel-600">
                <p>{getDeckCardCount(deck)} total cards</p>
                <p>{deck.likes} likes • {deck.views} views</p>
                <p>Owner: {deck.owner}</p>
              </div>
            </CardContent>
          </Card>

          <Button asChild className="w-full" variant="secondary">
            <Link href="/decks">Back to deck library</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
