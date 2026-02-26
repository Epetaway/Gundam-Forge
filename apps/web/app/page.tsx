import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getCard } from '@/lib/data/cards';
import { getDecks } from '@/lib/data/decks';

export default function HomePage(): JSX.Element {
  const decks = getDecks().slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(42,102,255,0.08),transparent_40%),linear-gradient(to_bottom,transparent,rgba(15,23,42,0.04))]" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="space-y-6">
            <Badge variant="accent" className="w-fit">Foundation Reset</Badge>
            <h1 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Industrial-grade deck building for Gundam GCG.
            </h1>
            <p className="max-w-[62ch] text-base text-steel-600">
              Rebuilt on Next.js App Router with SSR-first pages, accessible Radix primitives, and tokenized Tailwind styling.
              Card artwork stays dominant while UI chrome remains structured and mechanically minimal.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/forge">Enter Forge</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/cards">Browse Cards</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-steel-200/80 bg-surface/90">
            <CardHeader>
              <CardTitle>Meta Snapshot</CardTitle>
              <CardDescription>Live-ready architecture with SSR by default and scoped client islands.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Decks Indexed" value={`${getDecks().length}`} />
                <Stat label="Cards Loaded" value="500+" />
                <Stat label="UI Primitives" value="9" />
                <Stat label="Bundle Strategy" value="Minimal" />
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-12">
        <Container className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Featured Decks</h2>
            <Button asChild size="sm" variant="secondary">
              <Link href="/decks">See all decks</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => {
              const previewCard = getCard(deck.entries[0]?.cardId);
              return (
                <Card key={deck.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-steel-100">
                    {previewCard ? (
                      <CardArtImage
                        card={previewCard}
                        className="h-full w-full object-cover"
                        height={480}
                        width={720}
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-xs uppercase tracking-wide text-white/75">{deck.archetype}</p>
                      <p className="font-display text-xl font-semibold text-white">{deck.name}</p>
                    </div>
                  </div>
                  <CardContent className="flex items-center justify-between py-3">
                    <p className="text-xs text-steel-600">{deck.likes} likes • {deck.views} views</p>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/decks/${deck.id}`}>Open</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-border bg-steel-50 px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-steel-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
