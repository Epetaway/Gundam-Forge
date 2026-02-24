import { useState, useMemo, useCallback } from 'react';
import type { CardDefinition } from '@gundam-forge/shared';
import { validateDeck } from '@gundam-forge/shared';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';
import { resolveDeckEntries } from './deckSelectors';
import { ModernCardCatalog } from './ModernCardCatalog';
import { DeckBuilderPanel } from './DeckBuilderPanel';
import { EnhancedCardPreview } from './EnhancedCardPreview';
import { ImportDeckModal } from './ImportDeckModal';
import { DeckStats } from './DeckStats';
import { SimulatorPanel } from '../simulator/SimulatorPanel';
import { GuestBanner } from '../../components/layout/GuestBanner';
import { Button } from '../../components/ui/Button';
import { LED } from '../../components/ui/LED';
import { buildDeckExport } from './DeckBuilderPanel';

interface ForgeWorkspaceProps {
  cards: CardDefinition[];
}

type ExportFormat = 'text' | 'csv' | 'json';

function exportDeckAs(
  format: ExportFormat,
  resolvedEntries: Array<{ qty: number; card: CardDefinition }>,
) {
  if (format === 'text') {
    const sorted = resolvedEntries.map((e) => ({
      qty: e.qty,
      name: e.card.name,
      type: e.card.type,
      cost: e.card.cost,
    }));
    return buildDeckExport(sorted);
  }

  if (format === 'csv') {
    const header = 'Qty,Name,ID,Type,Color,Cost';
    const rows = resolvedEntries.map(
      (e) => `${e.qty},"${e.card.name}",${e.card.id},${e.card.type},${e.card.color},${e.card.cost}`,
    );
    return [header, ...rows].join('\n');
  }

  // JSON
  const data = resolvedEntries.map((e) => ({
    qty: e.qty,
    id: e.card.id,
    name: e.card.name,
    type: e.card.type,
    color: e.card.color,
    cost: e.card.cost,
  }));
  return JSON.stringify(data, null, 2);
}

