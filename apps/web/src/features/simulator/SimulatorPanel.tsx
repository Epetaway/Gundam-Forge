import { useEffect, useMemo } from 'react';
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

  const zoneIds = useMemo(() => OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map((zone) => zone.id), []);
  const deckSignature = useMemo(() => buildDeckSignature(deckEntries), [deckEntries]);
  const cardsById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  useEffect(() => {
    initializeFromDeck(deckEntries, zoneIds);
  }, [deckSignature, deckEntries, initializeFromDeck, zoneIds]);

  if (deckEntries.length === 0) {
    return (
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        Add cards in the builder before starting simulation.
      </section>
    );
  }

  if (!validation.isValid) {
    return (
      <section className="rounded-lg border border-amber-900 bg-amber-950/30 p-4">
        <h2 className="text-lg font-semibold text-amber-200">Simulator locked</h2>
        <p className="mt-2 text-sm text-amber-100">Fix deck validation errors before running a playtest.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-lg font-semibold">Simulator Controls</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600" onClick={shuffle}>
            Shuffle
          </button>
          <button className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600" onClick={() => draw(1)}>
            Draw
          </button>
          <button className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600" onClick={mulligan}>
            Mulligan
          </button>
          <button className="rounded bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600" onClick={reset}>
            Reset
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Deck: {deckPile.length} · Hand: {hand.length}
        </p>
      </section>

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
