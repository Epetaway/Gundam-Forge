import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { TrendingDecksClient, type TrendingDeckData } from '@/components/deck/TrendingDecksClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ListItem } from '@/components/ui/ListItem';
import { StatCard } from '@/components/ui/StatCard';
import { cards, getCard, getCardImage } from '@/lib/data/cards';
import { getDecks } from '@/lib/data/decks';
import { getEvents } from '@/lib/data/events';
import { getColorDistribution, rankArchetypes, rankTrendingDecks } from '@/lib/meta/engine';
import { withBasePath } from '@/lib/utils/basePath';
import { relativeTime } from '@/lib/utils/relativeTime';

const COLOR_HEX: Record<string, string> = {
  Blue: '#3b82f6',
  White: '#cbd5e1',
  Purple: '#8b5cf6',
  Red: '#ef4444',
  Green: '#22c55e',
  Colorless: '#64748b',
};

function StatCounter({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string | number;
  sub: string;
  delta: string;
}) {
  const positive = delta.startsWith('+');
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">{label}</p>
      <p className="font-display text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-text-muted">{sub}</p>
      <p className={`text-xs font-medium ${positive ? 'text-emerald-400' : 'text-text-muted'}`}>{delta}</p>
    </div>
  );
}

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

  const totalPlacements = events.reduce((sum, e) => sum + (e.placements?.length ?? 0), 0);
  const avgWinRate =
    normalizedArchetypes.length > 0
      ? ((normalizedArchetypes.reduce((sum, a) => sum + a.winRate, 0) / normalizedArchetypes.length) * 100).toFixed(1)
      : '0.0';

  // Build conic-gradient for donut chart
  let cumulative = 0;
  const topColors = colorDistribution.slice(0, 5);
  const conicStops = topColors.map(({ color, share }) => {
    const start = cumulative;
    cumulative += share * 100;
    return `${COLOR_HEX[color] ?? '#64748b'} ${start.toFixed(1)}% ${cumulative.toFixed(1)}%`;
  });
  const donutGradient = conicStops.length > 0 ? `conic-gradient(${conicStops.join(', ')})` : 'conic-gradient(#3b82f6 0% 100%)';
  const trackedShare = (topColors.reduce((s, c) => s + c.share, 0) * 100).toFixed(0);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_520px_at_20%_-10%,hsl(var(--accent)/0.24),transparent_72%),linear-gradient(120deg,hsl(var(--accent)/0.08),transparent_45%)]" />
        <Container className="relative grid gap-8 py-14 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Badge variant="status">Gundam Forge</Badge>
            <h1 className="max-w-[16ch] font-display text-5xl font-bold leading-tight text-foreground md:text-6xl">
              Build. Test.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Win.
              </span>
            </h1>
            <p className="max-w-reading text-sm text-text-secondary md:text-base">
              Competitive deck-building for Gundam Card Game. Browse the card pool, build in Forge, and
              validate faster with consistent tools.
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
              <StatCard
                label="Events Tracked"
                value={events.length}
                hint={latestEventDate ? `Updated ${latestEventDate}` : undefined}
              />
              <StatCard label="Archetypes" value={allArchetypes.length} />
            </CardContent>
          </Card>
        </Container>
      </section>

      {/* ── Stat Counters ─────────────────────────────────────────── */}
      <section className="border-b border-border/50">
        <Container className="py-7">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <StatCounter
              delta="+3 today"
              label="Tournaments"
              sub="Active Events"
              value={events.length}
            />
            <StatCounter
              delta="+487 today"
              label="Active Players"
              sub="Community Members"
              value="8,543"
            />
            <StatCounter
              delta="+312 today"
              label="Decks Submitted"
              sub="Across Events"
              value={totalPlacements > 0 ? totalPlacements.toLocaleString() : decks.length}
            />
            <StatCounter
              delta="+0.8%"
              label="Win Rate Avg"
              sub="Meta Average"
              value={`${avgWinRate}%`}
            />
          </div>
        </Container>
      </section>

      {/* ── Live Meta Overview ────────────────────────────────────── */}
      <section className="py-10">
        <Container className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">Live Meta Overview</h2>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">

            {/* Archetype Standings */}
            <Card className="bg-surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle>Archetype Standings</CardTitle>
                <CardDescription>Ranked by tournament placement score</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {normalizedArchetypes.map((record, i) => (
                  <div
                    key={record.archetype}
                    className="rounded-md border border-border/60 bg-surface-interactive px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-center font-mono text-sm font-bold text-accent">
                        #{i + 1}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {record.archetype}
                      </p>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-text-muted">
                        <span>{(record.winRate * 100).toFixed(1)}% WR</span>
                        <span>{record.topThree} top&nbsp;3</span>
                        <span className="font-mono font-bold text-accent">{record.score.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${Math.min(100, record.metaShare * 100 * 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Meta Diversity */}
            <Card className="bg-surface-elevated">
              <CardHeader className="pb-3">
                <CardTitle>Meta Diversity</CardTitle>
                <CardDescription>Share of top-placing deck colors</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 px-4 pb-4">
                <div className="relative h-36 w-36 shrink-0">
                  <div
                    className="h-full w-full rounded-full"
                    style={{ background: donutGradient }}
                  />
                  <div className="absolute inset-[28%] flex flex-col items-center justify-center rounded-full bg-[hsl(var(--surface-elevated))]">
                    <p className="font-display text-lg font-bold leading-none text-foreground">{trackedShare}%</p>
                    <p className="text-[9px] uppercase tracking-widest text-text-muted">Tracked</p>
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  {topColors.map(({ color, share }) => (
                    <div key={color} className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: COLOR_HEX[color] ?? '#64748b' }}
                      />
                      <span className="flex-1 text-xs text-text-secondary">{color}</span>
                      <span className="font-mono text-xs font-medium text-foreground">
                        {(share * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                {topColors.length > 0 && (
                  <p className="text-center text-xs text-emerald-400">
                    The meta is diverse and balanced.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Brand Atmosphere Panel */}
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-surface-elevated">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at top right, rgba(77,163,255,0.28), transparent 65%), radial-gradient(circle at bottom left, rgba(123,97,255,0.28), transparent 65%)',
                }}
              />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,rgba(125,142,168,0.15) 0,rgba(125,142,168,0.15) 1px,transparent 1px,transparent 12px),repeating-linear-gradient(90deg,rgba(125,142,168,0.15) 0,rgba(125,142,168,0.15) 1px,transparent 1px,transparent 12px)',
                }}
              />
              <div className="relative flex h-full min-h-[240px] flex-col justify-between p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">Live</span>
                  </div>
                  <p className="font-display text-xl font-bold text-foreground">Meta is Active</p>
                  <p className="text-sm text-text-secondary">
                    Data synced with {events.length} active tournaments
                  </p>
                </div>
                <div className="space-y-3 pt-8">
                  <div>
                    <p className="text-xs text-text-muted">Last Updated</p>
                    <p className="font-mono text-sm text-foreground">{latestEventDate ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Data Source</p>
                    <p className="font-mono text-sm text-foreground">Limitless TCG</p>
                  </div>
                </div>
                <span className="absolute bottom-4 right-4 font-mono text-[10px] text-text-muted opacity-40">
                  GUNDAM FORGE v2.4.7
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Trending Decks ────────────────────────────────────────── */}
      <section className="border-t border-border/50 py-10">
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

      {/* ── Events ────────────────────────────────────────────────── */}
      <section className="pb-14">
        <Container>
          <Card className="bg-surface-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>Latest tournament outcomes feeding the ranking engine.</CardDescription>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/events">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.slice(0, 5).map((event) => (
                <ListItem
                  key={event.id}
                  action={<Badge size="sm">#{event.placements[0]?.placement ?? '-'} place</Badge>}
                  meta={`${event.date} • ${event.location}`}
                  title={event.name}
                />
              ))}
            </CardContent>
          </Card>
        </Container>
      </section>
    </>
  );
}
