'use client';

import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';
import type { DeckViewRendererProps } from '@/components/deck/types';

export function ImageGridView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">No cards match your filters.</p>;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        ui.density === 'compact' ? 'gap-2' : 'gap-3',
      )}
    >
      {items.map((item) => {
        const active = selection.activeCardId === item.id;
        return (
          <button
            aria-label={`Open ${item.name}`}
            className={cn(
              'group text-left',
              active ? 'rounded-md ring-2 ring-cobalt-400/70' : '',
            )}
            key={item.id}
            onClick={() => actions.onOpenCard(item.id)}
            type="button"
          >
            <div className="relative overflow-hidden rounded-md border border-border bg-black transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-lg">
              <div className="relative aspect-[5/7] w-full">
                <CardArtImage
                  card={item}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 20vw, 16vw"
                />
              </div>
              <span className="pointer-events-none absolute left-2 top-2 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                x{item.qty}
              </span>
            </div>
            <div className={cn('pt-1', ui.density === 'compact' ? 'space-y-0' : 'space-y-0.5')}>
              <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
              <p className="truncate text-[10px] text-steel-600">
                {item.typeLine} · Cost {item.cmc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
