'use client';

import { cn } from '@/lib/utils/cn';
import type { DeckViewRendererProps } from '@/components/deck/types';

export function TextListView({ items, selection, actions, ui }: DeckViewRendererProps): JSX.Element {
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-steel-600">No cards match your filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface">
      <table className="w-full text-left">
        <thead className="border-b border-border bg-surface-interactive text-[11px] uppercase tracking-[0.12em] text-steel-600">
          <tr>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Card</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Cost</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const active = selection.activeCardId === item.id;
            return (
              <tr
                className={cn(
                  'cursor-pointer border-b border-border/70 text-sm hover:bg-surface-interactive',
                  ui.density === 'compact' ? 'h-10' : 'h-12',
                  active ? 'bg-surface-interactive' : '',
                )}
                key={item.id}
                onClick={() => actions.onOpenCard(item.id)}
              >
                <td className="px-3 py-2 font-mono font-semibold text-steel-700">x{item.qty}</td>
                <td className="px-3 py-2">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-steel-600">{item.id}</p>
                </td>
                <td className="px-3 py-2 text-steel-700">{item.typeLine}</td>
                <td className="px-3 py-2 font-mono text-steel-700">{item.cmc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
