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
  const [filters, setFilters] = useState({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [limit] = useState(30);

  const { data, isFetching } = useQuery<{ results: CardListItem[]; nextCursor?: string }, Error>({
    queryKey: ['card-search', query, filters, cursor, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, limit: String(limit), ...(cursor ? { cursor } : {}), ...filters });
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

  return (
    <aside className="w-80 border-r border-border bg-surface-elevated p-4 flex flex-col">
      <input
        className="mb-3 w-full rounded border border-border p-2 text-sm"
        placeholder="Search cards..."
        onChange={e => handleSearch(e.target.value)}
      />
      {/* TODO: filter chips UI */}
      {isFetching && <div className="text-xs text-steel-600">Loading...</div>}
      {results.length > 0 && (
        <List
          defaultHeight={400}
          rowCount={results.length}
          rowHeight={56}
          rowProps={{}}
          rowComponent={({ index, style }) => {
            const card = results[index];
            return (
              <div style={style} className="flex items-center gap-2 p-2 hover:bg-surface-interactive cursor-pointer" onClick={() => onSelect(card.id)}>
                <img src={card.thumbnailUrl} alt={card.name} className="h-10 w-10 rounded object-cover" loading="lazy" />
                <div>
                  <div className="font-semibold text-sm text-foreground">{card.name}</div>
                  <div className="text-xs text-steel-600">{card.type} • {card.faction ?? 'N/A'} • Cost {card.cost}</div>
                </div>
              </div>
            );
          }}
        />
      )}
      {typeof data?.nextCursor === 'string' && (
        <button className="mt-2 w-full rounded bg-cobalt-600 py-2 text-white" onClick={() => setCursor(data.nextCursor ?? null)}>Load More</button>
      )}
    </aside>
  );
}
