import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { CardDefinition } from '@gundam-forge/shared';
import { validateDeck } from '@gundam-forge/shared';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useCardsStore } from './cardsStore';
import { useDeckStore } from './deckStore';
import { ModernCardCatalog } from './ModernCardCatalog';
import { DeckBuilderPanel } from './DeckBuilderPanel';
import { EnhancedCardPreview } from './EnhancedCardPreview';
import { ImportDeckModal } from './ImportDeckModal';
import { GuestBanner } from '../../components/layout/GuestBanner';
import { Button } from '../../components/ui/Button';
import { LED } from '../../components/ui/LED';

interface ForgeWorkspaceProps {
  cards: CardDefinition[];
}

export function ForgeWorkspace({ cards }: ForgeWorkspaceProps) {
  const authUser = useAuthStore((s) => s.user);
  const openInspection = useUIStore((s) => s.openInspection);
  const selectedCardId = useCardsStore((s) => s.selectedCardId);
  const catalogCards = useCardsStore((s) => s.cards);
  const deckEntries = useDeckStore((s) => s.entries);

  const [importOpen, setImportOpen] = useState(false);

  const selectedCard = useMemo(
    () => catalogCards.find((c) => c.id === selectedCardId),
    [catalogCards, selectedCardId],
  );

  const validation = useMemo(
    () => validateDeck(deckEntries, catalogCards),
    [deckEntries, catalogCards],
  );

  const totalCards = deckEntries.reduce((s, e) => s + e.qty, 0);
  const ledStatus = validation.isValid ? 'valid' : validation.errors.length > 0 ? 'error' : 'warning';

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100vh - var(--gf-header-height))' }}>
      {/* Guest banner */}
      {!authUser && <GuestBanner />}

      {/* Forge toolbar */}
      <div className="flex items-center justify-between border-b border-gf-border bg-white px-4 py-2 flex-shrink-0">
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
          <Link to="/analytics">
            <Button
              variant="secondary"
              size="sm"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              Analytics
            </Button>
          </Link>
          <Link to="/sim">
            <Button
              variant="primary"
              size="sm"
              icon={
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              Test
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="gf-forge-layout flex-1">
        {/* Left: Catalog */}
        <div className="gf-forge-column bg-white gf-scroll">
          <ModernCardCatalog cards={cards} onInspect={openInspection} />
        </div>

        {/* Center: Deck list */}
        <div className="gf-forge-column gf-scroll">
          <DeckBuilderPanel cards={cards} onInspect={openInspection} />
        </div>

        {/* Right: Card detail dock */}
        <div className="gf-forge-column bg-white gf-scroll hidden xl:block">
          <EnhancedCardPreview card={selectedCard} onInspect={openInspection} />
        </div>
      </div>

      <ImportDeckModal open={importOpen} onClose={() => setImportOpen(false)} cards={cards} />
    </div>
  );
}
