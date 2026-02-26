'use client';

import { groupDeckItemsByType } from '@/lib/deck/grouping';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';
import type { DeckViewRendererProps } from '@/components/deck/types';

export function StacksView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  const stacks = groupDeckItemsByType(items);

  if (stacks.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">No cards match your filters.</p>;
  }

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {stacks.map((stack) => (
        <section className="rounded-md border border-border bg-surface-muted/70" key={stack.id}>
          <header className="flex items-center justify-between border-b border-border px-3 py-2">
            <h3 className="text-sm font-semibold text-foreground">{stack.label}</h3>
            <span className="text-xs text-steel-600">{stack.totalQty} cards</span>
          </header>
          <ul className={cn('space-y-1 p-2', ui.density === 'compact' ? '' : 'space-y-1.5')}>
            {stack.cards.map((item) => {
              const active = selection.activeCardId === item.id;
              return (
                <li key={item.id}>
                  <button
                    aria-label={`Open ${item.name}`}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border border-transparent bg-surface px-2 py-1.5 text-left transition-colors hover:border-cobalt-400/40 hover:bg-surface-interactive',
                      active ? 'border-cobalt-400/70 bg-surface-interactive' : '',
                    )}
                    onClick={() => actions.onOpenCard(item.id)}
                    type="button"
                  >
                    <div className="relative h-12 w-8 overflow-hidden rounded-[3px] border border-border bg-black">
                      <CardArtImage
                        card={item}
                        className="h-full w-full object-cover"
                        fill
                        sizes="32px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="truncate text-[10px] text-steel-600">Cost {item.cmc}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-steel-700">x{item.qty}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
