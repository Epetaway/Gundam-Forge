import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import cardsJson from './data/cards.json';
import { validateDeck, type CardDefinition } from '@gundam-forge/shared';
import { resolveCardImage } from './utils/resolveCardImage';
import { useBrokenImageStore } from './utils/brokenImageStore';
import { ModernCardCatalog } from './features/deckbuilder/ModernCardCatalog';
import { EnhancedCardPreview } from './features/deckbuilder/EnhancedCardPreview';
import { useCardsStore } from './features/deckbuilder/cardsStore';
import { DECK_STORAGE_KEY, serializeDeck, useDeckStore } from './features/deckbuilder/deckStore';
import { DeckBuilderPanel } from './features/deckbuilder/DeckBuilderPanel';
import { DiagnosticsPanel } from './features/diagnostics/DiagnosticsPanel';
import { SimulatorPanel } from './features/simulator/SimulatorPanel';
import { CardInspectionModal } from './features/deckbuilder/CardInspectionModal';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { useAuthStore } from './stores/authStore';
import { HomePage } from './features/home/HomePage';
import { DeckExplorerPage } from './features/decks/DeckExplorerPage';
import { PublicDeckViewPage } from './features/decks/PublicDeckViewPage';
import { NewsPage } from './features/news/NewsPage';
import { ImportDeckModal } from './features/deckbuilder/ImportDeckModal';

const cards = cardsJson as CardDefinition[];

function App() {
  const hydrateCards = useCardsStore((state) => state.hydrateCards);
  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const catalogCards = useCardsStore((state) => state.cards);
  const deckEntries = useDeckStore((state) => state.entries);
  const loadFromStorage = useDeckStore((state) => state.loadFromStorage);
  const hydratedFromStorage = useDeckStore((state) => state.hydratedFromStorage);

  const initializeAuth = useAuthStore((s) => s.initialize);

  const [inspectionCardId, setInspectionCardId] = useState<string | null>(null);
  const [navSearchQuery, setNavSearchQuery] = useState('');

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
        // noop
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [deckEntries, hydratedFromStorage]);

  const selectedCard = useMemo(
    () => catalogCards.find((card) => card.id === selectedCardId),
    [catalogCards, selectedCardId]
  );

  const inspectionCard = useMemo(
    () => catalogCards.find((card) => card.id === inspectionCardId),
    [catalogCards, inspectionCardId]
  );

  const validation = useMemo(() => validateDeck(deckEntries, catalogCards), [deckEntries, catalogCards]);

  const openInspection = useCallback((cardId: string) => {
    setInspectionCardId(cardId);
  }, []);

  const closeInspection = useCallback(() => {
    setInspectionCardId(null);
  }, []);

  // Keyboard: Space opens inspection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedCardId && !inspectionCardId) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        setInspectionCardId(selectedCardId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCardId, inspectionCardId]);

  return (
    <div className="min-h-screen w-full bg-gf-light">
      <Routes>
        {/* Auth routes (standalone layout) */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* All public routes get the app shell */}
        <Route
          path="*"
          element={
            <AppShell
              catalogCards={catalogCards}
              selectedCard={selectedCard}
              inspectionCard={inspectionCard}
              inspectionCardId={inspectionCardId}
              deckEntries={deckEntries}
              validation={validation}
              navSearchQuery={navSearchQuery}
              setNavSearchQuery={setNavSearchQuery}
              openInspection={openInspection}
              closeInspection={closeInspection}
            />
          }
        />
      </Routes>
    </div>
  );
}

/* ============================================================
   NAV ITEMS — updated for Moxfield-style structure
   ============================================================ */
const NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/decks', label: 'Deck Explorer' },
  { to: '/forge', label: 'Forge' },
  { to: '/cards', label: 'Cards' },
  { to: '/news', label: 'News' },
];

/* ============================================================
   APP SHELL — header + content + modal
   ============================================================ */
