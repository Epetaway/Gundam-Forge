import Link from 'next/link';
import { MapPin, Medal, ShieldAlert, Sword, Trophy } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getEvents } from '@/lib/data/events';
import { rankArchetypes } from '@/lib/meta/engine';

export default function EventsPage(): JSX.Element {
  const events = getEvents();
  const archetypeMeta = rankArchetypes(events).slice(0, 5);

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Tournament command board with placements, archetype pressure, and win-rate heat."
        eyebrow="Events"
        title="Tournament Results"
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-3">
          {events.map((event) => (
            <Card className="overflow-hidden border-steel-400 bg-surface-elevated" key={event.id}>
              <div className="flex items-center justify-between border-b border-border bg-[linear-gradient(120deg,rgba(59,130,246,0.2),transparent_65%)] px-4 py-2 text-xs text-steel-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-cobalt-300" />
                  {event.location}
                </span>
                <span>{event.playerCount} pilots • {event.format}</span>
              </div>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{event.name}</CardTitle>
                  <Badge>{event.date}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {event.placements.map((placement) => (
                    <li
                      className={`flex items-center justify-between rounded-md border px-3 py-2 ${getPlacementTone(placement.placement)}`}
                      key={`${event.id}:${placement.placement}`}
                    >
                      <div className="text-sm">
                        <p className="flex items-center gap-1 font-semibold">
                          {placement.placement <= 3 ? <Medal className="h-4 w-4 text-amber-300" /> : <Trophy className="h-4 w-4 text-steel-500" />}
                          #{placement.placement} {placement.player}
                        </p>
                        <p className="text-xs text-steel-600">{placement.deckName} • {placement.archetype}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="accent">{placement.wins}-{placement.losses}-{placement.draws}</Badge>
                        <span className={`text-xs font-semibold ${getWinRateTone(placement.wins, placement.losses, placement.draws)}`}>
                          {formatMatchWinRate(placement.wins, placement.losses, placement.draws)}
                        </span>
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/decks/${placement.deckId}`}>Deck</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sword className="h-4 w-4 text-cobalt-300" />
              Archetype Meta Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archetypeMeta.map((record) => (
              <div className="rounded-md border border-border bg-surface-interactive px-3 py-2" key={record.archetype}>
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">{record.archetype}</p>
                  <Badge variant="accent">{record.topThree} top 3</Badge>
                </div>
                <p className={`text-xs ${getMetaWinRateTone(record.winRate)}`}>
                  {record.placements} tracked placements • {(record.winRate * 100).toFixed(1)}% win rate
                </p>
              </div>
            ))}
            <div className="rounded-md border border-border bg-surface-interactive px-3 py-2 text-xs text-steel-600">
              <p className="inline-flex items-center gap-1 font-semibold text-amber-300">
                <ShieldAlert className="h-4 w-4" />
                Meta pressure updates after each event sync.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </Container>
  );
}

function getPlacementTone(placement: number): string {
  if (placement === 1) return 'border-amber-400/50 bg-amber-400/10';
  if (placement === 2) return 'border-steel-500/60 bg-steel-200';
  if (placement === 3) return 'border-orange-400/50 bg-orange-500/10';
  return 'border-border bg-surface-interactive';
}

function formatMatchWinRate(wins: number, losses: number, draws: number): string {
  const total = wins + losses + draws;
  if (total === 0) return '0.0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
}

function getWinRateTone(wins: number, losses: number, draws: number): string {
  const total = wins + losses + draws;
  if (total === 0) return 'text-steel-500';
  const winRate = wins / total;
  if (winRate >= 0.8) return 'text-emerald-300';
  if (winRate >= 0.7) return 'text-amber-300';
  return 'text-red-300';
}

function getMetaWinRateTone(winRate: number): string {
  if (winRate >= 0.8) return 'text-emerald-300';
  if (winRate >= 0.7) return 'text-amber-300';
  return 'text-red-300';
}
