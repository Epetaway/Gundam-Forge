import { useEffect, useMemo } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import cardsJson from './data/cards.json';
import { validateDeck, type CardDefinition } from '@gundam-forge/shared';
import { CardCatalog } from './features/deckbuilder/CardCatalog';
import { CardPreviewPanel } from './features/deckbuilder/CardPreviewPanel';
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
    <main className="mx-auto min-h-screen w-full max-w-7xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gundam Forge</h1>
          <p className="text-sm text-slate-400">Deck Builder + Playtest Simulator Beta</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {catalogCards.length === 0 ? (
        <section className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
          No cards loaded. Check `apps/web/src/data/cards.json`.
        </section>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
                <h2 className="text-xl font-semibold">Hangar</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Build a legal 60-card deck, then move to simulator and diagnostics.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/builder" className="rounded bg-sky-700 px-3 py-1.5 text-sm hover:bg-sky-600">
                    Open Builder
                  </Link>
                  <Link to="/sim" className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
                    Open Simulator
                  </Link>
                  <Link to="/diagnostics" className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
                    Open Diagnostics
                  </Link>
                </div>
              </section>
            }
          />

          <Route
            path="/builder"
            element={
              <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
                <CardCatalog cards={catalogCards} />
                <DeckBuilderPanel cards={catalogCards} />
                <CardPreviewPanel card={selectedCard} />
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
    </main>
  );
}

export default App;