function AppShell({
  catalogCards,
  selectedCard,
  inspectionCard,
  inspectionCardId,
  deckEntries,
  validation,
  navSearchQuery,
  setNavSearchQuery,
  openInspection,
  closeInspection,
}: {
  catalogCards: CardDefinition[];
  selectedCard: CardDefinition | undefined;
  inspectionCard: CardDefinition | undefined;
  inspectionCardId: string | null;
  deckEntries: { cardId: string; qty: number }[];
  validation: ReturnType<typeof validateDeck>;
  navSearchQuery: string;
  setNavSearchQuery: (v: string) => void;
  openInspection: (cardId: string) => void;
  closeInspection: () => void;
}) {
  const location = useLocation();
  const authUser = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  // Hide the global header search on pages that have their own search
  const showGlobalSearch = ['/forge', '/cards'].some((p) => location.pathname.startsWith(p));

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-gf-border bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex h-14 items-center justify-between px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gf-blue to-gf-blue-dark">
                <span className="text-xs font-black text-white tracking-tight">GF</span>
              </div>
              <span className="font-heading text-lg font-bold text-gf-text">
                Gundam <span className="text-gf-blue">Forge</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="gf-nav-link"
                  data-active={isActive(item.to, item.exact)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: Search (only on forge/cards pages) */}
          {showGlobalSearch && (
            <div className="hidden lg:flex flex-1 max-w-xs mx-6">
              <div className="relative w-full">
                <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gf-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  className="w-full rounded-lg border border-gf-border bg-gf-light py-1.5 pl-9 pr-3 text-sm text-gf-text placeholder-gf-text-muted outline-none focus:border-gf-blue focus:bg-white focus:ring-1 focus:ring-gf-blue/30 transition-colors"
                  placeholder="Search cards..."
                  value={navSearchQuery}
                  onChange={(e) => {
                    setNavSearchQuery(e.target.value);
                    useCardsStore.getState().setQuery(e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          {/* Right: Auth / User */}
          <div className="flex items-center gap-2">
            {authUser ? (
              /* Logged-in user menu */
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gf-blue-light text-gf-blue hover:bg-gf-blue hover:text-white transition-colors"
                  aria-label="User menu"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gf-border bg-white shadow-lg z-50 overflow-hidden">
                      <div className="border-b border-gf-border px-4 py-3">
                        <p className="text-xs font-medium text-gf-text truncate">{authUser.email}</p>
                        <p className="text-[10px] text-gf-text-muted mt-0.5">Pilot Account</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gf-text hover:bg-gf-light transition-colors">
                          My Profile
                        </Link>
                        <Link to="/forge" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gf-text hover:bg-gf-light transition-colors">
                          My Decks
                        </Link>
                        <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Guest: show login/register */
              <>
                <Link to="/auth/login" className="text-xs font-medium text-gf-text-secondary hover:text-gf-text transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/auth/register" className="gf-btn gf-btn-primary text-xs py-1.5 px-4">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="gf-accent-line" />
      </header>

      {/* ── Page Content ── */}
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Deck Explorer */}
        <Route path="/decks" element={<DeckExplorerPage />} />
        <Route path="/decks/:id" element={<PublicDeckViewPage />} />

        {/* Forge (Deck Builder) — public, save requires login */}
        <Route
          path="/forge"
          element={
            <ForgeWorkspace
              catalogCards={catalogCards}
              selectedCard={selectedCard}
              deckEntries={deckEntries}
              validation={validation}
              openInspection={openInspection}
            />
          }
        />

        {/* Cards Database */}
        <Route
          path="/cards"
          element={
            <CardDatabasePage
              catalogCards={catalogCards}
              onInspect={openInspection}
            />
          }
        />

        {/* Simulator */}
        <Route
          path="/sim"
          element={<SimulatorPanel cards={catalogCards} deckEntries={deckEntries} validation={validation} />}
        />

        {/* Analytics */}
        <Route path="/analytics" element={
          <div className="mx-auto max-w-5xl px-6 py-8">
            <DiagnosticsPanel validation={validation} />
          </div>
        } />

        {/* News */}
        <Route path="/news" element={<NewsPage />} />

        {/* Legacy redirects */}
        <Route path="/builder" element={<Navigate to="/forge" replace />} />
        <Route path="/catalog" element={<Navigate to="/cards" replace />} />
        <Route path="/diagnostics" element={<Navigate to="/analytics" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ── Inspection Modal ── */}
      <CardInspectionModal
        card={inspectionCard}
        open={inspectionCardId !== null}
        onClose={closeInspection}
      />
    </>
  );
}

/* ============================================================
   FORGE WORKSPACE — 3-column deck builder
   ============================================================ */
function ForgeWorkspace({
  catalogCards,
  selectedCard,
  deckEntries,
  validation,
  openInspection,
}: {
  catalogCards: CardDefinition[];
  selectedCard: CardDefinition | undefined;
  deckEntries: { cardId: string; qty: number }[];
  validation: ReturnType<typeof validateDeck>;
  openInspection: (cardId: string) => void;
}) {
  const authUser = useAuthStore((s) => s.user);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="relative">
      {/* Guest banner */}
      {!authUser && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center">
          <span className="text-xs text-yellow-800">
            You're in guest mode. <Link to="/auth/login" className="font-bold text-yellow-900 underline hover:no-underline">Sign in</Link> to save your decks to the cloud.
          </span>
        </div>
      )}

      {/* Forge toolbar */}
      <div className="flex items-center justify-between border-b border-gf-border bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gf-text">Forge</h2>
          <span className="text-[10px] text-gf-text-muted">
            {deckEntries.reduce((s, e) => s + e.qty, 0)} cards
          </span>
          {!validation.isValid && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-600">
              {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gf-border bg-white px-3 py-1.5 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Import
          </button>
          <Link
            to="/analytics"
            className="flex items-center gap-1.5 rounded-lg border border-gf-border bg-white px-3 py-1.5 text-xs font-medium text-gf-text hover:bg-gf-light transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Analytics
          </Link>
          <Link
            to="/sim"
            className="flex items-center gap-1.5 rounded-lg bg-gf-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-gf-blue-dark transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Test
          </Link>
        </div>
      </div>

      <div className="gf-blueprint" style={{ height: authUser ? 'calc(100vh - 58px - 44px)' : 'calc(100vh - 58px - 44px - 36px)' }}>
        <div className="grid h-full" style={{ gridTemplateColumns: '320px 1fr 380px' }}>
          <div className="border-r border-gf-border bg-white overflow-y-auto custom-scrollbar">
            <ModernCardCatalog cards={catalogCards} onInspect={openInspection} />
          </div>
          <div className="overflow-y-auto custom-scrollbar">
            <DeckBuilderPanel cards={catalogCards} onInspect={openInspection} />
          </div>
          <div className="border-l border-gf-border bg-white overflow-y-auto custom-scrollbar">
            <EnhancedCardPreview card={selectedCard} onInspect={openInspection} />
          </div>
        </div>
      </div>

      <ImportDeckModal open={importOpen} onClose={() => setImportOpen(false)} cards={catalogCards} />
    </div>
  );
}

/* ============================================================
   CARD DATABASE PAGE — full card browser
   ============================================================ */
function CardDatabasePage({
  catalogCards,
  onInspect,
}: {
  catalogCards: CardDefinition[];
  onInspect: (cardId: string) => void;
}) {
  const brokenIds = useBrokenImageStore((state) => state.brokenIds);
  const markBroken = useBrokenImageStore((state) => state.markBroken);
  const addCard = useDeckStore((state) => state.addCard);

  return (
    <div className="gf-blueprint" style={{ height: 'calc(100vh - 58px)' }}>
      <div className="grid h-full" style={{ gridTemplateColumns: '320px 1fr' }}>
        <div className="border-r border-gf-border bg-white overflow-y-auto custom-scrollbar">
          <ModernCardCatalog cards={catalogCards} onInspect={onInspect} />
        </div>
        <div className="overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {catalogCards.map((card) => {
              if (brokenIds[card.id]) return null;
              const imageSrc = resolveCardImage(card);
              return (
                <div
                  key={card.id}
                  className="cursor-pointer group"
                  onClick={() => useCardsStore.getState().setSelectedCardId(card.id)}
                  onDoubleClick={() => onInspect(card.id)}
                >
                  <div className="gf-card-tile bg-white">
                    <div className="relative w-full pb-[140%] bg-gray-100">
                      <img
                        src={imageSrc}
                        alt={card.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        onError={() => markBroken(card.id)}
                      />
                      <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-gf-blue text-xs font-bold text-white shadow">
                        {card.cost}
                      </div>
                    </div>
                    <button
                      className="gf-quick-add"
                      onClick={(e) => { e.stopPropagation(); addCard(card.id); }}
                      aria-label={`Add ${card.name} to deck`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1.5 truncate text-xs font-medium text-gf-text">{card.name}</p>
                  <p className="text-[10px] text-gf-text-secondary">{card.id}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
