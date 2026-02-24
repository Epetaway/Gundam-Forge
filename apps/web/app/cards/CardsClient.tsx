"use client";
import { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { allSets, getCards, getCardImage } from '@/lib/data/cards';
import type { CardColor, CardType } from '@gundam-forge/shared';
import Image from 'next/image';

export default function CardsClient() {
  const [query, setQuery] = useState('');
  const [color, setColor] = useState<CardColor | 'All'>('All');
  const [type, setType] = useState<CardType | 'All'>('All');
  const [set, setSet] = useState('All');

  const filtered = getCards({
    query,
    color,
    type,
    set,
  });

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Client-side filtering for static export compatibility."
        eyebrow="Catalog"
        title="Card Database"
      />
      <Card>
        <CardContent className="py-4">
          <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]" onSubmit={e => e.preventDefault()}>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Search
              <input
                className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
                name="q"
                placeholder="Card name or ID"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Color
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" value={color} name="color" onChange={e => setColor(e.target.value as CardColor | 'All')}>
                {['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Type
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" value={type} name="type" onChange={e => setType(e.target.value as CardType | 'All')}>
                {['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-steel-600">
              Set
              <select className="h-10 rounded-md border border-border bg-surface px-3 text-sm" value={set} name="set" onChange={e => setSet(e.target.value)}>
                <option value="All">All</option>
                {allSets.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button size="sm" type="button" variant="primary" onClick={() => { setQuery(''); setColor('All'); setType('All'); setSet('All'); }}>Reset</Button>
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
