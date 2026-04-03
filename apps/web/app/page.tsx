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
import { rankArchetypes, rankTrendingDecks, getColorDistribution } from '@/lib/meta/engine';
import { relativeTime } from '@/lib/utils/relativeTime';

export default function HomePage(): JSX.Element {
  const decks = getDecks();
  const events = getEvents();
  const allArchetypes = rankArchetypes(events);
  const trendingDecks = rankTrendingDecks(decks, events, 6);
  const archetypes = allArchetypes.slice(0, 6);
  const colorDistribution = getColorDistribution(events, decks);
  const latestEventDate = events[0]?.date ?? null;
  // Map archetype name → tournament deck ID for "View Deck" links
  const tournamentDeckByArchetype = new Map<string, string>(
    decks
      .filter((d) => d.source === 'tournament')
      .map((d) => [d.archetype, d.id]),
  );
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
            <p className="max-w-[62ch] text-base text-text-secondary">
              Competitive deck-building for Gundam Card Game. Browse the full card pool, craft your list in the Forge, and validate it against official rules — all in one command interface.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" variant="primary">
                <Link href="/forge">+ Create Deck</Link>
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
                  <span className="flex-shrink-0 rounded border border-border bg-surface-interactive px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    Latest: {latestEventDate}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Decks Indexed" value={`${decks.length}`} hint="Growing weekly" />
                <Stat label="Cards in Pool" value={`${cards.length}`} />
                <Stat label="Events Tracked" value={`${events.length}`} hint={latestEventDate ? `Last updated ${latestEventDate}` : undefined} />
                <Stat label="Archetypes" value={`${allArchetypes.length}`} />
              </div>
              <p className="text-[11px] text-text-muted">
                Data updated with each build deployment.
              </p>
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <Card className="bg-surface-elevated border-cobalt-500/30">
            <CardHeader>
              <CardTitle>New to Gundam Forge?</CardTitle>
              <CardDescription>Three quick steps from card pool to match-ready deck.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border bg-surface-interactive p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cobalt-400">Step 1</p>
                <p className="mt-1 text-sm font-semibold">Browse Cards</p>
                <p className="mt-1 text-xs text-text-muted">Find legal units, pilots, and commands before committing to an archetype.</p>
              </div>
              <div className="rounded-md border border-border bg-surface-interactive p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cobalt-400">Step 2</p>
                <p className="mt-1 text-sm font-semibold">Build in Forge</p>
                <p className="mt-1 text-xs text-text-muted">Assemble a 50-card list with live validation and starter templates.</p>
              </div>
              <div className="rounded-md border border-border bg-surface-interactive p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-cobalt-400">Step 3</p>
                <p className="mt-1 text-sm font-semibold">Playtest & Compete</p>
                <p className="mt-1 text-xs text-text-muted">Test matchup flow, then compare your build against event-proven decks.</p>
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
                archetype: deck.archetype,
                tags: [],
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
                  <Link href="/decks?action=playtest">Choose a Deck →</Link>
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
                  <span className="flex-shrink-0 rounded border border-border bg-surface-interactive px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
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
                  <p className="text-xs text-text-muted">
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
                <CardTitle>Archetype Standings</CardTitle>
                <CardDescription>Meta share across all tracked events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {archetypes.map((record, idx) => {
                  const deckId = tournamentDeckByArchetype.get(record.archetype);
                  return (
                  <div className="rounded-md border border-border bg-surface-interactive px-3 py-2.5" key={record.archetype}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] tabular-nums text-text-muted w-4 shrink-0">#{idx + 1}</span>
                        <p
                          className="text-sm font-semibold truncate"
                          title={record.archetype === 'Rogue / Unclassified' ? 'Decks that don\'t fit established archetypes' : undefined}
                        >
                          {record.archetype}
                        </p>
                        <ArchetypeBadge archetype={record.archetype} />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {deckId && (
                          <Link
                            href={`/decks/${deckId}`}
                            className="font-mono text-[10px] text-cobalt-400 hover:text-cobalt-300 transition-colors"
                          >
                            View Deck →
                          </Link>
                        )}
                        <Badge variant="accent" className="text-[10px]">{record.topThree} top 3</Badge>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-surface-muted overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full bg-cobalt-500"
                        style={{ width: `${(record.metaShare * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>{(record.metaShare * 100).toFixed(1)}% meta share</span>
                      <span>{(record.winRate * 100).toFixed(1)}% win rate</span>
                    </div>
                  </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-surface-elevated">
              <CardHeader>
                <CardTitle>Color Distribution</CardTitle>
                <CardDescription>Among tournament-placing decks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {colorDistribution.map(({ color, share }) => (
                  <div key={color}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: CARD_COLOR_HEX[color] ?? '#9aa9bf' }}
                        />
                        <span className="text-text-secondary">{color}</span>
                      </span>
                      <span className="font-mono text-text-muted">{(share * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(share * 100).toFixed(1)}%`, backgroundColor: CARD_COLOR_HEX[color] ?? '#9aa9bf' }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div className="rounded-md border border-border bg-surface-interactive px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-text-muted">{hint}</p> : null}
    </div>
  );
}

const ARCHETYPE_TYPE_STYLES: Array<[RegExp, string]> = [
  [/aggro|rush|beatdown|blitz/i, 'bg-red-500/15 text-red-400 border-red-500/20'],
  [/control|wall|lockdown/i, 'bg-cobalt-600/20 text-cobalt-400 border-cobalt-500/20'],
  [/midrange|tempo/i, 'bg-green-500/15 text-green-400 border-green-500/20'],
  [/ramp|resource/i, 'bg-green-500/15 text-green-400 border-green-500/20'],
  [/combo|link|pair/i, 'bg-amber-500/15 text-amber-400 border-amber-500/20'],
  [/burn/i, 'bg-red-500/15 text-red-400 border-red-500/20'],
  [/toolbox|toolkit/i, 'bg-steel-400/15 text-steel-600 border-steel-400/20'],
  [/rogue|unclassified/i, 'bg-steel-400/15 text-steel-500 border-steel-400/20'],
];

function detectArchetypeType(name: string): string {
  for (const [re, cls] of ARCHETYPE_TYPE_STYLES) {
    if (re.test(name)) return cls;
  }
  return 'bg-steel-400/15 text-steel-600 border-steel-400/20';
}

// Short label: last word of the deck name, or whole name if one word
function archetypeLabel(name: string): string {
  const parts = name.split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

function ArchetypeBadge({ archetype }: { archetype: string }): JSX.Element {
  const cls = detectArchetypeType(archetype);
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px font-mono text-[9px] uppercase tracking-wider ${cls}`}>
      {archetypeLabel(archetype)}
    </span>
  );
}

const CARD_COLOR_HEX: Record<string, string> = {
  Blue: '#4c90fa',
  Green: '#34d399',
  Red: '#f87171',
  White: '#d5ddeb',
  Purple: '#a78bfa',
  Colorless: '#9aa9bf',
};
