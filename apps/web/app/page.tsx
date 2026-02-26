import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ReferenceCardTile } from '@/components/cards/ReferenceCardTile';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getCard } from '@/lib/data/cards';
import { getDecks } from '@/lib/data/decks';
import { getEvents } from '@/lib/data/events';
import { rankArchetypes, rankTrendingDecks } from '@/lib/meta/engine';

export default function HomePage(): JSX.Element {
  const decks = getDecks();
  const events = getEvents();
  const trendingDecks = rankTrendingDecks(decks, events, 3);
  const archetypes = rankArchetypes(events).slice(0, 4);
  const latestUpdates = [
    'Meta engine now factors event-weighted placements and social momentum.',
    'Cards and Forge now use unified reference card tile and detail modal.',
    'Deck explorer sorting now includes trending and win-rate derived order.',
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_18%_-10%,rgba(59,130,246,0.24),transparent_72%),linear-gradient(120deg,rgba(59,130,246,0.08),transparent_45%)]" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="space-y-6">
            <Badge variant="accent" className="w-fit">Command Interface V2</Badge>
            <h1 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Forge Winning Gundam Decks.
            </h1>
            <p className="max-w-[62ch] text-base text-steel-600">
              Built for competitive pilots. Powered by real tournament data and mechanical-grade deck tooling.
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

          <Card className="overflow-hidden border-steel-400 bg-surface-elevated/90">
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
            <h2 className="font-display text-2xl font-semibold">Trending Decks</h2>
            <Button asChild size="sm" variant="secondary">
              <Link href="/explore">See all decks</Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trendingDecks.map((deck) => {
              const previewCard = getCard(deck.entries[0]?.cardId);
              const accentClass = getArchetypeAccent(deck.archetype);
              return (
                <Card
                  key={deck.id}
                  className="group relative overflow-hidden border-steel-400 bg-surface-elevated transition-all duration-150 hover:-translate-y-0.5 hover:border-cobalt-400/70 hover:shadow-[0_18px_34px_rgba(2,6,23,0.52)]"
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${accentClass}`} />
                  <CardContent className="pb-0">
                    {previewCard ? (
                      <ReferenceCardTile
                        card={previewCard}
                        qty={deck.entries[0]?.qty ?? 1}
                        onOpen={undefined}
                      />
                    ) : null}
                    <div className="pt-3">
                      <p className="text-xs uppercase tracking-wide text-steel-500">{deck.archetype}</p>
                      <p className="font-display text-xl font-semibold text-foreground">{deck.name}</p>
                    </div>
                  </CardContent>
                  <CardContent className="flex items-center justify-between py-3">
                    <p className={`text-xs ${getWinRateTone(deck.winRate)}`}>
                      {(deck.winRate * 100).toFixed(1)}% win rate • {deck.eventAppearances} events
                    </p>
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

      <section className="pb-12">
        <Container className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Recent Tournament Results</CardTitle>
              <CardDescription>Latest placements informing the ranking engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.slice(0, 3).map((event) => (
                <div className="rounded-md border border-border bg-surface-interactive px-3 py-2" key={event.id}>
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-semibold">{event.name}</p>
                    <Badge>{event.date}</Badge>
                  </div>
                  <p className="text-xs text-steel-600">
                    #{event.placements[0]?.placement} {event.placements[0]?.deckName} • {event.location}
                  </p>
                </div>
              ))}
              <Button asChild className="w-full" variant="secondary">
                <Link href="/events">View events</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Popular Archetypes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {archetypes.map((record) => (
                  <div className="rounded-md border border-border bg-surface-interactive px-3 py-2" key={record.archetype}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{record.archetype}</p>
                      <Badge variant="accent">{record.topThree} top 3</Badge>
                    </div>
                    <p className="text-xs text-steel-600">{(record.winRate * 100).toFixed(1)}% win rate</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Latest Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {latestUpdates.map((update) => (
                  <p className="rounded-md border border-border bg-surface-interactive px-3 py-2 text-xs text-steel-700" key={update}>
                    {update}
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-border bg-surface-interactive px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-steel-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
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
