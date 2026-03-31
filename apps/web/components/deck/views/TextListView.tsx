'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { CardHoverPreview } from '@/components/cards/CardHoverPreview';
import type { DeckViewRendererProps } from '@/components/deck/types';
import type { DeckViewItem } from '@/lib/deck/sortFilter';
import type { CardDefinition } from '@gundam-forge/shared';

export function TextListView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  const [hovered, setHovered] = React.useState<{ item: DeckViewItem; anchor: DOMRect } | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-text-muted">
        No cards match your filters.
      </p>
    );
  }

  return (
    <>
      {hovered && typeof document !== 'undefined' && (
        <CardHoverPreview card={hovered.item as unknown as CardDefinition} anchor={hovered.anchor} width={168} />
      )}
      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-interactive text-[11px] uppercase tracking-[0.12em] text-text-muted">
            <tr>
              <th className="w-10 px-3 py-2">Qty</th>
              <th className="px-3 py-2">Card</th>
              <th className="hidden px-3 py-2 sm:table-cell">Type</th>
              <th className="hidden w-14 px-3 py-2 sm:table-cell">Cost</th>
              {ui.features.deckEdit && (
                <th className="w-16 px-3 py-2" />
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const active = selection.activeCardId === item.id;
              return (
                <tr
                  key={item.id}
                  className={cn(
                    'group cursor-pointer border-b border-border/70 text-sm transition-colors hover:bg-surface-interactive',
                    ui.density === 'compact' ? 'h-8' : 'h-10',
                    active && 'bg-surface-interactive',
                  )}
                  onClick={() => actions.onOpenCard(item.id)}
                  onMouseEnter={(e) =>
                    setHovered({ item, anchor: e.currentTarget.getBoundingClientRect() })
                  }
                  onMouseLeave={() => setHovered(null)}
                >
                  <td className="px-3 py-1.5 font-mono text-xs font-bold text-text-muted">
                    ×{item.qty}
                  </td>
                  <td className="px-3 py-1.5 font-medium text-foreground">{item.name}</td>
                  <td className="hidden px-3 py-1.5 text-xs text-text-muted sm:table-cell">
                    {item.typeLine}
                  </td>
                  <td className="hidden px-3 py-1.5 font-mono text-xs text-steel-600 sm:table-cell">
                    {item.cost ?? '—'}
                  </td>
                  {ui.features.deckEdit && (
                    <td className="px-2 py-1">
                      <span className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label={`Remove one ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded text-steel-500 hover:bg-red-900/30 hover:text-red-400 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.onRemove?.(item.id);
                          }}
                        >
                          –
                        </button>
                        <button
                          type="button"
                          aria-label={`Add one ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded text-steel-500 hover:bg-cobalt-900/30 hover:text-cobalt-400 font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.onAdd?.(item.id);
                          }}
                        >
                          +
                        </button>
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
