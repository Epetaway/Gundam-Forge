import { useEffect, useMemo, useState } from 'react';
import { OFFICIAL_PLAYMAT_ZONE_TEMPLATE, type CardDefinition, type DeckValidationResult } from '@gundam-forge/shared';
import type { DeckEntry } from '../deckbuilder/deckStore';
import { buildDeckSignature } from '../deckbuilder/deckSelectors';
import { PlaymatRoot } from './PlaymatRoot';
import { useSimStore } from './simStore';
import { useCardsStore } from '../deckbuilder/cardsStore';

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

  const selectedCardId = useCardsStore((state) => state.selectedCardId);
  const setSelectedCardId = useCardsStore((state) => state.setSelectedCardId);

  const [turnCount, setTurnCount] = useState(0);
  const [resources, setResources] = useState(0);
  const [deckName] = useState('RX-78 Strike Force');
  const [activeZoneTab, setActiveZoneTab] = useState<'units' | 'pilots' | 'commands'>('units');

  const zoneIds = useMemo(() => OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => zone.id), []);
  const deckSignature = useMemo(() => buildDeckSignature(deckEntries), [deckEntries]);
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const totalCards = useMemo(
    () => deckEntries.reduce((sum, e) => sum + e.qty, 0),
    [deckEntries]
  );

  useEffect(() => {
    initializeFromDeck(deckEntries, zoneIds);
  }, [deckSignature, deckEntries, initializeFromDeck, zoneIds]);

  const handleDraw = (count: number) => {
    draw(count);
  };

  const handleMulligan = () => {
    mulligan();
  };

  const handleShuffle = () => {
    shuffle();
  };

  const handleNextTurn = () => {
    setTurnCount((prev) => prev + 1);
    setResources((prev) => prev + 1);
    handleDraw(1);
  };

  const handleReset = () => {
    reset();
    setTurnCount(0);
    setResources(0);
  };

  const selectedCard = selectedCardId ? cardsById.get(selectedCardId) : undefined;

  if (deckEntries.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gf-light">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 22h20L12 2zm0 5l7 13H5l7-13z" strokeWidth="1.5" />
          </svg>
          <h2 className="text-lg font-bold text-gf-text">No Deck Loaded</h2>
          <p className="mt-2 text-sm text-gf-text-secondary">Build a deck first to start testing</p>
        </div>
      </div>
    );
  }

  if (!validation.isValid) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gf-light">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gf-orange" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          <h2 className="text-lg font-bold text-gf-text">Deck Invalid</h2>
          <p className="mt-2 text-sm text-gf-text-secondary">Fix validation errors before testing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Sidebar - Card Catalog (simplified) */}
      <div className="w-72 flex-shrink-0 border-r border-gf-border bg-white overflow-y-auto custom-scrollbar">
        <div className="px-4 py-3 border-b border-gf-border">
          <h3 className="text-sm font-bold text-gf-text">Card Catalog</h3>
        </div>
        <div className="px-3 py-2 border-b border-gf-border space-y-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gf-text-secondary">Color</span>
            {['Red', 'Blue', 'Green', 'Yellow', 'Black'].map((c) => (
              <span key={c} className="inline-block h-3 w-3 rounded-sm" style={{
                backgroundColor: c === 'Red' ? '#CC0000' : c === 'Blue' ? '#0066CC' : c === 'Green' ? '#00AA44' : c === 'Yellow' ? '#FFCC00' : '#333333',
              }} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-gf-text-secondary">
            <span>Types</span>
            {['PPE', 'Pils', 'Command', 'Support'].map((t) => (
              <label key={t} className="flex items-center gap-0.5">
                <input type="checkbox" className="h-3 w-3" />
                {t}
              </label>
            ))}
          </div>
          <input
            className="w-full rounded border border-gf-border bg-white px-2 py-1 text-xs text-gf-text placeholder-gf-text-secondary outline-none focus:border-gf-blue"
            placeholder="Search cards..."
          />
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          {cards.slice(0, 12).map((card) => {
            const imageSrc = card.imageUrl || card.placeholderArt;
            return (
              <div
                key={card.id}
                className="cursor-pointer group"
                onClick={() => setSelectedCardId(card.id)}
              >
                <div className={`relative overflow-hidden rounded-lg border transition-all ${
                  selectedCardId === card.id ? 'border-gf-blue ring-1 ring-gf-blue/30' : 'border-gf-border hover:border-gf-blue'
                }`}>
                  <div className="relative w-full pb-[140%] bg-gray-100">
                    <img src={imageSrc} alt={card.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gf-blue text-[9px] font-bold text-white">
                      {card.cost}
                    </div>
                    <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gf-blue text-[9px] font-bold text-white">
                      {card.cost}
                    </div>
                  </div>
                </div>
                <p className="mt-0.5 truncate text-[10px] font-medium text-gf-text">{card.name}</p>
                <p className="text-[9px] text-gf-text-secondary">{card.type}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center - Playmat */}
      <div className="flex-1 flex flex-col bg-playmat-felt overflow-hidden">
        {/* Player Info Bars */}
        <div className="flex items-center justify-between bg-gradient-to-r from-gf-blue to-gf-blue-dark px-4 py-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white">Player</span>
            <div className="flex items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {turnCount} Site
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4 text-blue-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>
                {resources} Energy
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1">
              <svg className="h-4 w-4 text-red-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              {deckPile.length} Deck
            </span>
            <span className="text-sm font-bold text-white">Opponent</span>
          </div>
        </div>

        {/* Playmat Area */}
        <div className="flex-1 overflow-auto p-4">
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

        {/* Zone Tabs */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20 px-4">
          <div className="flex gap-1 py-2">
            {(['units', 'pilots', 'commands'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveZoneTab(tab)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeZoneTab === tab
                    ? tab === 'units' ? 'bg-blue-500 text-white' : tab === 'pilots' ? 'bg-orange-500 text-white' : 'bg-red-400 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Hand Area */}
        <div className="bg-gradient-to-t from-playmat-felt to-playmat-surface border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">My Hand!</span>
            <div className="flex items-center gap-2">
              <select className="rounded bg-white/10 border border-white/20 px-2 py-1 text-xs text-white">
                <option>OPPONENT</option>
              </select>
              <button
                onClick={() => setResources((prev) => prev + 1)}
                className="flex items-center gap-1 rounded bg-white/10 border border-white/20 px-2 py-1 text-xs text-white hover:bg-white/20"
              >
                <svg className="h-3.5 w-3.5 text-blue-300" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Energy
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 min-h-[100px]">
            {hand.map((card) => {
              const def = cardsById.get(card.cardId);
              const imageSrc = def?.imageUrl || def?.placeholderArt;
              return (
                <div
                  key={card.instanceId}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-gundam-forge-card', card.instanceId);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => def && setSelectedCardId(def.id)}
                  className="flex-shrink-0 w-16 cursor-grab"
                >
                  <div className="relative overflow-hidden rounded-lg border border-white/30 shadow-lg hover:border-white/60 transition-all hover:-translate-y-1">
                    <div className="relative w-full pb-[140%] bg-gray-900">
                      {imageSrc ? (
                        <img src={imageSrc} alt={def?.name} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white p-1 text-center">
                          {def?.name ?? card.cardId}
                        </div>
                      )}
                      <div className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gf-blue text-[8px] font-bold text-white">
                        {def?.cost}
                      </div>
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-white/80">{def?.name ?? card.cardId}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between bg-white border-t border-gf-border px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={handleNextTurn}
              className="rounded-lg bg-gf-blue px-4 py-2 text-sm font-medium text-white hover:bg-gf-blue-dark transition-colors"
            >
              Next Turn
            </button>
            <button
              onClick={() => handleDraw(1)}
              className="rounded-lg border border-gf-border bg-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              Draw
            </button>
            <button
              onClick={handleShuffle}
              className="rounded-lg border border-gf-border bg-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              Shuffle
            </button>
            <button
              onClick={handleMulligan}
              className="rounded-lg border border-gf-border bg-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              Mulligan
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg border border-gf-border bg-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              End Turn
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg bg-gf-orange px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 transition-colors"
            >
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Undo
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Card Preview */}
      <div className="w-72 flex-shrink-0 border-l border-gf-border bg-white overflow-y-auto custom-scrollbar">
        {selectedCard ? (
          <div className="p-4">
            {/* Card Image */}
            <div className="relative overflow-hidden rounded-xl border border-gf-border shadow-sm">
              <img
                src={selectedCard.imageUrl || selectedCard.placeholderArt}
                alt={selectedCard.name}
                className="h-auto w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gf-blue text-sm font-bold text-white shadow-lg">
                {selectedCard.cost}
              </div>
            </div>

            {/* Card Info */}
            <h3 className="mt-3 font-heading text-lg font-bold text-gf-text">{selectedCard.name}</h3>
            <p className="text-sm text-gf-text-secondary">{selectedCard.type} — {selectedCard.color}</p>

            {/* Power */}
            {selectedCard.power !== undefined && selectedCard.power > 0 && (
              <div className="mt-2 inline-flex items-center gap-3 rounded-full bg-gf-dark px-4 py-1.5">
                <span className="flex items-center gap-1 text-sm font-bold text-yellow-400">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  {selectedCard.power}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-sm font-bold text-red-400">3000</span>
              </div>
            )}

            {/* Card Text */}
            {selectedCard.text && (
              <p className="mt-3 rounded-lg bg-gf-light border border-gf-border p-3 text-sm leading-relaxed text-gf-text">
                {selectedCard.text}
              </p>
            )}

            {/* Price */}
            {selectedCard.price?.market !== undefined && (
              <p className="mt-2 text-lg font-bold text-gf-red">${selectedCard.price.market.toFixed(2)}</p>
            )}

            {/* Details */}
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gf-text-secondary">Market Price</span><span className="font-medium text-gf-text">${selectedCard.price?.market?.toFixed(2) ?? 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gf-text-secondary">Rarity</span><span className="font-bold text-red-600">Super Rare</span></div>
              <div className="flex justify-between"><span className="text-gf-text-secondary">Set</span><span className="font-medium text-gf-text">{selectedCard.set}</span></div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gf-red px-3 py-2.5 text-sm font-medium text-white hover:bg-gf-red-dark transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Play
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-gf-orange px-3 py-2.5 text-sm font-medium text-white hover:bg-yellow-600 transition-colors">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
                </svg>
                Action
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gf-light mb-4">
              <svg className="h-8 w-8 text-gf-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <p className="text-sm text-gf-text-secondary">Select a card to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
