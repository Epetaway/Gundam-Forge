import { useDeferredValue, useMemo, useState } from 'react';
import type { CardDefinition, CardColor, CardType } from '@gundam-forge/shared';
import { filterCatalogCards, useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';

const pageSize = 12;
const colors: Array<CardColor | 'All'> = ['All', 'Blue', 'Green', 'Red', 'White', 'Black', 'Colorless'];
const types: Array<CardType | 'All'> = ['All', 'Unit', 'Pilot', 'Command', 'Base'];

interface CardCatalogProps {
  cards: CardDefinition[];
}

export function CardCatalog({ cards }: CardCatalogProps) {
  const query = useCardsStore((state) => state.query);
  const filters = useCardsStore((state) => state.filters);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const setQuery = useCardsStore((state) => state.setQuery);
  const setFilter = useCardsStore((state) => state.setFilter);
  const clearFilters = useCardsStore((state) => state.clearFilters);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);
  const deckEntries = useDeckStore((state) => state.entries);
  const addCard = useDeckStore((state) => state.addCard);
  const removeCard = useDeckStore((state) => state.removeCard);

  const [page, setPage] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const filteredCards = useMemo(
    () => filterCatalogCards(cards, deferredQuery, filters),
    [cards, deferredQuery, filters]
  );
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));

  const pagedCards = useMemo(() => {
    const start = page * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, page]);

  const setOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.set))], [cards]);
  const costOptions = useMemo(() => ['All', ...new Set(cards.map((card) => card.cost).sort((a, b) => a - b))], [cards]);
  const qtyByCardId = useMemo(
    () => new Map(deckEntries.map((entry) => [entry.cardId, entry.qty] as const)),
    [deckEntries]
  );

  const onFilterChange = <K extends 'color' | 'cost' | 'type' | 'set'>(key: K, value: string) => {
    const parsedValue = key === 'cost' && value !== 'All' ? Number(value) : value;
    setFilter(key, parsedValue as never);
    setPage(0);
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inventory Rack</h2>
        <button
          className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
          onClick={() => {
            clearFilters();
            setPage(0);
          }}
        >
          Clear filters
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
        <input
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-400"
          placeholder="Search name or ID"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />

        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={filters.color}
          onChange={(event) => onFilterChange('color', event.target.value)}
        >
          {colors.map((color) => (
            <option value={color} key={color}>
              Color: {color}
            </option>
          ))}
        </select>

        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={filters.cost}
          onChange={(event) => onFilterChange('cost', event.target.value)}
        >
          {costOptions.map((cost) => (
            <option value={cost} key={cost}>
              Cost: {cost}
            </option>
          ))}
        </select>

        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={filters.type}
          onChange={(event) => onFilterChange('type', event.target.value)}
        >
          {types.map((type) => (
            <option value={type} key={type}>
              Type: {type}
            </option>
          ))}
        </select>

        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={filters.set}
          onChange={(event) => onFilterChange('set', event.target.value)}
        >
          {setOptions.map((setName) => (
            <option value={setName} key={setName}>
              Set: {setName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 max-h-[560px] overflow-auto rounded border border-slate-800">
        {pagedCards.length === 0 ? (
          <p className="p-4 text-sm text-slate-400">No cards match the current filters.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {pagedCards.map((card) => (
              <li
                key={card.id}
                className={`cursor-pointer px-4 py-3 transition hover:bg-slate-800 ${
                  selectedCardId === card.id ? 'bg-slate-800' : ''
                }`}
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {card.color} · {card.type} · Cost {card.cost} · {card.set}
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <span className="rounded bg-slate-950 px-2 py-0.5 text-xs">{card.id}</span>
                    <button
                      className="h-7 w-7 rounded bg-slate-700 text-sm hover:bg-slate-600"
                      onClick={() => removeCard(card.id)}
                      aria-label={`Remove ${card.name}`}
                    >
                      -
                    </button>
                    <span className="min-w-5 text-center text-sm">{qtyByCardId.get(card.id) ?? 0}</span>
                    <button
                      className="h-7 w-7 rounded bg-slate-700 text-sm hover:bg-slate-600"
                      onClick={() => addCard(card.id)}
                      aria-label={`Add ${card.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-slate-400">
          Showing {pagedCards.length} of {filteredCards.length} matches
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
          >
            Prev
          </button>
          <span className="text-slate-300">
            Page {Math.min(page + 1, totalPages)} / {totalPages}
          </span>
          <button
            className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
