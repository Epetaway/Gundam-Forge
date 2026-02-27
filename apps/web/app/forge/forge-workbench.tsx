'use client';

import * as React from 'react';
import { LayoutGrid, SlidersHorizontal, Table2, AlignLeft, Search, Plus, Minus } from 'lucide-react';
import { DeckHeader } from '@/components/deck/DeckHeader';
import { DeckToolbar, type DeckToolbarViewOption } from '@/components/deck/DeckToolbar';
import { DeckListRenderer } from '@/components/deck/DeckListRenderer';
import { CardViewerModal } from '@/components/deck/CardViewerModal';
import { CardArtImage } from '@/components/ui/CardArtImage';
import { cn } from '@/lib/utils/cn';
import {
  toDeckViewItem,
  applyDeckFilterSort,
  buildDeckExportText,
  type DeckViewItem,
  type DeckDensity,
  type DeckSortKey,
  type DeckViewMode,
} from '@/lib/deck/sortFilter';
import { getStoredDeck, updateDeckEntries } from '@/lib/deck/storage';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { ImportResultsSummary } from './ImportResultsSummary';
import type { CardMatchResult } from './cardMatching';
import { validateDeck } from '@gundam-forge/shared';
import type { CardDefinition, CardType } from '@gundam-forge/shared';
import { CardSearchPanel } from './CardSearchPanel';

// ---------- types ----------

export interface ForgeCard {
  id: string;
  name: string;
  color: string;
  type: string;
  cost: number;
  set: string;
  text?: string;
  imageUrl?: string;
  placeholderArt?: string;
}

export interface ForgeWorkbenchProps {
  cards: ForgeCard[];
  deckId?: string | null;
  initialDeck?: {
    id: string;
    name: string;
    description: string;
    archetype: string;
    owner: string;
    colors: string[];
    entries: { cardId: string; qty: number }[];
  } | null;
}

// ---------- archetype card filter presets ----------

const ARCHETYPE_PRESETS: Record<string, { types?: CardType[]; maxCost?: number; minCost?: number }> = {
  Aggro:    { types: ['Unit'],              maxCost: 2 },
  Midrange: { types: ['Unit', 'Pilot'],     minCost: 2, maxCost: 4 },
  Control:  { types: ['Command', 'Pilot'],  minCost: 3 },
  Combo:    { types: ['Pilot', 'Command'] },
  Ramp:     { types: ['Resource', 'Unit'], maxCost: 1 },
};

// ---------- view registry ----------

const VIEW_REGISTRY: DeckToolbarViewOption[] = [
  { id: 'stacks', label: 'Stacks', icon: SlidersHorizontal },
  { id: 'image',  label: 'Grid',   icon: LayoutGrid },
  { id: 'text',   label: 'Text',   icon: AlignLeft },
  { id: 'table',  label: 'Table',  icon: Table2 },
];

const CARD_TYPES = ['All', 'Unit', 'Pilot', 'Command', 'Base', 'Resource'];

// ---------- card catalog sidebar ----------

// ---------- validation bar ----------

interface ValidationBarProps {
  entries: { cardId: string; qty: number }[];
  allCards: CardDefinition[];
}

function ValidationBar({ entries, allCards }: ValidationBarProps) {
  const result = React.useMemo(() => validateDeck(entries, allCards), [entries, allCards]);
  const { metrics, errors, warnings, isValid } = result;

  const mainPct = Math.min((metrics.mainDeckCards / 50) * 100, 100);
  const resPct = Math.min((metrics.resourceDeckCards / 10) * 100, 100);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/80 px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-steel-600">Main:</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive">
          <div
            className={cn('h-full rounded-full transition-all', metrics.mainDeckCards === 50 ? 'bg-green-500' : 'bg-cobalt-500')}
            style={{ width: `${mainPct}%` }}
          />
        </div>
        <span className={cn('font-mono font-semibold tabular-nums', metrics.mainDeckCards === 50 ? 'text-green-400' : 'text-cobalt-300')}>
          {metrics.mainDeckCards}/50
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-steel-600">Resource:</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive">
          <div
            className={cn('h-full rounded-full transition-all', metrics.resourceDeckCards === 10 ? 'bg-green-500' : 'bg-cobalt-500')}
            style={{ width: `${resPct}%` }}
          />
        </div>
        <span className={cn('font-mono font-semibold tabular-nums', metrics.resourceDeckCards === 10 ? 'text-green-400' : 'text-cobalt-300')}>
          {metrics.resourceDeckCards}/10
        </span>
      </div>

      {errors.slice(0, 2).map((err) => (
        <span className="rounded bg-red-500/10 px-2 py-0.5 text-red-400" key={err}>{err}</span>
      ))}
      {!errors.length && warnings.slice(0, 1).map((w) => (
        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-300" key={w}>{w}</span>
      ))}
      {isValid && (
        <span className="rounded bg-green-500/10 px-2 py-0.5 font-semibold text-green-400">✓ Valid</span>
      )}
    </div>
  );
}

// ---------- main DeckBuilderPage ----------

