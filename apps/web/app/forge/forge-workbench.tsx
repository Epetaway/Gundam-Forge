'use client';

import * as React from 'react';
import { Copy, Eye, Filter, Plus, Trash2 } from 'lucide-react';
import { validateDeck, type CardColor, type CardDefinition, type CardType } from '@gundam-forge/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'gundam-forge-next-deck';

const colorFilters: Array<'All' | CardColor> = ['All', 'Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
const typeFilters: Array<'All' | CardType> = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

export type ForgeCard = Pick<
  CardDefinition,
  'id' | 'name' | 'color' | 'type' | 'cost' | 'set' | 'text' | 'imageUrl'
>;

interface ForgeWorkbenchProps {
  cards: ForgeCard[];
}

export function ForgeWorkbench({ cards }: ForgeWorkbenchProps): JSX.Element {
  const [query, setQuery] = React.useState('');
  const [color, setColor] = React.useState<'All' | CardColor>('All');
  const [type, setType] = React.useState<'All' | CardType>('All');
  const [deck, setDeck] = React.useState<Record<string, number>>({});
  const [inspectCardId, setInspectCardId] = React.useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = React.useState('');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, number>;
      setDeck(parsed);
    } catch {
      setDeck({});
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } catch {
      // Ignore writes in constrained browser modes.
    }
  }, [deck]);

  const cardMap = React.useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const filteredCards = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return cards.filter((card) => {
      if (color !== 'All' && card.color !== color) return false;
      if (type !== 'All' && card.type !== type) return false;
      if (!normalizedQuery) return true;
      return `${card.id} ${card.name}`.toLowerCase().includes(normalizedQuery);
    });
  }, [cards, color, type, query]);

  const deckEntries = React.useMemo(
    () => Object.entries(deck).filter((entry) => entry[1] > 0).map(([cardId, qty]) => ({ cardId, qty })),
    [deck],
  );

  const resolvedDeck = React.useMemo(
    () =>
      deckEntries
        .map((entry) => ({ ...entry, card: cardMap.get(entry.cardId) }))
        .filter((entry) => entry.card)
        .sort((a, b) => (a.card?.cost ?? 0) - (b.card?.cost ?? 0)),
    [cardMap, deckEntries],
  );

  const validation = React.useMemo(
    () => validateDeck(deckEntries, cards as CardDefinition[]),
    [cards, deckEntries],
  );

  const inspectCard = inspectCardId ? cardMap.get(inspectCardId) : undefined;

  const addCard = (cardId: string): void => {
    setDeck((current) => ({ ...current, [cardId]: Math.min((current[cardId] ?? 0) + 1, 4) }));
  };

  const removeCard = (cardId: string): void => {
    setDeck((current) => {
      const next = { ...current };
      const qty = (next[cardId] ?? 0) - 1;
      if (qty <= 0) delete next[cardId];
      else next[cardId] = qty;
      return next;
    });
  };

  const clearDeck = (): void => setDeck({});

  const exportDeck = React.useCallback(
    async (format: 'text' | 'csv' | 'json') => {
      const rows = resolvedDeck.map((entry) => ({
        qty: entry.qty,
        id: entry.card!.id,
        name: entry.card!.name,
        type: entry.card!.type,
        color: entry.card!.color,
      }));

      const payload =
        format === 'json'
          ? JSON.stringify(rows, null, 2)
          : format === 'csv'
            ? ['Qty,ID,Name,Type,Color', ...rows.map((row) => `${row.qty},${row.id},"${row.name}",${row.type},${row.color}`)].join('\n')
            : rows.map((row) => `${row.qty}x ${row.name} (${row.id})`).join('\n');

      try {
        await navigator.clipboard.writeText(payload);
        setCopyFeedback(`Copied ${format.toUpperCase()} to clipboard`);
        window.setTimeout(() => setCopyFeedback(''), 1400);
      } catch {
        setCopyFeedback('Clipboard unavailable');
      }
    },
    [resolvedDeck],
  );

  return (
    <TooltipProvider delayDuration={120}>
      <div className="grid gap-6 xl:grid-cols-forge">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-steel-500" />
              Card Catalog
            </CardTitle>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                aria-label="Search cards"
                className="md:col-span-2"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or card ID"
                value={query}
              />
              <div className="grid grid-cols-2 gap-2">
                <Select onValueChange={(value: string) => setColor(value as CardColor | 'All')} value={color}>
                  <SelectTrigger aria-label="Filter by color">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colorFilters.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={(value: string) => setType(value as CardType | 'All')} value={type}>
                  <SelectTrigger aria-label="Filter by type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeFilters.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[68vh] overflow-y-auto p-2">
            <ul className="space-y-1" role="list">
              {filteredCards.slice(0, 320).map((card) => {
                const qty = deck[card.id] ?? 0;
                return (
                  <li
                    className={cn(
                      'grid grid-cols-[1fr_auto] items-center rounded-md border border-transparent px-3 py-2 transition-colors',
                      qty > 0 ? 'bg-cobalt-400/10' : 'hover:border-border hover:bg-steel-50',
                    )}
                    key={card.id}
                  >
                    <button
                      className="text-left"
                      onClick={() => setInspectCardId(card.id)}
                      type="button"
                    >
                      <p className="text-sm font-medium text-foreground">{card.name}</p>
                      <p className="text-xs text-steel-600">
                        {card.id} • {card.color} • {card.type} • Cost {card.cost}
                      </p>
                    </button>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label={`Inspect ${card.name}`} onClick={() => setInspectCardId(card.id)} size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Inspect card</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button aria-label={`Add ${card.name}`} onClick={() => addCard(card.id)} size="icon" variant="secondary">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add to deck</TooltipContent>
                      </Tooltip>
                      {qty > 0 ? <Badge variant="accent">{qty}x</Badge> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Deck Assembly</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary">Export</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => exportDeck('text')}>Plain Text</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => exportDeck('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => exportDeck('json')}>JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={clearDeck} size="sm" variant="ghost">
                  <Trash2 className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-steel-600">
              <Badge variant={validation.isValid ? 'success' : 'warning'}>
                {validation.isValid ? 'Valid Deck' : `${validation.errors.length} Rules Violations`}
              </Badge>
              <span>{validation.metrics.totalCards} cards total</span>
              <span>•</span>
              <span>{validation.metrics.mainDeckCards}/50 main</span>
              <span>•</span>
              <span>{validation.metrics.resourceDeckCards}/10 resource</span>
            </div>
            {copyFeedback ? (
              <p className="flex items-center gap-2 text-xs text-success">
                <Copy className="h-3 w-3" />
                {copyFeedback}
              </p>
            ) : null}
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="deck">
              <TabsList>
                <TabsTrigger value="deck">Deck List</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>
              <TabsContent value="deck">
                <div className="max-h-[52vh] overflow-y-auto">
                  {resolvedDeck.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-steel-600">
                      Start adding cards from the catalog.
                    </p>
                  ) : (
                    <ul className="space-y-2" role="list">
                      {resolvedDeck.map((entry) => (
                        <li className="flex items-center justify-between rounded-md border border-border bg-steel-50 px-3 py-2" key={entry.cardId}>
                          <div>
                            <p className="text-sm font-medium">{entry.card?.name}</p>
                            <p className="text-xs text-steel-600">
                              {entry.card?.id} • {entry.card?.type}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{entry.qty}x</Badge>
                            <Button aria-label={`Remove ${entry.card?.name}`} onClick={() => removeCard(entry.cardId)} size="icon" variant="ghost">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="validation" className="space-y-3">
                {validation.errors.length === 0 ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    No rule violations found.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {validation.errors.map((error) => (
                      <li className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" key={error}>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}

                {validation.warnings.length > 0 ? (
                  <ul className="space-y-2">
                    {validation.warnings.map((warning) => (
                      <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700" key={warning}>
                        {warning}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog onOpenChange={(open) => !open && setInspectCardId(null)} open={Boolean(inspectCard)}>
        <DialogContent aria-describedby="forge-card-details">
          <DialogHeader>
            <DialogTitle>{inspectCard?.name}</DialogTitle>
            <DialogDescription id="forge-card-details">
              {inspectCard?.id} • {inspectCard?.color} • {inspectCard?.type} • Cost {inspectCard?.cost}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-steel-700">{inspectCard?.text ?? 'No rules text for this entry.'}</p>
          <div className="flex justify-end">
            {inspectCard ? (
              <Button onClick={() => addCard(inspectCard.id)}>
                <Plus className="mr-1 h-4 w-4" />
                Add to deck
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
