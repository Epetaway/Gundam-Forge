import { useEffect, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import cardsJson from './data/cards.json';
import { validateDeck, type CardDefinition } from '@gundam-forge/shared';
import { useCardsStore } from './features/deckbuilder/cardsStore';
import { DECK_STORAGE_KEY, serializeDeck, useDeckStore } from './features/deckbuilder/deckStore';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useCollectionStore } from './stores/collectionStore';

// Layout
import { Header } from './components/layout/Header';

// Feature pages
import { HomePage } from './features/home/HomePage';
import { DeckExplorerPage } from './features/decks/DeckExplorerPage';
import { PublicDeckViewPage } from './features/decks/PublicDeckViewPage';
import { ForgeWorkspace } from './features/deckbuilder/ForgeWorkspace';
import { CardDatabasePage } from './features/cards/CardDatabasePage';
import { DiagnosticsPanel } from './features/diagnostics/DiagnosticsPanel';
import { SimulatorPanel } from './features/simulator/SimulatorPanel';
import { DeckLibraryPage } from './features/decks/DeckLibraryPage';
import { NewsPage } from './features/news/NewsPage';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { CardInspectionModal } from './features/deckbuilder/CardInspectionModal';

const cards = cardsJson as CardDefinition[];

function App() {
  const hydrateCards = useCardsStore((s) => s.hydrateCards);
  const catalogCards = useCardsStore((s) => s.cards);
  const deckEntries = useDeckStore((s) => s.entries);
  const loadFromStorage = useDeckStore((s) => s.loadFromStorage);
  const hydratedFromStorage = useDeckStore((s) => s.hydratedFromStorage);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const authUser = useAuthStore((s) => s.user);
  const loadCollection = useCollectionStore((s) => s.loadCollection);
  const clearCollection = useCollectionStore((s) => s.clearCollection);

  const inspectedCardId = useUIStore((s) => s.inspectedCardId);
  const closeInspection = useUIStore((s) => s.closeInspection);

  // Initialize auth, cards, deck on mount
  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => { hydrateCards(cards); }, [hydrateCards]);
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  // Load collection when user signs in, clear on sign out
  useEffect(() => {
    if (authUser) {
      loadCollection();
    } else {
      clearCollection();
    }
  }, [authUser, loadCollection, clearCollection]);

  // Persist deck to localStorage (debounced)
  useEffect(() => {
    if (!hydratedFromStorage) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(DECK_STORAGE_KEY, serializeDeck(deckEntries));
      } catch { /* noop */ }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [deckEntries, hydratedFromStorage]);

  const inspectionCard = useMemo(
    () => catalogCards.find((c) => c.id === inspectedCardId),
    [catalogCards, inspectedCardId],
  );

  const validation = useMemo(
    () => validateDeck(deckEntries, catalogCards),
    [deckEntries, catalogCards],
  );

  // Keyboard: Space opens inspection for selected card
  const selectedCardId = useCardsStore((s) => s.selectedCardId);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedCardId && !inspectedCardId) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        useUIStore.getState().openInspection(selectedCardId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardId, inspectedCardId]);

  return (
    <div className="min-h-screen w-full bg-white">
      <Routes>
        {/* Auth routes — standalone layout */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* All other routes get the AppShell */}
        <Route
          path="*"
          element={
            <AppShell
              cards={cards}
              catalogCards={catalogCards}
              deckEntries={deckEntries}
              validation={validation}
              inspectionCard={inspectionCard}
              inspectedCardId={inspectedCardId}
              closeInspection={closeInspection}
            />
          }
        />
      </Routes>
    </div>
  );
}

/* ============================================================
   APP SHELL — Header + Routes + Modal
   ============================================================ */
function AppShell({
  cards,
  catalogCards,
  deckEntries,
  validation,
  inspectionCard,
  inspectedCardId,
  closeInspection,
}: {
  cards: CardDefinition[];
  catalogCards: CardDefinition[];
  deckEntries: { cardId: string; qty: number }[];
  validation: ReturnType<typeof validateDeck>;
  inspectionCard: CardDefinition | undefined;
  inspectedCardId: string | null;
  closeInspection: () => void;
}) {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/decks" element={<DeckExplorerPage />} />
        <Route path="/decks/:id" element={<PublicDeckViewPage />} />
        <Route path="/forge" element={<ForgeWorkspace cards={cards} />} />
        <Route path="/cards" element={<CardDatabasePage cards={cards} />} />
        <Route
          path="/sim"
          element={
            <SimulatorPanel
              cards={catalogCards}
              deckEntries={deckEntries}
              validation={validation}
            />
          }
        />
        <Route
          path="/analytics"
          element={
            <div className="gf-container py-8">
              <DiagnosticsPanel validation={validation} />
            </div>
          }
        />
        <Route path="/my-decks" element={<DeckLibraryPage />} />
        <Route path="/news" element={<NewsPage />} />

        {/* Legacy redirects */}
        <Route path="/builder" element={<Navigate to="/forge" replace />} />
        <Route path="/catalog" element={<Navigate to="/cards" replace />} />
        <Route path="/diagnostics" element={<Navigate to="/analytics" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Inspection Modal (global, single instance) */}
      <CardInspectionModal
        card={inspectionCard}
        open={inspectedCardId !== null}
        onClose={closeInspection}
      />
    </>
  );
}

export default App;
