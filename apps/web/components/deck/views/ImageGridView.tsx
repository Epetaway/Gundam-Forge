'use client';

import { cn } from '@/lib/utils/cn';
import { CardTile } from '@/components/deck/CardTile';
import type { DeckViewRendererProps } from '@/components/deck/types';

export function ImageGridView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">
        No cards match your filters.
      </p>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        ui.density === 'compact' ? 'gap-2' : 'gap-3',
      )}
    >
      {items.map((item) => (
        <CardTile
          density={ui.density}
          isActive={selection.activeCardId === item.id}
          item={item}
          key={item.id}
          mode={ui.mode}
          onAdd={actions.onAdd ? () => actions.onAdd!(item.id) : undefined}
          onOpen={() => actions.onOpenCard(item.id)}
          onRemove={actions.onRemove ? () => actions.onRemove!(item.id) : undefined}
        />
      ))}
    </div>
  );
}
