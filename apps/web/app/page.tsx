import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { TrendingDecksClient, type TrendingDeckData } from '@/components/deck/TrendingDecksClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ListItem } from '@/components/ui/ListItem';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatCard } from '@/components/ui/StatCard';
import { cards, getCard, getCardImage } from '@/lib/data/cards';
import { getDecks } from '@/lib/data/decks';
import { getEvents } from '@/lib/data/events';
import { getColorDistribution, rankArchetypes, rankTrendingDecks } from '@/lib/meta/engine';
import { withBasePath } from '@/lib/utils/basePath';
import { relativeTime } from '@/lib/utils/relativeTime';

const COLOR_FILL_CLASS: Record<string, string> = {
  Blue: 'bg-blue-500',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  White: 'bg-slate-300',
  Purple: 'bg-purple-500',
  Colorless: 'bg-slate-500',
};

export default function HomePage(): JSX.Element {
  const decks = getDecks();
  const events = getEvents();
  const allArchetypes = rankArchetypes(events);
  const normalizedArchetypes = allArchetypes
    .map((record) => ({
      ...record,
      archetype: record.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified'),
    }))
    .slice(0, 6);
  const trendingDecks = rankTrendingDecks(decks, events, 6);
  const colorDistribution = getColorDistribution(events, decks);
  const latestEventDate = events[0]?.date ?? null;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_520px_at_20%_-10%,hsl(var(--accent)/0.24),transparent_72%),linear-gradient(120deg,hsl(var(--accent)/0.08),transparent_45%)]" />
        <Container className="relative grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge variant="status">Gundam Forge</Badge>
            <h1 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight text-foreground md:text-5xl">
              Build. Test. Win.
            </h1>
            <p className="max-w-reading text-sm text-text-secondary md:text-base">
              Competitive deck-building for Gundam Card Game. Browse the card pool, build in Forge, and validate faster with consistent tools.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" variant="primary">
                <Link href="/forge">Create Deck</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/cards">Browse Cards</Link>
              </Button>
            </div>
          </div>

          <Card className="bg-surface-elevated/90">
            <CardHeader>
              <CardTitle>Meta Snapshot</CardTitle>
              <CardDescription>Current data footprint across decks, cards, and events.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <StatCard label="Decks Indexed" value={decks.length} />
              <StatCard label="Cards in Pool" value={cards.length} />
              <StatCard label="Events Tracked" value={events.length} hint={latestEventDate ? `Updated ${latestEventDate}` : undefined} />
              <StatCard label="Archetypes" value={allArchetypes.length} />
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-8">
        <Container className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-semibold">Trending Decks</h2>
            <Button asChild size="sm" variant="secondary">
              <Link href="/decks">See all decks</Link>
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
                archetype: deck.archetype.replace(/Rogue\s*\/\s*Other|Other/gi, 'Unclassified'),
                tags: [],
                avatarUrl: undefined,
                updatedAgo: relativeTime(deck.updatedAt),
              } satisfies TrendingDeckData;
            })}
          />
        </Container>
      </section>

      <section className="pb-12">
        <Container className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>Latest tournament outcomes feeding the ranking engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.slice(0, 4).map((event) => (
                <ListItem
                  key={event.id}
                  meta={`${event.date} • ${event.location}`}
                  title={event.name}
                  action={<Badge size="sm">#{event.placements[0]?.placement ?? '-'} place</Badge>}
                />
              ))}
              <Button asChild className="w-full" variant="secondary">
                <Link href="/events">View Events</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Archetypes</CardTitle>
                <CardDescription>Meta share and win rate across tracked events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {normalizedArchetypes.map((record) => (
                  <div key={record.archetype} className="space-y-2 rounded-md border border-border bg-surface-interactive px-4 py-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{record.archetype}</span>
                      <Badge size="sm" variant="status">{record.topThree} top 3</Badge>
                    </div>
                    <ProgressBar label="Meta Share" value={record.metaShare * 100} colorClassName="bg-accent" />
                    <p className="text-xs text-text-muted">Win rate {(record.winRate * 100).toFixed(1)}%</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Color Distribution</CardTitle>
                <CardDescription>Share of top-placing deck colors.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {colorDistribution.map(({ color, share }) => (
                  <ProgressBar key={color} label={color} value={share * 100} colorClassName={COLOR_FILL_CLASS[color] ?? 'bg-slate-500'} />
                ))}
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
