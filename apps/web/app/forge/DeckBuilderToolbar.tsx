import * as React from 'react';
import { cn } from '@/lib/utils/cn';

const VIEW_OPTIONS = [
  { value: 'stacks', label: 'Stacks' },
  { value: 'grid', label: 'Grid' },
  { value: 'text', label: 'Text' },
  { value: 'table', label: 'Table' },
];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'cost', label: 'Cost' },
  { value: 'type', label: 'Type' },
  { value: 'set', label: 'Set' },
];
const GROUP_OPTIONS = [
  { value: 'type', label: 'Type' },
  { value: 'cost', label: 'Cost' },
  { value: 'color', label: 'Color' },
  { value: 'tag', label: 'Tag' },
];

export function DeckBuilderToolbar({
  state,
  setState,
}: {
  state: any;
  setState: (fn: (prev: any) => any) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border bg-surface-interactive px-3 py-2">
      {/* View as select */}
      <label className="flex flex-col text-xs font-semibold text-steel-600">
        View as
        <select
          className="rounded border border-border bg-surface px-2 py-1 text-sm"
          value={state.viewMode}
          onChange={e => setState(s => ({ ...s, viewMode: e.target.value }))}
        >
          {VIEW_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      {/* Search */}
      <label className="flex flex-col text-xs font-semibold text-steel-600">
        Search
        <input
          className="rounded border border-border bg-surface px-2 py-1 text-sm"
          value={state.query}
          onChange={e => setState(s => ({ ...s, query: e.target.value }))}
          placeholder="Search cards"
        />
      </label>
      {/* Sort select */}
      <label className="flex flex-col text-xs font-semibold text-steel-600">
        Sort by
        <select
          className="rounded border border-border bg-surface px-2 py-1 text-sm"
          value={state.sortKey}
          onChange={e => setState(s => ({ ...s, sortKey: e.target.value }))}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      {/* Sort direction toggle */}
      <button
        className={cn(
          'rounded border border-border bg-surface px-2 py-1 text-sm font-semibold',
          state.sortDir === 'asc' ? 'text-cobalt-500' : 'text-steel-700',
        )}
        onClick={() => setState(s => ({ ...s, sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' }))}
        type="button"
      >
        {state.sortDir === 'asc' ? '▲ Asc' : '▼ Desc'}
      </button>
      {/* Density toggle */}
      <button
        className={cn(
          'rounded border border-border bg-surface px-2 py-1 text-sm font-semibold',
          state.density === 'compact' ? 'text-cobalt-500' : 'text-steel-700',
        )}
        onClick={() => setState(s => ({ ...s, density: s.density === 'compact' ? 'comfortable' : 'compact' }))}
        type="button"
      >
        {state.density === 'compact' ? 'Compact' : 'Comfortable'}
      </button>
      {/* Group by select (only for stacks) */}
      {state.viewMode === 'stacks' && (
        <label className="flex flex-col text-xs font-semibold text-steel-600">
          Group by
          <select
            className="rounded border border-border bg-surface px-2 py-1 text-sm"
            value={state.groupBy}
            onChange={e => setState(s => ({ ...s, groupBy: e.target.value }))}
          >
            {GROUP_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
