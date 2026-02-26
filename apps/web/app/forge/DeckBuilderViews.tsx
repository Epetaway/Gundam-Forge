import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { CardPreviewTile } from '@/components/deck/CardPreviewTile';

// DeckCard model
export interface DeckCard {
  id: string;
  name: string;
  imageUrl?: string;
  qty: number;
  setId?: string;
  type?: string;
  cost?: number;
  color?: string;
  text?: string;
  tags?: string[];
}

// Adapter: CardDefinition | ForgeCard -> DeckCard
export function toDeckCard(card: any, qty: number = 1): DeckCard {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    qty,
    setId: card.set ?? card.setId,
    type: card.type,
    cost: typeof card.cost === 'number' ? card.cost : Number(card.cost) || 0,
    color: card.color,
    text: card.text,
    tags: card.tags,
  };
}

// Grouping helpers
export function groupByType(cards: DeckCard[]) {
  const groups: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const key = card.type || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }
  return groups;
}
export function groupByCost(cards: DeckCard[]) {
  const groups: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const key = String(card.cost ?? '0');
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }
  return groups;
}
export function groupByColor(cards: DeckCard[]) {
  const groups: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const key = card.color || 'Colorless';
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }
  return groups;
}
export function groupByTag(cards: DeckCard[]) {
  // Placeholder: assumes card.tags is array of strings
  const groups: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const tags = card.tags || ['Untagged'];
    for (const tag of tags) {
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(card);
    }
  }
  return groups;
}

// GridView
export function GridView({ cards, density, onOpenCard }: DeckViewProps) {
  // TODO: Wire up onAdd/onRemove for builder controls if needed
  return (
    <div className={cn(
      'grid',
      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      density === 'compact' ? 'gap-2' : 'gap-4',
    )}>
      {cards.map(card => (
        <div
          key={card.id}
          className="group relative rounded-md border border-border bg-black overflow-hidden focus:outline-none"
        >
          <button
            className="block w-full"
            onClick={() => onOpenCard(card.id)}
            tabIndex={0}
            aria-label={`Open ${card.name}`}
          >
            {card.imageUrl && (
              <img src={card.imageUrl} alt={card.name} className="aspect-[5/7] w-full object-cover" />
            )}
            {card.qty > 1 && (
              <span className="absolute left-2 top-2 z-10 rounded bg-black/80 px-2 py-0.5 font-mono text-xs font-bold text-white shadow">x{card.qty}</span>
            )}
          </button>
          {/* Builder controls: show on hover (desktop) */}
          <div className="absolute bottom-2 right-2 z-20 flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="mb-1 rounded bg-cobalt-600 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-cobalt-700" title="Add one">+</button>
            <button className="rounded bg-steel-700 px-2 py-0.5 text-xs font-bold text-white shadow hover:bg-steel-800" title="Remove one">–</button>
          </div>
          <div className="pt-1 px-1">
            <p className="truncate text-xs font-semibold text-foreground">{card.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// StacksView
import { groupDeckItemsByType } from '@/lib/deck/grouping';
import { CardArtImage } from '@/components/ui/CardArtImage';

export function StacksView({ cards, density, onOpenCard, groupBy }: DeckViewProps & { groupBy: string }) {
  // Adapt DeckCard[] to DeckViewItem[] for grouping
  const items = cards.map(card => ({
    id: card.id,
    name: card.name,
    imageUrl: card.imageUrl,
    typeLine: card.type || '',
    cost: card.cost,
    cmc: typeof card.cost === 'number' ? card.cost : Number(card.cost) || 0,
    text: card.text,
    qty: card.qty,
    color: card.color,
    set: card.setId,
  }));
  const stacks = groupDeckItemsByType(items);

  if (stacks.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">No cards match your filters.</p>;
  }

  // Horizontal scrollable flex row of columns
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stacks.map((stack) => (
        <section
          className="min-w-[220px] max-w-[260px] flex-shrink-0 rounded-md border border-border bg-surface-muted/70 shadow-sm"
          key={stack.id}
        >
          <header className="sticky top-0 z-10 flex flex-col gap-0.5 border-b border-border bg-surface-muted/90 px-3 py-2 backdrop-blur">
            <h3 className="text-base font-bold text-foreground truncate" title={stack.label}>{stack.label}</h3>
            <span className="text-xs text-steel-600">{stack.totalQty} cards</span>
          </header>
          <ul className={cn('flex flex-col gap-2 p-2', density === 'compact' ? 'gap-1' : '')}>
            {stack.cards.map((item) => (
              <li key={item.id}>
                <CardPreviewTile
                  imageUrl={item.imageUrl}
                  name={item.name}
                  qty={item.qty}
                  onClick={() => onOpenCard(item.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// TextView
export function TextView({ cards, density, onOpenCard }: DeckViewProps) {
  return (
    <ul className={cn('divide-y divide-border', density === 'compact' ? 'text-xs' : 'text-sm')}>
      {cards.map(card => (
        <li key={card.id}>
          <button className="w-full flex items-center gap-2 px-2 py-1 hover:bg-surface-interactive rounded" onClick={() => onOpenCard(card.id)}>
            <span className="font-mono text-xs text-steel-700">{card.qty}x</span>
            <span className="font-medium truncate flex-1">{card.name}</span>
            {density !== 'compact' && (
              <span className="text-steel-600 text-xs">{[card.setId, card.type, card.cost].filter(Boolean).join(' • ')}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

// TableView
export function TableView({ cards, density, onOpenCard, sortKey, sortDir, onSort }: DeckViewProps & { sortKey: string, sortDir: string, onSort: (key: string) => void }) {
  const columns = [
    { key: 'qty', label: 'Qty' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'cost', label: 'Cost' },
    { key: 'color', label: 'Color' },
    { key: 'setId', label: 'Set' },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead className="sticky top-0 bg-surface z-10">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-2 py-2 text-xs font-semibold text-left cursor-pointer select-none border-b border-border"
                onClick={() => onSort(col.key)}
              >
                {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.map(card => (
            <tr key={card.id} className="hover:bg-surface-interactive cursor-pointer" onClick={() => onOpenCard(card.id)}>
              <td className="px-2 py-1 font-mono text-xs">{card.qty}</td>
              <td className="px-2 py-1 font-medium truncate max-w-[120px]">{card.name}</td>
              <td className="px-2 py-1 text-xs">{card.type}</td>
              <td className="px-2 py-1 text-xs">{card.cost}</td>
              <td className="px-2 py-1 text-xs">{card.color}</td>
              <td className="px-2 py-1 text-xs">{card.setId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Shared props
export interface DeckViewProps {
  cards: DeckCard[];
  density: 'comfortable' | 'compact';
  onOpenCard: (cardId: string) => void;
}