export function ForgeWorkspace({ cards }: ForgeWorkspaceProps) {
  const authUser = useAuthStore((s) => s.user);
  const openInspection = useUIStore((s) => s.openInspection);
  const catalogCollapsed = useUIStore((s) => s.catalogCollapsed);
  const detailDockCollapsed = useUIStore((s) => s.detailDockCollapsed);
  const toggleCatalog = useUIStore((s) => s.toggleCatalog);
  const toggleDetailDock = useUIStore((s) => s.toggleDetailDock);
  const selectedCardId = useCardsStore((s) => s.selectedCardId);
  const catalogCards = useCardsStore((s) => s.cards);
  const cardsById = useCardsStore((s) => s.cardsById);
  const deckEntries = useDeckStore((s) => s.entries);

  const [importOpen, setImportOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => selectedCardId ? cardsById.get(selectedCardId) : undefined,
    [cardsById, selectedCardId],
  );

  const validation = useMemo(
    () => validateDeck(deckEntries, catalogCards),
    [deckEntries, catalogCards],
  );

  const resolvedEntries = useMemo(
    () => resolveDeckEntries(deckEntries, cardsById),
    [deckEntries, cardsById],
  );

  const totalCards = deckEntries.reduce((s, e) => s + e.qty, 0);
  const ledStatus = validation.isValid ? 'valid' : validation.errors.length > 0 ? 'error' : 'warning';

  const handleExport = useCallback(async (format: ExportFormat) => {
    const text = exportDeckAs(format, resolvedEntries);
    try {
      await navigator.clipboard.writeText(text);
      setExportToast(`Copied as ${format.toUpperCase()}`);
      setTimeout(() => setExportToast(null), 2000);
    } catch {
      // Fallback: create download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deck.${format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportMenuOpen(false);
  }, [resolvedEntries]);

  const layoutClasses = [
    'gf-forge-layout flex-1',
    catalogCollapsed ? 'gf-forge-catalog-collapsed' : '',
    detailDockCollapsed ? 'gf-forge-dock-collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100vh - var(--gf-header-height))' }}>
      {/* Guest banner */}
      {!authUser && <GuestBanner />}

      {/* Forge toolbar */}
      <div className="flex items-center justify-between border-b border-gf-border bg-gf-white px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gf-text">Forge</h2>
          <LED status={ledStatus} label={`${totalCards}/50 cards`} />
          {!validation.isValid && (
            <span className="rounded-full bg-gf-error-bg px-2 py-0.5 text-[10px] font-semibold text-gf-error">
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setImportOpen(true)}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Import
          </Button>

          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExportMenuOpen((o) => !o)}
              icon={
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              Export
            </Button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-dropdown" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-gf-border bg-gf-white shadow-lg z-dropdown overflow-hidden animate-fade-in">
                  {(['text', 'csv', 'json'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
                    >
                      {fmt === 'text' && 'Plain Text'}
                      {fmt === 'csv' && 'CSV Spreadsheet'}
                      {fmt === 'json' && 'JSON Data'}
                    </button>
                  ))}
                </div>
              </>
            )}
            {/* Export toast */}
            {exportToast && (
              <div className="absolute right-0 top-full mt-1 rounded-lg bg-gf-success px-3 py-1.5 text-xs font-medium text-white shadow-md z-toast animate-fade-in">
                {exportToast}
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowStats((s) => !s)}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            {showStats ? 'Hide Stats' : 'Stats'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSimulator(true)}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            Test
          </Button>
        </div>
      </div>

      {/* Inline Stats Panel */}
      {showStats && (
        <div className="border-b border-gf-border bg-gf-white overflow-y-auto flex-shrink-0" style={{ maxHeight: '320px' }}>
          <div className="px-4 py-4">
            <DeckStats resolvedEntries={resolvedEntries} />
          </div>
        </div>
      )}

      {/* 3-column layout */}
      <div className={layoutClasses}>
        {/* Catalog collapse toggle */}
        <button
          onClick={toggleCatalog}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-raised hidden md:flex h-8 w-4 items-center justify-center rounded-r bg-gf-border/50 hover:bg-gf-border text-gf-text-muted hover:text-gf-text transition-colors"
          style={{ left: catalogCollapsed ? 0 : 'var(--gf-sidebar-width)' }}
          aria-label={catalogCollapsed ? 'Show catalog' : 'Hide catalog'}
        >
          <svg className={`h-3 w-3 transition-transform ${catalogCollapsed ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Left: Catalog */}
        {!catalogCollapsed && (
          <div className="gf-forge-column bg-gf-white gf-scroll">
            <ModernCardCatalog cards={cards} onInspect={openInspection} />
          </div>
        )}

        {/* Center: Deck list */}
        <div className="gf-forge-column gf-scroll">
          <DeckBuilderPanel cards={cards} onInspect={openInspection} />
        </div>

        {/* Right: Card detail dock */}
        {!detailDockCollapsed && (
          <div className="gf-forge-column bg-gf-white gf-scroll hidden xl:block">
            <EnhancedCardPreview card={selectedCard} onInspect={openInspection} />
          </div>
        )}

        {/* Dock collapse toggle */}
        <button
          onClick={toggleDetailDock}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-raised hidden xl:flex h-8 w-4 items-center justify-center rounded-l bg-gf-border/50 hover:bg-gf-border text-gf-text-muted hover:text-gf-text transition-colors"
          aria-label={detailDockCollapsed ? 'Show card preview' : 'Hide card preview'}
        >
          <svg className={`h-3 w-3 transition-transform ${detailDockCollapsed ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <ImportDeckModal open={importOpen} onClose={() => setImportOpen(false)} cards={cards} />

      {/* Simulator Overlay */}
      {showSimulator && (
        <div className="fixed inset-0 z-modal bg-gf-light animate-fade-in">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gf-border bg-gf-white px-4 py-2">
            <h2 className="text-sm font-bold text-gf-text">Playtester</h2>
            <Button variant="secondary" size="sm" onClick={() => setShowSimulator(false)}>
              Close
            </Button>
          </div>
          <div className="h-[calc(100vh-48px)] overflow-auto">
            <SimulatorPanel
              cards={catalogCards}
              deckEntries={deckEntries}
              validation={validation}
            />
          </div>
        </div>
      )}
    </div>
  );
}
