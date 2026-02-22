import { useEffect, useMemo } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import cardsJson from './data/cards.json';
import { validateDeck, type CardDefinition } from '@gundam-forge/shared';
import { ModernCardCatalog } from './features/deckbuilder/ModernCardCatalog';
import { EnhancedCardPreview } from './features/deckbuilder/EnhancedCardPreview';
import { useCardsStore } from './features/deckbuilder/cardsStore';
import { DECK_STORAGE_KEY, serializeDeck, useDeckStore } from './features/deckbuilder/deckStore';
import { DeckBuilderPanel } from './features/deckbuilder/DeckBuilderPanel';
import { DiagnosticsPanel } from './features/diagnostics/DiagnosticsPanel';
import { SimulatorPanel } from './features/simulator/SimulatorPanel';

const cards = cardsJson as CardDefinition[];

function App() {
  const hydrateCards = useCardsStore((state) => state.hydrateCards);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const catalogCards = useCardsStore((state) => state.cards);
  const deckEntries = useDeckStore((state) => state.entries);
  const loadFromStorage = useDeckStore((state) => state.loadFromStorage);
  const hydratedFromStorage = useDeckStore((state) => state.hydratedFromStorage);

  useEffect(() => {
    hydrateCards(cards);
  }, [hydrateCards]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!hydratedFromStorage) return;

    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(DECK_STORAGE_KEY, serializeDeck(deckEntries));
      } catch {
        // noop - storage may be unavailable
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [deckEntries, hydratedFromStorage]);

  const selectedCard = useMemo(
    () => catalogCards.find((card) => card.id === selectedCardId),
    [catalogCards, selectedCardId]
  );

  const validation = useMemo(() => validateDeck(deckEntries, catalogCards), [deckEntries, catalogCards]);

  const navItems = [
    { to: '/', label: 'Hangar' },
    { to: '/builder', label: 'Builder' },
    { to: '/sim', label: 'Simulator' },
    { to: '/diagnostics', label: 'Diagnostics' }
  ];

  return (
    <main className="relative min-h-screen w-full bg-gcg-light">
      {/* Header - Official GCG Style */}
      <header className="bg-white border-b border-gcg-border shadow-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="text-gcg-primary font-heading text-2xl font-bold">
                GUNDAM CARD GAME
              </div>
            </Link>
            
            {/* Navigation - Official Style */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-4 py-2 text-sm font-medium text-gcg-text hover:text-gcg-primary hover:bg-gcg-light rounded transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-6 py-8">
      {catalogCards.length === 0 ? (
        <section className="rounded-lg border border-gcg-border bg-white p-4 text-sm text-gcg-text">
          No cards loaded. Check `apps/web/src/data/cards.json`.
        </section>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <section className="text-center py-12">
                <h2 className="font-heading text-4xl font-bold text-gcg-text mb-4">
                  Welcome to GUNDAM CARD GAME
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Build your deck, test strategies, and master the game with our comprehensive deck builder and simulator.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Link 
                    to="/builder" 
                    className="inline-block bg-gcg-primary hover:bg-gcg-hover text-white font-medium px-8 py-3 rounded transition-colors"
                  >
                    Start Building
                  </Link>
                  <Link 
                    to="/sim" 
                    className="inline-block bg-white hover:bg-gcg-light border border-gcg-border text-gcg-text font-medium px-8 py-3 rounded transition-colors"
                  >
                    Open Simulator
                  </Link>
                </div>
                
                {/* Stats */}
                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <div className="bg-white border border-gcg-border rounded-lg p-6">
                    <div className="text-3xl font-bold text-gcg-primary mb-2">{catalogCards.length}</div>
                    <div className="text-sm text-gray-600">Cards Available</div>
                  </div>
                  <div className="bg-white border border-gcg-border rounded-lg p-6">
                    <div className="text-3xl font-bold text-gcg-primary mb-2">{deckEntries.length}</div>
                    <div className="text-sm text-gray-600">Cards in Deck</div>
                  </div>
                  <div className="bg-white border border-gcg-border rounded-lg p-6">
                    <div className="text-3xl font-bold text-gcg-primary mb-2">{validation.isValid ? 'Valid' : 'Invalid'}</div>
                    <div className="text-sm text-gray-600">Deck Status</div>
                  </div>
                </div>
              </section>
            }
          />

          <Route
            path="/builder"
            element={
              <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <ModernCardCatalog cards={catalogCards} />
                <div className="flex flex-col gap-6 xl:col-span-1">
                  <EnhancedCardPreview card={selectedCard} />
                  <DeckBuilderPanel cards={catalogCards} />
                </div>
              </div>
            }
          />

          <Route
            path="/sim"
            element={<SimulatorPanel cards={catalogCards} deckEntries={deckEntries} validation={validation} />}
          />

          <Route path="/diagnostics" element={<DiagnosticsPanel validation={validation} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      </div>
    </main>
  );
}

export default App;
