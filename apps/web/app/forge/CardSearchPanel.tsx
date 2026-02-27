import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { List } from 'react-window';
import { debounce } from '@/lib/utils/debounce';

interface CardListItem {
  id: string;
  name: string;
  cost: number;
  type: string;
  faction: string;
  thumbnailUrl: string;
}

export function CardSearchPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<{ type?: string; color?: string; set?: string }>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [limit] = useState(30);

  // Example filter options (could be fetched from API or config)
  const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];
  const CARD_COLORS = ['All', 'Red', 'Blue', 'Green', 'Yellow', 'Colorless'];
  const CARD_SETS = ['All', 'Set 1', 'Set 2', 'Set 3']; // Replace with real sets if available

  // Exclude EX and EX Base by default for main deck search
  const excludeTypes = ['EX', 'EX Base'];
  const { data, isFetching } = useQuery<{ results: CardListItem[]; nextCursor?: string }, Error>({
    queryKey: ['card-search', query, filters, cursor, limit, excludeTypes],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, limit: String(limit), ...(cursor ? { cursor } : {}), ...filters });
      params.set('excludeTypes', excludeTypes.join(','));
      const res = await fetch(`/api/cards/search?${params}`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      return res.json();
    },
  });

  const handleSearch = debounce((val: string) => {
    setQuery(val);
    setCursor(null);
  }, 300);

  const results = data?.results ?? [];
  const [allResults, setAllResults] = useState<CardListItem[]>([]);
  React.useEffect(() => {
    if (cursor === null) {
      setAllResults(results);
    } else if (results.length > 0) {
      setAllResults(prev => [...prev, ...results]);
    }
  }, [cursor, results]);

  return (
    <aside className="w-80 border-r border-border bg-surface-elevated p-4 flex flex-col">
      <input
        className="mb-3 w-full rounded border border-border p-2 text-sm"
        placeholder="Search cards..."
        onChange={e => handleSearch(e.target.value)}
      />
      {/* Filter chips UI */}
      <div className="mb-3 flex flex-wrap gap-2">
        {/* Type filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-steel-600">Type:</span>
          {CARD_TYPES.map(type => (
            <button
              key={type}
              className={`px-2 py-0.5 rounded text-xs border ${filters.type === type || (type === 'All' && !filters.type) ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-steel-700'}`}
              onClick={() => {
                setFilters(f => ({ ...f, type: type === 'All' ? undefined : type }));
                setCursor(null);
              }}
            >
              {type}
            </button>
          ))}
        </div>
        {/* Color filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-steel-600">Color:</span>
          {CARD_COLORS.map(color => (
            <button
              key={color}
              className={`px-2 py-0.5 rounded text-xs border ${filters.color === color || (color === 'All' && !filters.color) ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-steel-700'}`}
              onClick={() => {
                setFilters(f => ({ ...f, color: color === 'All' ? undefined : color }));
                setCursor(null);
              }}
            >
              {color}
            </button>
          ))}
        </div>
        {/* Set filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-steel-600">Set:</span>
          {CARD_SETS.map(set => (
            <button
              key={set}
              className={`px-2 py-0.5 rounded text-xs border ${filters.set === set || (set === 'All' && !filters.set) ? 'bg-cobalt-600 text-white' : 'bg-surface-interactive text-steel-700'}`}
              onClick={() => {
                setFilters(f => ({ ...f, set: set === 'All' ? undefined : set }));
                setCursor(null);
              }}
            >
              {set}
            </button>
          ))}
        </div>
      </div>
      {/* Card results */}
      <div className="flex-1 overflow-y-auto">
        {allResults.map(card => (
          <div key={card.id} className="mb-2 p-2 border rounded cursor-pointer hover:bg-surface-interactive" onClick={() => { onSelect(card.id); }}>
            <span className="font-semibold">{card.name}</span> <span className="text-xs text-steel-600">({card.type})</span>
          </div>
        ))}
      </div>
      {isFetching && <div className="text-xs text-steel-600">Loading...</div>}
    </aside>
  );
}
