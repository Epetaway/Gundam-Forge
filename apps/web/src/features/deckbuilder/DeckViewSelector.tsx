interface DeckViewSelectorProps {
  view: 'visual' | 'list' | 'stats';
  onViewChange: (view: 'visual' | 'list' | 'stats') => void;
}

export function DeckViewSelector({ view, onViewChange }: DeckViewSelectorProps) {
  const views = [
    { id: 'visual' as const, label: 'Visual', icon: '[#]' },
    { id: 'list' as const, label: 'List', icon: '[=]' },
    { id: 'stats' as const, label: 'Stats', icon: '[%]' },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-gcg-border bg-gcg-light p-1">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onViewChange(v.id)}
          className={`flex-1 rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
            view === v.id
              ? 'border-2 border-gcg-primary bg-gcg-primary text-white'
              : 'border-2 border-transparent text-gray-600 hover:border-gray-300 hover:text-gcg-dark'
          }`}
        >
          <span className="mr-1">{v.icon}</span>
          {v.label}
        </button>
      ))}
    </div>
  );
}
