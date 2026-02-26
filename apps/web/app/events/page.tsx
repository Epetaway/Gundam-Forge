import Link from 'next/link';
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
        description="Tournament tracking with event placements, linked decklists, and archetype meta impact."
        eyebrow="Events"
        title="Tournament Results"
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{event.name}</CardTitle>
                  <Badge>{event.date}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-steel-600">
                  <p>{event.location} • {event.playerCount} players • {event.format}</p>
                </div>
                <ul className="space-y-2">
                  {event.placements.map((placement) => (
                    <li className="flex items-center justify-between rounded-md border border-border bg-steel-50 px-3 py-2" key={`${event.id}:${placement.placement}`}>
                      <div className="text-sm">
                        <p className="font-semibold">#{placement.placement} {placement.player}</p>
                        <p className="text-xs text-steel-600">{placement.deckName} • {placement.archetype}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="accent">{placement.wins}-{placement.losses}-{placement.draws}</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archetype Meta Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archetypeMeta.map((record) => (
              <div className="rounded-md border border-border bg-steel-50 px-3 py-2" key={record.archetype}>
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">{record.archetype}</p>
                  <Badge variant="accent">{record.topThree} top 3</Badge>
                </div>
                <p className="text-xs text-steel-600">
                  {record.placements} tracked placements • {(record.winRate * 100).toFixed(1)}% win rate
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </Container>
  );
}
