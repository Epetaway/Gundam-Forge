import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
  const location = useLocation();

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

  const totalCards = useMemo(
    () => deckEntries.reduce((sum, e) => sum + e.qty, 0),
    [deckEntries]
  );

  const navItems = [
    { to: '/builder', label: 'Deck Builder' },
    { to: '/catalog', label: 'Card Catalog' },
    { to: '/sim', label: 'Deck Test' },
    { to: '/diagnostics', label: 'Analytics' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen w-full bg-gf-light">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gf-border bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              {/* GF Logo Icon */}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gf-blue to-gf-blue-dark">
                <span className="text-sm font-black text-white tracking-tight">GF</span>
              </div>
              <span className="font-heading text-xl font-bold text-gf-text">
                Gundam <span className="text-gf-blue">Forge</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(item.to)
                      ? 'text-gf-blue bg-gf-blue-light'
                      : 'text-gf-text-secondary hover:text-gf-text hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gf-text-secondary hover:bg-gray-100 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
            {/* Notifications */}
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gf-text-secondary hover:bg-gray-100 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {/* User Avatar */}
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gf-text-secondary hover:bg-gray-300 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {catalogCards.length === 0 ? (
        <div className="mx-auto max-w-7xl px-6 py-8">
          <section className="rounded-xl border border-gf-border bg-white p-4 text-sm text-gf-text">
            No cards loaded. Check `apps/web/src/data/cards.json`.
          </section>
        </div>
      ) : (
        <Routes>
          {/* Home / Redirect to builder */}
          <Route path="/" element={<Navigate to="/builder" replace />} />

          {/* Deck Builder - 3 Column Layout */}
          <Route
            path="/builder"
            element={
              <div className="flex h-[calc(100vh-64px)]">
                {/* Left Sidebar - Card Catalog */}
                <div className="w-80 flex-shrink-0 border-r border-gf-border bg-white overflow-y-auto custom-scrollbar">
                  <ModernCardCatalog cards={catalogCards} />
                </div>

                {/* Center - Deck List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gf-light">
                  <DeckBuilderPanel cards={catalogCards} />
                </div>

                {/* Right - Card Details */}
                <div className="w-80 flex-shrink-0 border-l border-gf-border bg-white overflow-y-auto custom-scrollbar">
                  <EnhancedCardPreview card={selectedCard} />
                </div>
              </div>
            }
          />

          {/* Card Catalog - Full Page */}
          <Route
            path="/catalog"
            element={
              <div className="flex h-[calc(100vh-64px)]">
                <div className="w-80 flex-shrink-0 border-r border-gf-border bg-white overflow-y-auto custom-scrollbar">
                  <ModernCardCatalog cards={catalogCards} />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {catalogCards.map((card) => {
                      const imageSrc = card.imageUrl || card.placeholderArt;
                      return (
                        <div
                          key={card.id}
                          className="cursor-pointer group"
                          onClick={() => useCardsStore.getState().setSelectedCardId(card.id)}
                        >
                          <div className="relative overflow-hidden rounded-lg border border-gf-border bg-white transition-all hover:border-gf-blue hover:shadow-md">
                            <div className="relative w-full pb-[140%] bg-gray-100">
                              <img
                                src={imageSrc}
                                alt={card.name}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-gf-blue text-xs font-bold text-white shadow">
                                {card.cost}
                              </div>
                            </div>
                          </div>
                          <p className="mt-1.5 truncate text-xs font-medium text-gf-text">{card.name}</p>
                          <p className="text-xs text-gf-text-secondary">{card.id}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            }
          />

          {/* Simulator */}
          <Route
            path="/sim"
            element={<SimulatorPanel cards={catalogCards} deckEntries={deckEntries} validation={validation} />}
          />

          {/* Diagnostics / Analytics */}
          <Route path="/diagnostics" element={
            <div className="mx-auto max-w-5xl px-6 py-8">
              <DiagnosticsPanel validation={validation} />
            </div>
          } />

          <Route path="*" element={<Navigate to="/builder" replace />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
