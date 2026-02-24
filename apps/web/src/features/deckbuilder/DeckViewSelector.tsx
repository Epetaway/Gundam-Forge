import type { ReactNode } from 'react';

export type DeckView = 'list' | 'visual' | 'stats';

interface DeckViewSelectorProps {
  view: DeckView;
  onViewChange: (view: DeckView) => void;
}

const views: { id: DeckView; label: string; icon: ReactNode }[] = [
  {
    id: 'list',
    label: 'List',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'visual',
    label: 'Visual',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function DeckViewSelector({ view, onViewChange }: DeckViewSelectorProps) {
  return (
    <div className="flex gap-0.5 rounded-lg border border-gf-border bg-gf-light p-0.5">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onViewChange(v.id)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
            view === v.id
              ? 'bg-gf-blue text-white shadow-sm'
              : 'text-gf-text-secondary hover:text-gf-text hover:bg-gf-white'
          }`}
          aria-pressed={view === v.id}
        >
          {v.icon}
          {v.label}
        </button>
      ))}
    </div>
  );
}
