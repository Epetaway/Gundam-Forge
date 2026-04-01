'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '@/lib/utils/cn';
import type { DeckViewRendererProps } from '@/components/deck/types';
import type { DeckViewItem } from '@/lib/deck/sortFilter';

function CardHoverPreview({ item, anchor }: { item: DeckViewItem; anchor: DOMRect }) {
  const CARD_W = 168;
  const GAP = 12;

  const left =
    anchor.left - CARD_W - GAP < 8
      ? anchor.right + GAP
      : anchor.left - CARD_W - GAP;

  const rawTop = anchor.top + anchor.height / 2 - 120;
  const top = Math.max(8, Math.min(rawTop, window.innerHeight - 260));

  const content = (
    <div
      className="pointer-events-none fixed z-[300] w-[168px] overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10"
      style={{ left, top }}
    >
      {item.imageUrl || item.placeholderArt ? (
        <img
          src={item.imageUrl ?? item.placeholderArt}
          alt={item.name}
          className="w-full"
          draggable={false}
        />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center gap-1 bg-surface-interactive p-3 text-center">
          <p className="text-xs font-semibold leading-tight text-foreground">{item.name}</p>
          {item.typeLine && <p className="text-[10px] text-text-muted">{item.typeLine}</p>}
          {item.ap !== undefined && (
            <p className="text-[10px] text-text-muted">
              AP {item.ap} / HP {item.hp}
            </p>
          )}
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}

export function TextListView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  const [hovered, setHovered] = React.useState<{ item: DeckViewItem; anchor: DOMRect } | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cobalt-900/65 p-10 text-center text-sm text-text-muted">
        No cards match your filters.
      </p>
    );
  }

  return (
    <>
      {hovered && typeof document !== 'undefined' && (
        <CardHoverPreview item={hovered.item} anchor={hovered.anchor} />
      )}
      <div className="overflow-x-auto rounded-md border border-cobalt-900/65 bg-surface">
        <table className="w-full text-left">
          <thead className="border-b border-cobalt-900/65 bg-surface-interactive text-[11px] uppercase tracking-[0.12em] text-text-muted">
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
                    'group cursor-pointer border-b border-cobalt-900/55 text-sm transition-colors hover:bg-surface-interactive',
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
