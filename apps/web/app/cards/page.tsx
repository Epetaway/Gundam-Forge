import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { allSets, getCards, getCardImage } from '@/lib/data/cards';
import type { CardColor, CardType } from '@gundam-forge/shared';

interface CardsPageProps {
  searchParams: {
    q?: string;
    color?: string;
    type?: string;
    set?: string;
  };
}

export default function CardsPage({ searchParams }: CardsPageProps): JSX.Element {
  const query = searchParams.q ?? '';
  const color = searchParams.color ?? 'All';
  const type = searchParams.type ?? 'All';
  const set = searchParams.set ?? 'All';

  const filtered = getCards({
    query,
    color: color as CardColor | 'All',
    type: type as CardType | 'All',
    set,
  });

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Server-rendered filtering for fast first load and low client bundle cost."
        eyebrow="Catalog"
        title="Card Database"
      />

      <Card>
        <CardContent className="py-4">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]" method="get">
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Search
              <input
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                name="q"
                placeholder="Card name or ID"
                defaultValue={query}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Color
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" defaultValue={color} name="color">
                {['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Type
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" defaultValue={type} name="type">
                {['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Set
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" defaultValue={set} name="set">
                <option value="All">All</option>
                {allSets.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button size="sm" type="submit" variant="primary">Apply</Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/cards">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-steel-600">{filtered.length} cards matched</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.slice(0, 150).map((card) => (
          <Card className="overflow-hidden" key={card.id}>
            <div className="relative aspect-[5/7] bg-steel-100">
              <Image
                alt={card.name}
                className="h-full w-full object-cover"
                height={840}
                src={getCardImage(card)}
                width={600}
              />
            </div>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">{card.name}</p>
                <Badge>{card.cost}</Badge>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-steel-500">{card.id}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="accent">{card.color}</Badge>
                <Badge>{card.type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
