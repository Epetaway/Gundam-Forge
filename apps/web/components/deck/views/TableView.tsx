import * as React from 'react';
import type { DeckViewRendererProps } from '../types';

export function TableView({ items, actions, ui }: DeckViewRendererProps): JSX.Element {
  const columns = [
    { key: 'qty', label: 'Qty' },
    { key: 'name', label: 'Name' },
    { key: 'typeLine', label: 'Type' },
    { key: 'cmc', label: 'Cost' },
    { key: 'color', label: 'Color' },
    { key: 'set', label: 'Set' },
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
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="hover:bg-surface-interactive cursor-pointer" onClick={() => actions.onOpenCard(item.id)}>
              <td className="px-2 py-1 font-mono text-xs">{item.qty}</td>
              <td className="px-2 py-1 font-medium truncate max-w-[120px]">{item.name}</td>
              <td className="px-2 py-1 text-xs">{item.typeLine}</td>
              <td className="px-2 py-1 text-xs">{item.cmc}</td>
              <td className="px-2 py-1 text-xs">{item.color}</td>
              <td className="px-2 py-1 text-xs">{item.set}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
