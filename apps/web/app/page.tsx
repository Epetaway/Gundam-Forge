import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { TrendingDecksClient, TrendingDeckData } from '@/components/deck/TrendingDecksClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Wrench, Swords } from 'lucide-react';
import { cards, getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { getDecks } from '@/lib/data/decks';
import { getEvents } from '@/lib/data/events';
import { rankArchetypes, rankTrendingDecks } from '@/lib/meta/engine';
import { relativeTime } from '@/lib/utils/relativeTime';

export default function HomePage(): JSX.Element {
  const decks = getDecks();
  const events = getEvents();
  const allArchetypes = rankArchetypes(events);
  const trendingDecks = rankTrendingDecks(decks, events, 3);
  const archetypes = allArchetypes.slice(0, 4);
  const latestEventDate = events[0]?.date ?? null;
  const platformFeatures = [
    `Browse ${cards.length} official Gundam Card Game cards with full-text search.`,
    'Build and validate decks against official GCG rules.',
    'Playtest your deck against an AI opponent with official phase sequencing.',
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_18%_-10%,hsl(var(--accent)/0.24),transparent_72%),linear-gradient(120deg,hsl(var(--accent)/0.08),transparent_45%)]" />
        <Container className="relative grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div className="space-y-6">
            <Badge variant="accent" className="w-fit">Gundam Card Game Forge</Badge>
            <h1 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Build. Test. Win.
            </h1>
            <p className="max-w-[62ch] text-base text-steel-700">
              Competitive deck-building for Gundam Card Game. Browse the full card pool, craft your list in the Forge, and validate it against official rules — all in one command interface.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href="/decks/new">+ Create Deck</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/cards">Browse Cards</Link>
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-steel-400 bg-surface-elevated/90">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>Meta Snapshot</CardTitle>
                  <CardDescription>Tournament data powering archetype rankings.</CardDescription>
                </div>
                {latestEventDate && (
                  <span className="flex-shrink-0 rounded border border-border bg-surface-interactive px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-steel-500">
                    Latest: {latestEventDate}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Decks Indexed" value={`${decks.length}`} />
                <Stat label="Cards in Pool" value={`${cards.length}`} />
                <Stat label="Events Tracked" value={`${events.length}`} />
                <Stat label="Archetypes" value={`${allArchetypes.length}`} />
              </div>
              <p className="text-[11px] text-steel-500">
                Data updated with each build deployment.
              </p>
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
          <TrendingDecksClient
            decks={trendingDecks.map((deck) => {
              const previewCard = getCard(deck.entries[0]?.cardId);
              return {
                id: deck.id,
                heroUrl: previewCard ? getCardImage(previewCard) : withBasePath('/hero-bg.png'),
                title: deck.name,
                subtitle: deck.owner || 'Unknown Pilot',
                author: deck.owner || 'Unknown',
                views: deck.views || 0,
                cardCount: deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0),
                colors: deck.colors || [],
                archetype: deck.archetype,
                tags: deck.archetype ? [deck.archetype] : [],
                avatarUrl: undefined,
                updatedAgo: relativeTime(deck.updatedAt),
              } satisfies TrendingDeckData;
            })}
          />
        </Container>
      </section>

      <section className="py-12">
        <Container className="space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cobalt-400 mb-2">What You Can Do</p>
            <h2 className="font-display text-2xl font-semibold text-foreground">Everything in One Place</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-surface-elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-cobalt-600/20 p-2">
                    <Wrench className="h-5 w-5 text-cobalt-400" />
                  </div>
                  <CardTitle>Build in the Forge</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                  A dedicated deck construction workspace with card search, synergy scoring, real-time validation, and four view modes. Your deck, built to official GCG rules.
                </CardDescription>
                <Button asChild className="w-full" variant="primary">
                  <Link href="/forge">+ Open Forge</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-surface-elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-cobalt-600/20 p-2">
                    <Swords className="h-5 w-5 text-cobalt-400" />
                  </div>
                  <CardTitle>Playtest Your Deck</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription>
                  Test any deck against an AI opponent using the full official GCG ruleset — phases, combat, triggers, and all official keywords.
                </CardDescription>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/decks">Choose a Deck →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <section className="pb-12">
        <Container className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-surface-elevated">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle>Recent Tournament Results</CardTitle>
                  <CardDescription>Latest placements informing the ranking engine.</CardDescription>
                </div>
                {latestEventDate && (
                  <span className="flex-shrink-0 rounded border border-border bg-surface-interactive px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-steel-500">
                    {latestEventDate}
                  </span>
                )}
              </div>
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
                <CardTitle>Platform Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {platformFeatures.map((feature) => (
                  <p className="rounded-md border border-border bg-surface-interactive px-3 py-2 text-xs text-steel-700" key={feature}>
                    {feature}
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
