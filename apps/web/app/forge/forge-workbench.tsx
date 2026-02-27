'use client';

import * as React from 'react';
import { LayoutGrid, SlidersHorizontal, Table2, AlignLeft, Settings, X, Download } from 'lucide-react';
import { DeckToolbar, type DeckToolbarViewOption } from '@/components/deck/DeckToolbar';
import { DeckListRenderer } from '@/components/deck/DeckListRenderer';
import { CardViewerModal } from '@/components/deck/CardViewerModal';
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
import { getStoredDeck, updateDeckEntries, updateDeckMeta } from '@/lib/deck/storage';
import { useLocalStorageState } from '@/lib/useLocalStorageState';
import { ImportResultsSummary } from './ImportResultsSummary';
import type { CardMatchResult } from './cardMatching';
import { validateDeck } from '@gundam-forge/shared';
import type { CardDefinition, CardColor } from '@gundam-forge/shared';
import { CardSearchPanel } from './CardSearchPanel';
import { cards as allCards, cardsById } from '@/lib/data/cards';
import { parseDeckList } from './parseDeckList';

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

// ---------- view registry ----------

const VIEW_REGISTRY: DeckToolbarViewOption[] = [
  { id: 'stacks', label: 'Stacks', icon: SlidersHorizontal },
  { id: 'image',  label: 'Grid',   icon: LayoutGrid },
  { id: 'text',   label: 'Text',   icon: AlignLeft },
  { id: 'table',  label: 'Table',  icon: Table2 },
];

// ---------- constants ----------

const GUNDAM_COLORS: { value: CardColor; label: string; cls: string }[] = [
  { value: 'Blue',      label: 'B',  cls: 'bg-blue-600 text-white' },
  { value: 'Green',     label: 'G',  cls: 'bg-green-600 text-white' },
  { value: 'Red',       label: 'R',  cls: 'bg-red-600 text-white' },
  { value: 'White',     label: 'W',  cls: 'bg-white text-steel-900 border-steel-300' },
  { value: 'Purple',    label: 'P',  cls: 'bg-purple-600 text-white' },
  { value: 'Colorless', label: 'C',  cls: 'bg-steel-600 text-white' },
];

const ARCHETYPES = ['', 'Aggro', 'Midrange', 'Control', 'Combo', 'Ramp'];

const IMPORT_FORMAT_HELP = `Accepted formats (one card per line):
  3 Amuro Ray
  Amuro Ray x3
  ST01-001 Amuro Ray x3
  Amuro Ray (3)

Recognized cards are added automatically.
Unrecognized cards are listed as warnings.`;

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
    <div
      className="flex flex-wrap items-center gap-3 border-b border-border bg-surface/80 px-4 py-2 text-xs"
      role="status"
      aria-label="Deck validation status"
    >
      <div className="flex items-center gap-2">
        <span className="text-steel-600">Main:</span>
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive" aria-hidden="true">
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
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-interactive" aria-hidden="true">
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

// ---------- deck settings bar ----------

interface DeckSettingsBarProps {
  deckId: string | null | undefined;
  name: string;
  colors: string[];
  archetype: string;
  onNameChange: (n: string) => void;
  onColorsChange: (c: CardColor[]) => void;
  onArchetypeChange: (a: string) => void;
  onExport: () => void;
}

