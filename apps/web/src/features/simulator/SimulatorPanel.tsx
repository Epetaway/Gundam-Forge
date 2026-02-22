import { useEffect, useMemo, useState } from 'react';
import { OFFICIAL_PLAYMAT_ZONE_TEMPLATE, type CardDefinition, type DeckValidationResult } from '@gundam-forge/shared';
import type { DeckEntry } from '../deckbuilder/deckStore';
import { buildDeckSignature } from '../deckbuilder/deckSelectors';
import { PlaymatRoot } from './PlaymatRoot';
import { useSimStore } from './simStore';

interface SimulatorPanelProps {
  cards: CardDefinition[];
  deckEntries: DeckEntry[];
  validation: DeckValidationResult;
}

export function SimulatorPanel({ cards, deckEntries, validation }: SimulatorPanelProps) {
  const deckPile = useSimStore((state) => state.deckPile);
  const hand = useSimStore((state) => state.hand);
  const zones = useSimStore((state) => state.zones);
  const initializeFromDeck = useSimStore((state) => state.initializeFromDeck);
  const reset = useSimStore((state) => state.reset);
  const shuffle = useSimStore((state) => state.shuffle);
  const draw = useSimStore((state) => state.draw);
  const mulligan = useSimStore((state) => state.mulligan);
  const moveCard = useSimStore((state) => state.moveCard);
  const toggleTapped = useSimStore((state) => state.toggleTapped);

  const [turnCount, setTurnCount] = useState(0);
  const [resources, setResources] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);

  const zoneIds = useMemo(() => OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => zone.id), []);
  const deckSignature = useMemo(() => buildDeckSignature(deckEntries), [deckEntries]);
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  useEffect(() => {
    initializeFromDeck(deckEntries, zoneIds);
  }, [deckSignature, deckEntries, initializeFromDeck, zoneIds]);

  const addLog = (message: string) => {
    setGameLog((prev) => [`Turn ${turnCount}: ${message}`, ...prev].slice(0, 20));
  };

  const handleDraw = (count: number) => {
    draw(count);
    addLog(`Drew ${count} card(s)`);
  };

  const handleMulligan = () => {
    mulligan();
    addLog('Mulligan - shuffled hand back into deck');
  };

  const handleShuffle = () => {
    shuffle();
    addLog('Deck shuffled');
  };

  const handleNextTurn = () => {
    setTurnCount((prev) => prev + 1);
    setResources((prev) => prev + 1);
    handleDraw(1);
    addLog('New turn started');
  };

  const handleReset = () => {
    reset();
    setTurnCount(0);
    setResources(0);
    setGameLog([]);
    addLog('Game reset');
  };

  useEffect(() => {
    initializeFromDeck(deckEntries, zoneIds);
  }, [deckSignature, deckEntries, initializeFromDeck, zoneIds]);

  if (deckEntries.length === 0) {
    return (
      <section className="rounded-lg border border-gcg-border bg-white p-8 text-center shadow-sm">
        <svg className="mx-auto mb-4 h-16 w-16 opacity-30 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 22h20L12 2zm0 5l7 13H5l7-13z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 10v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2 className="text-lg font-bold tracking-wider text-gcg-dark">No Deck Loaded</h2>
        <p className="mt-2 text-xs uppercase tracking-wider text-gray-600">
          Build a deck in the Deck Builder before starting simulation
        </p>
      </section>
    );
  }

  if (!validation.isValid) {
    return (
      <section className="rounded-lg border-2 border-yellow-500 bg-yellow-50 p-4 shadow-sm">
        <h2 className="text-lg font-bold uppercase tracking-wider text-yellow-700">Simulator Locked</h2>
        <p className="mt-2 text-sm text-gcg-dark">Fix deck validation errors before running a playtest.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Game State Panel */}
      <section className="relative rounded-lg border border-gcg-border bg-white p-4 shadow-sm">
        
        <div className="mb-4 grid grid-cols-3 gap-3">
          {/* Turn Counter */}
          <div className="rounded-lg border border-gcg-border bg-gcg-light p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-600">Turn</p>
            <p className="mt-1 text-3xl font-bold text-gcg-dark">{turnCount}</p>
          </div>

          {/* Resources */}
          <div className="rounded-lg border border-gcg-border bg-gcg-light p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-600">Resources</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <button
                onClick={() => setResources((prev) => Math.max(0, prev - 1))}
                className="flex h-6 w-6 items-center justify-center rounded border border-red-500 bg-red-50 font-bold text-red-600 hover:bg-red-500 hover:text-white"
              >
                -
              </button>
              <span className="min-w-12 text-2xl font-bold text-gcg-dark">{resources}</span>
              <button
                onClick={() => setResources((prev) => prev + 1)}
                className="flex h-6 w-6 items-center justify-center rounded border border-green-500 bg-green-50 font-bold text-green-600 hover:bg-green-500 hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          {/* Deck/Hand Info */}
          <div className="rounded-lg border border-gcg-border bg-gcg-light p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-600">Cards</p>
            <p className="mt-1 text-sm text-gcg-dark">
              Deck: <span className="font-bold">{deckPile.length}</span>
            </p>
            <p className="text-sm text-gcg-dark">
              Hand: <span className="font-bold">{hand.length}</span>
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleNextTurn}
            className="flex-1 rounded border-2 border-gcg-primary bg-gcg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-wider text-gcg-primary transition-all hover:bg-gcg-primary hover:text-white"
          >
            Next Turn
          </button>
          <button
            onClick={() => handleDraw(1)}
            className="rounded border-2 border-blue-600 bg-blue-50 px-4 py-2 text-sm font-bold uppercase tracking-wider text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
          >
            Draw Card
          </button>
          <button
            onClick={handleShuffle}
            className="rounded border-2 border-gray-400 bg-gray-100 px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-700 transition-all hover:border-gray-600 hover:bg-gray-200"
          >
            Shuffle
          </button>
          <button
            onClick={handleMulligan}
            className="rounded border-2 border-yellow-600 bg-yellow-50 px-4 py-2 text-sm font-bold uppercase tracking-wider text-yellow-600 transition-all hover:bg-yellow-600 hover:text-white"
          >
            Mulligan
          </button>
          <button
            onClick={handleReset}
            className="rounded border-2 border-red-600 bg-red-50 px-4 py-2 text-sm font-bold uppercase tracking-wider text-red-600 transition-all hover:bg-red-600 hover:text-white"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Game Log */}
      {gameLog.length > 0 && (
        <section className="rounded-lg border border-gcg-border bg-white p-3 shadow-sm">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gcg-dark">
            Game Log
          </h3>
          <div className="max-h-32 space-y-1 overflow-y-auto text-xs text-gray-600">
            {gameLog.map((log, i) => (
              <div key={i} className="border-l-2 border-gcg-primary pl-2">
                {log}
              </div>
            ))}
          </div>
        </section>
      )}

      <PlaymatRoot
        cardsById={cardsById}
        deckPile={deckPile}
        hand={hand}
        zones={zones}
        onDropToHand={(instanceId) => moveCard(instanceId, { kind: 'hand' })}
        onDropToZone={(instanceId, zoneId) => moveCard(instanceId, { kind: 'zone', zoneId })}
        onToggleTapped={toggleTapped}
      />
    </div>
  );
}