export function DeckBuilderPage({ deckId, initialDeck }: Omit<ForgeWorkbenchProps, 'cards'>): JSX.Element | null {
    // Deck import modal state
    const [importOpen, setImportOpen] = React.useState(false);
    const [importText, setImportText] = React.useState('');
    const [importError, setImportError] = React.useState<string | null>(null);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const [deckMeta, setDeckMeta] = React.useState({
    name: 'Untitled Deck',
    description: '',
    archetype: '',
    owner: 'You',
    colors: [] as string[],
  });
  const [deck, setDeck] = React.useState<Record<string, number>>({});
  const [importResults, setImportResults] = React.useState<CardMatchResult | null>(null);
  const [viewMode, setViewMode] = useLocalStorageState<DeckViewMode>('gundam-forge.forge.viewMode', 'stacks');
  const [density, setDensity] = useLocalStorageState<DeckDensity>('gundam-forge.forge.density', 'comfortable');
  const [query, setQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<DeckSortKey>('type');
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState('');

  React.useEffect(() => {
    let loaded = deckId ? getStoredDeck(deckId) : null;

    if (loaded) {
      setDeckMeta({ name: loaded.name, description: loaded.description, archetype: loaded.archetype, owner: 'You', colors: loaded.colors });
      const e: Record<string, number> = {};
      for (const { cardId, qty } of loaded.entries) e[cardId] = qty;
      setDeck(e);
    } else if (initialDeck) {
      setDeckMeta({ name: initialDeck.name, description: initialDeck.description, archetype: initialDeck.archetype, owner: initialDeck.owner, colors: initialDeck.colors });
      const e: Record<string, number> = {};
      for (const { cardId, qty } of initialDeck.entries) e[cardId] = qty;
      setDeck(e);
    }

    try {
      const raw = sessionStorage.getItem('gundam-forge.pendingImport');
      if (raw) { setImportResults(JSON.parse(raw)); sessionStorage.removeItem('gundam-forge.pendingImport'); }
    } catch { /* ignore */ }
  }, [deckId, initialDeck]);

  // ...existing code...

  // Add handler for adding a card by id
  const handleAdd = React.useCallback((cardId: string) => {
    setDeck((prev) => ({ ...prev, [cardId]: (prev[cardId] || 0) + 1 }));
  }, []);

  // Responsive sidebar state
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative min-w-0">
      {/* Mobile toggle button */}
      <button
        className="absolute top-2 left-2 z-20 md:hidden bg-cobalt-600 text-white px-3 py-1 rounded shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open card search"
      >
        Search Cards
      </button>

      {/* Deck import button */}
      <button
        className="absolute top-2 right-2 z-20 bg-green-600 text-white px-3 py-1 rounded shadow"
        onClick={() => setImportOpen(true)}
        aria-label="Import deck"
      >
        Import Deck
      </button>

      {/* Card search sidebar - responsive */}
      <div
        className={
          sidebarOpen
            ? 'fixed inset-0 z-30 flex md:static md:inset-auto md:z-auto'
            : 'hidden md:block md:relative'
        }
        style={{ maxWidth: sidebarOpen ? '100vw' : undefined }}
      >
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close card search overlay"
          />
        )}
        <aside className="relative z-20 md:z-auto w-80 max-w-full min-w-0">
          <CardSearchPanel onSelect={cardId => { handleAdd(cardId); setSidebarOpen(false); }} />
          {/* Close button for mobile */}
          <button
            className="absolute top-2 right-2 md:hidden bg-surface-interactive text-steel-700 px-2 py-1 rounded"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close card search"
          >
            ✕
          </button>
        </aside>
      </div>

      {/* Deck import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-steel-700 bg-surface-interactive px-2 py-1 rounded"
              onClick={() => { setImportOpen(false); setImportError(null); }}
              aria-label="Close import modal"
            >✕</button>
            <h2 className="text-lg font-semibold mb-2">Import Deck</h2>
            <div className="mb-2 text-xs text-steel-700">
              Format: <code>Quantity Card Name</code> per line (e.g. <code>3 Amuro Ray</code>)<br />
              Unrecognized cards will be highlighted. Recognized cards will be auto-added.
            </div>
            <textarea
              className="w-full h-32 border border-border rounded p-2 mb-2 text-sm"
              placeholder="Paste deck list here (e.g. 4 Gundam, 2 Zaku II)"
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            {importError && <div className="text-red-500 text-xs mb-2 animate-shake">{importError}</div>}
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={async () => {
                setImportError(null);
                // Parse deck list: <qty> <card name>
                const lines = importText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                const entries: { name: string; qty: number; line: string }[] = [];
                let formatErrors: string[] = [];
                for (const line of lines) {
                  const match = line.match(/^(\d+)\s+(.+)$/);
                  if (!match) {
                    formatErrors.push(`Invalid line: "${line}"`);
                  } else {
                    entries.push({ qty: parseInt(match[1], 10), name: match[2], line });
                  }
                }
                // Fetch card DB for name matching
                try {
                  const res = await fetch('/api/cards?limit=1000');
                  const { cards } = await res.json();
                  const nameToId = Object.fromEntries(cards.map((c: any) => [c.name.toLowerCase(), c.id]));
                  const newDeck: Record<string, number> = {};
                  let notFound: string[] = [];
                  for (const entry of entries) {
                    const cardId = nameToId[entry.name.toLowerCase()];
                    if (!cardId) {
                      notFound.push(entry.line);
                    } else {
                      newDeck[cardId] = (newDeck[cardId] || 0) + entry.qty;
                    }
                  }
                  if (formatErrors.length > 0 || notFound.length > 0) {
                    setImportError([
                      ...formatErrors.map(e => e + ' (use: <qty> <card name>)'),
                      ...notFound.map(n => `Card not found: ${n}`),
                    ].join('\n'));
                  } else {
                    setDeck(newDeck);
                    setImportOpen(false);
                    setImportText('');
                  }
                } catch (err) {
                  setImportError('Failed to import deck.');
                }
              }}
            >Import</button>
          </div>
        </div>
      )}

      {/* Main area placeholder: implement deck list, validation, and toolbar using deck state only */}
      <div className="flex flex-1 flex-col items-center justify-center min-w-0 overflow-auto">
        <p className="text-sm text-steel-600 mb-1">Your deck is empty or not rendered yet.</p>
        <p className="text-xs text-steel-700">Use the card catalog on the left to add cards.</p>
      </div>
    </div>
  );
}