function DeckSettingsBar({
  deckId,
  name,
  colors,
  archetype,
  onNameChange,
  onColorsChange,
  onArchetypeChange,
  onExport,
}: DeckSettingsBarProps) {
  const [open, setOpen] = React.useState(false);
  const [localName, setLocalName] = React.useState(name);

  // Sync localName if parent name changes (e.g. on load)
  React.useEffect(() => { setLocalName(name); }, [name]);

  const nonColorless = (colors as CardColor[]).filter((c) => c !== 'Colorless');

  const handleNameBlur = () => {
    const trimmed = localName.trim() || 'Untitled Deck';
    setLocalName(trimmed);
    onNameChange(trimmed);
  };

  const handleColorToggle = (color: CardColor) => {
    const prev = colors as CardColor[];
    let next: CardColor[];
    if (prev.includes(color)) {
      next = prev.filter((c) => c !== color);
    } else {
      const prevNonColorless = prev.filter((c) => c !== 'Colorless');
      if (color !== 'Colorless' && prevNonColorless.length >= 2) return;
      next = [...prev, color];
    }
    onColorsChange(next);
  };

  return (
    <div className="flex-shrink-0 border-b border-border bg-surface">
      {/* Collapsed bar */}
      <div className="flex items-center gap-3 px-4 py-1.5">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-steel-500 hover:text-foreground transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="deck-settings-panel"
          aria-label="Toggle deck settings"
        >
          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="max-w-[180px] truncate font-semibold text-foreground">{name}</span>
          {archetype && <span className="text-steel-500">· {archetype}</span>}
        </button>

        {/* Color pills (read-only in collapsed view) */}
        <div className="flex gap-1" aria-label="Deck colors">
          {(colors as CardColor[]).map((c) => {
            const def = GUNDAM_COLORS.find((x) => x.value === c);
            return (
              <span
                key={c}
                className={cn('inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold', def?.cls ?? '')}
                title={c}
                aria-label={c}
              >
                {def?.label ?? c[0]}
              </span>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 rounded border border-border bg-surface-interactive px-2 py-0.5 text-xs text-steel-600 hover:text-foreground transition-colors"
            onClick={onExport}
            aria-label="Export deck list as text"
            title="Export deck list"
          >
            <Download className="h-3 w-3" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* Expanded settings panel */}
      {open && (
        <div
          id="deck-settings-panel"
          className="border-t border-border bg-surface-elevated px-4 pb-3 pt-2"
        >
          <div className="flex flex-wrap items-start gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs font-semibold text-steel-500" htmlFor="deck-name-input">Name</label>
              <input
                id="deck-name-input"
                className="h-7 rounded border border-border bg-surface px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                maxLength={80}
                aria-label="Deck name"
              />
            </div>

            {/* Colors */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-steel-500" id="settings-colors-label">
                Colors <span className="font-normal text-steel-600">(max 2)</span>
              </span>
              <div className="flex flex-wrap gap-1" role="group" aria-labelledby="settings-colors-label">
                {GUNDAM_COLORS.map(({ value, label, cls }) => {
                  const active = colors.includes(value);
                  const atMax = !active && value !== 'Colorless' && nonColorless.length >= 2;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        'h-6 w-6 rounded-full text-[10px] font-bold border transition-all',
                        active ? cn(cls, 'ring-2 ring-cobalt-400/60') : 'border-border bg-surface-interactive text-steel-600 hover:border-cobalt-400/40',
                        atMax ? 'opacity-40 cursor-not-allowed' : '',
                      )}
                      onClick={() => !atMax && handleColorToggle(value)}
                      disabled={atMax}
                      aria-pressed={active}
                      aria-label={`Toggle ${value} color`}
                      title={value}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Archetype */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-steel-500" htmlFor="settings-archetype-select">Archetype</label>
              <select
                id="settings-archetype-select"
                className="h-7 rounded border border-border bg-surface px-2 text-sm outline-none focus-visible:border-ring"
                value={archetype}
                onChange={(e) => onArchetypeChange(e.target.value)}
              >
                {ARCHETYPES.map((a) => (
                  <option key={a} value={a}>{a || '— none —'}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="mt-auto ml-auto self-end rounded border border-border px-2 py-0.5 text-xs text-steel-500 hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close deck settings"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- import modal ----------

interface ImportModalProps {
  onClose: () => void;
  onImport: (text: string) => { imported: number; notFound: string[] };
}

function ImportModal({ onClose, onImport }: ImportModalProps) {
  const [text, setText] = React.useState('');
  const [result, setResult] = React.useState<{ imported: number; notFound: string[] } | null>(null);

  const handleImport = () => {
    const r = onImport(text);
    setResult(r);
    if (r.notFound.length === 0) {
      onClose();
    }
    // If there are unmatched cards, stay open to show warnings.
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="relative w-full max-w-md rounded-lg bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="import-modal-title" className="text-base font-semibold">Import Deck</h2>
          <button
            type="button"
            className="rounded p-1 text-steel-500 hover:bg-surface-interactive hover:text-foreground"
            onClick={onClose}
            aria-label="Close import modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Format help */}
          <details className="text-xs text-steel-600">
            <summary className="cursor-pointer font-medium text-cobalt-400 hover:text-cobalt-300">
              Accepted formats — click to expand
            </summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {IMPORT_FORMAT_HELP}
            </pre>
          </details>

          <div>
            <label htmlFor="deck-import-textarea" className="sr-only">Paste deck list</label>
            <textarea
              id="deck-import-textarea"
              className="w-full h-36 rounded border border-border bg-surface-interactive px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-steel-500 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              placeholder={`4 Gundam\n3 Amuro Ray\n2 Mega Particle Cannon\n...`}
              value={text}
              onChange={(e) => { setText(e.target.value); setResult(null); }}
              aria-label="Deck list to import"
            />
          </div>

          {/* Import result feedback */}
          {result && (
            <div className={cn('rounded px-3 py-2 text-xs', result.notFound.length > 0 ? 'bg-amber-500/10 text-amber-300' : 'bg-green-500/10 text-green-400')}>
              <p className="font-semibold">
                {result.imported} card type{result.imported !== 1 ? 's' : ''} imported.
              </p>
              {result.notFound.length > 0 && (
                <>
                  <p className="mt-1 font-semibold text-amber-300">{result.notFound.length} card{result.notFound.length !== 1 ? 's' : ''} not found:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {result.notFound.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                  <p className="mt-1 text-steel-500">Tip: check spelling or try the card ID prefix (e.g. ST01-001).</p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded bg-cobalt-600 py-2 text-sm font-semibold text-white hover:bg-cobalt-500 disabled:opacity-50 transition-colors"
              onClick={handleImport}
              disabled={!text.trim()}
            >
              Import
            </button>
            {result && result.notFound.length > 0 && (
              <button
                type="button"
                className="rounded border border-border px-3 py-2 text-sm text-steel-600 hover:text-foreground transition-colors"
                onClick={onClose}
              >
                Continue anyway
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- main DeckBuilderPage ----------

export function DeckBuilderPage({ deckId, initialDeck }: Omit<ForgeWorkbenchProps, 'cards'>): JSX.Element | null {
  const [importOpen, setImportOpen] = React.useState(false);

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
  // Inline feedback toast
  const [toast, setToast] = React.useState<{ msg: string; kind: 'success' | 'warn' } | null>(null);

  React.useEffect(() => {
    const loaded = deckId ? getStoredDeck(deckId) : null;

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

  const showToast = React.useCallback((msg: string, kind: 'success' | 'warn' = 'success') => {
    setToast({ msg, kind });
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, []);

  // Card add / remove
  const handleAdd = React.useCallback((cardId: string) => {
    setDeck((prev) => ({ ...prev, [cardId]: (prev[cardId] || 0) + 1 }));
  }, []);

  const handleRemove = React.useCallback((cardId: string) => {
    setDeck((prev) => {
      const next = { ...prev };
      if ((next[cardId] ?? 0) <= 1) {
        delete next[cardId];
      } else {
        next[cardId] -= 1;
      }
      return next;
    });
  }, []);

  // Persist deck entries whenever deck changes
  React.useEffect(() => {
    if (!deckId) return;
    const entries = Object.entries(deck).map(([cardId, qty]) => ({ cardId, qty }));
    updateDeckEntries(deckId, entries);
  }, [deck, deckId]);

  // Deck meta updaters (persist to localStorage when deckId is set)
  const handleNameChange = React.useCallback((n: string) => {
    setDeckMeta((prev) => ({ ...prev, name: n }));
    if (deckId) updateDeckMeta(deckId, { name: n });
  }, [deckId]);

  const handleColorsChange = React.useCallback((c: CardColor[]) => {
    setDeckMeta((prev) => ({ ...prev, colors: c }));
    if (deckId) updateDeckMeta(deckId, { colors: c });
  }, [deckId]);

  const handleArchetypeChange = React.useCallback((a: string) => {
    setDeckMeta((prev) => ({ ...prev, archetype: a }));
    if (deckId) updateDeckMeta(deckId, { archetype: a });
  }, [deckId]);

  // Export
  const handleExport = React.useCallback(() => {
    const items = Object.entries(deck).flatMap(([cardId, qty]) => {
      const item = toDeckViewItem({ cardId, qty, card: cardsById.get(cardId) });
      return item ? [item] : [];
    });
    const text = buildDeckExportText(items);
    navigator.clipboard.writeText(text).then(
      () => showToast('Deck list copied to clipboard!'),
      () => showToast('Could not copy — try selecting and copying manually.', 'warn'),
    );
  }, [deck, showToast]);

  // Import handler — returns imported count and notFound list; applies partial import
  const handleImport = React.useCallback((text: string): { imported: number; notFound: string[] } => {
    const entries = parseDeckList(text);
    if (entries.length === 0) return { imported: 0, notFound: [] };

    const newDeck: Record<string, number> = {};
    const notFound: string[] = [];

    for (const entry of entries) {
      // Prefer exact ID match first, then case-insensitive name match.
      const byId = cardsById.get(entry.setId ?? '');
      const byName = allCards.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
      const card = byId ?? byName;

      if (!card) {
        notFound.push(entry.name);
      } else {
        newDeck[card.id] = (newDeck[card.id] || 0) + entry.qty;
      }
    }

    // Apply partial import — always add what was matched.
    if (Object.keys(newDeck).length > 0) {
      setDeck((prev) => {
        const merged = { ...prev };
        for (const [id, qty] of Object.entries(newDeck)) {
          merged[id] = qty; // Replace qty for that card (not additive, mirrors MTG-style full-list imports)
        }
        return merged;
      });
    }

    return { imported: Object.keys(newDeck).length, notFound };
  }, []);

  // Build DeckViewItem list
  const deckViewItems = React.useMemo(
    () =>
      Object.entries(deck).flatMap(([cardId, qty]) => {
        const item = toDeckViewItem({ cardId, qty, card: cardsById.get(cardId) });
        return item ? [item] : [];
      }),
    [deck],
  );

  const filteredDeckItems = React.useMemo(
    () => applyDeckFilterSort(deckViewItems, { query, sortBy }),
    [deckViewItems, query, sortBy],
  );

  // Sidebar state: mobile overlay drawer + desktop collapse (persisted)
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [desktopPanelOpen, setDesktopPanelOpen] = useLocalStorageState('gundam-forge.forge.desktopPanelOpen', true);

  if (!mounted) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative min-w-0">
      {/* Mobile: open card search button */}
      <button
        type="button"
        className="absolute top-2 left-2 z-20 md:hidden rounded bg-cobalt-600 px-3 py-1 text-sm text-white shadow"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open card search panel"
        aria-expanded={sidebarOpen}
      >
        Search Cards
      </button>

      {/* Mobile: open import button */}
      <button
        type="button"
        className="absolute top-2 right-2 z-20 md:hidden rounded bg-green-700 px-3 py-1 text-sm text-white shadow"
        onClick={() => setImportOpen(true)}
        aria-label="Import deck list"
      >
        Import
      </button>

      {/* Desktop sidebar collapse toggle — thin strip, hidden on mobile */}
      <button
        type="button"
        className="hidden md:flex items-center justify-center w-5 flex-shrink-0 border-r border-border bg-surface hover:bg-surface-interactive text-steel-500 hover:text-foreground transition-colors"
        onClick={() => setDesktopPanelOpen((v: boolean) => !v)}
        aria-label={desktopPanelOpen ? 'Collapse card search panel' : 'Expand card search panel'}
        title={desktopPanelOpen ? 'Collapse' : 'Expand'}
      >
        <span aria-hidden="true" className="text-xs leading-none select-none">
          {desktopPanelOpen ? '‹' : '›'}
        </span>
      </button>

      {/* Card search sidebar */}
      <div
        className={cn(
          // Mobile: full-screen overlay when sidebarOpen, otherwise hidden
          sidebarOpen ? 'fixed inset-0 z-30 flex' : 'hidden',
          // Desktop: respect desktopPanelOpen
          desktopPanelOpen ? 'md:flex md:static md:inset-auto md:z-auto md:relative' : 'md:hidden',
        )}
      >
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <div className="relative z-20 md:z-auto w-80 max-w-full min-w-0 h-full">
          <CardSearchPanel
            onSelect={(cardId) => { handleAdd(cardId); setSidebarOpen(false); }}
            deckColors={deckMeta.colors}
          />
          {/* Mobile: close button inside sidebar */}
          <button
            type="button"
            className="absolute top-2 right-2 md:hidden rounded bg-surface-interactive px-2 py-1 text-xs text-steel-700"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close card search panel"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Import modal */}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImport={(text) => {
            const r = handleImport(text);
            if (r.imported > 0 && r.notFound.length === 0) {
              showToast(`Imported ${r.imported} card type${r.imported !== 1 ? 's' : ''}.`);
            }
            return r;
          }}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg',
            toast.kind === 'warn' ? 'bg-amber-600 text-white' : 'bg-green-700 text-white',
          )}
          role="status"
          aria-live="polite"
        >
          {toast.msg}
        </div>
      )}

      {/* Main deck area */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Deck settings bar */}
        <DeckSettingsBar
          deckId={deckId}
          name={deckMeta.name}
          colors={deckMeta.colors}
          archetype={deckMeta.archetype}
          onNameChange={handleNameChange}
          onColorsChange={handleColorsChange}
          onArchetypeChange={handleArchetypeChange}
          onExport={handleExport}
        />

        {/* Import button (desktop — inside main area header) */}
        <div className="hidden md:flex flex-shrink-0 items-center justify-end border-b border-border px-4 py-1">
          <button
            type="button"
            className="rounded border border-border bg-surface-interactive px-3 py-1 text-xs font-medium text-steel-600 hover:bg-surface hover:text-foreground transition-colors"
            onClick={() => setImportOpen(true)}
            aria-label="Import deck list"
          >
            Import Deck
          </button>
        </div>

        {/* Pending import results banner (from deck-creation flow) */}
        {importResults && (
          <div className="flex-shrink-0 px-4 py-2">
            <ImportResultsSummary
              results={importResults}
              cards={allCards}
              onResolveAmbiguous={(_line, cardId, qty) => {
                setDeck((prev) => ({ ...prev, [cardId]: qty }));
              }}
              onRetryUnmatched={(_line, cardId, qty) => {
                setDeck((prev) => ({ ...prev, [cardId]: qty }));
              }}
              onDismiss={() => setImportResults(null)}
            />
          </div>
        )}

        <ValidationBar
          entries={Object.entries(deck).map(([cardId, qty]) => ({ cardId, qty }))}
          allCards={allCards as CardDefinition[]}
        />

        {/* Toolbar */}
        <div className="flex-none border-b border-border px-4">
          <DeckToolbar
            views={VIEW_REGISTRY.filter((v) => v.id !== 'table')}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            query={query}
            onQueryChange={setQuery}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            density={density}
            onDensityChange={setDensity}
          />
        </div>

        {/* Scrollable deck list */}
        <div className="flex-1 overflow-y-auto">
          {filteredDeckItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              {Object.keys(deck).length === 0 ? (
                <>
                  <p className="mb-1 text-sm text-steel-600">Your deck is empty.</p>
                  <p className="text-xs text-steel-700">
                    Use the card catalog on the left to add cards, or click{' '}
                    <button
                      type="button"
                      className="text-cobalt-400 underline hover:text-cobalt-300"
                      onClick={() => setImportOpen(true)}
                    >
                      Import Deck
                    </button>.
                  </p>
                </>
              ) : (
                <p className="text-sm text-steel-600">No cards match your search.</p>
              )}
            </div>
          ) : (
            <div className="p-4">
              <DeckListRenderer
                viewMode={viewMode}
                items={filteredDeckItems}
                selection={{ activeCardId }}
                actions={{
                  onOpenCard: setActiveCardId,
                  onAdd: handleAdd,
                  onRemove: handleRemove,
                }}
                ui={{ density, mode: 'builder', features: { collection: false, deckEdit: true } }}
              />
            </div>
          )}
        </div>

        <CardViewerModal
          items={filteredDeckItems}
          activeCardId={activeCardId}
          onOpenChange={(open) => { if (!open) setActiveCardId(null); }}
          onSelectCard={setActiveCardId}
        />
      </main>
    </div>
  );
}
