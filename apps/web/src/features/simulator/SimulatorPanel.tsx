import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardDefinition, DeckValidationResult } from '@gundam-forge/shared';
import { resolveCardImage } from '../../utils/resolveCardImage';
import type { DeckEntry } from '../deckbuilder/deckStore';
import { PlaymatRoot } from './PlaymatRoot';
import {
  useSimStore,
  type GameCard,
  getActivePlayer,
  getEffectiveAP,
  getEffectiveHP,
  getRemainingHP,
  countActiveResources,
  countTotalResources,
  PHASE_LABELS,
  BATTLE_PHASE_ORDER,
} from './simStore';

interface SimulatorPanelProps {
  cards: CardDefinition[];
  deckEntries: DeckEntry[];
  validation: DeckValidationResult;
}

const PHASE_GROUPS = [
  { label: 'Start', phases: ['start-active', 'start-step'] },
  { label: 'Draw', phases: ['draw'] },
  { label: 'Resource', phases: ['resource'] },
  { label: 'Main', phases: ['main'] },
  { label: 'End', phases: ['end-action', 'end-step', 'end-hand', 'end-cleanup'] },
] as const;

export function SimulatorPanel({ cards, deckEntries, validation }: SimulatorPanelProps) {
  const gameState = useSimStore((s) => s.gameState);
  const startGame = useSimStore((s) => s.startGame);
  const resetGame = useSimStore((s) => s.resetGame);
  const nextPhase = useSimStore((s) => s.nextPhase);
  const playCard = useSimStore((s) => s.playCard);
  const attack = useSimStore((s) => s.attack);
  const resolveDamageAction = useSimStore((s) => s.resolveDamage);
  const manualDraw = useSimStore((s) => s.manualDraw);
  const manualMulligan = useSimStore((s) => s.manualMulligan);
  const manualToggleActive = useSimStore((s) => s.manualToggleActive);
  const manualDiscard = useSimStore((s) => s.manualDiscard);
  const undo = useSimStore((s) => s.undo);
  const undoStack = useSimStore((s) => s.undoStack);
  const selectedInstanceId = useSimStore((s) => s.selectedInstanceId);
  const setSelectedInstanceId = useSimStore((s) => s.setSelectedInstanceId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [pairingPilotId, setPairingPilotId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Clear error after delay
  useEffect(() => {
    if (!actionError) return;
    const t = window.setTimeout(() => setActionError(null), 3000);
    return () => clearTimeout(t);
  }, [actionError]);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.log.length]);

  const handleStartGame = useCallback(() => {
    startGame(deckEntries, cards);
  }, [deckEntries, cards, startGame]);

  const handlePlayCard = useCallback((instanceId: string, targetUnitId?: string) => {
    const err = playCard(instanceId, targetUnitId);
    if (err) setActionError(err);
    setPairingPilotId(null);
  }, [playCard]);

  const handleAttackPlayer = useCallback((attackerId: string) => {
    const err = attack(attackerId, { kind: 'player' });
    if (err) setActionError(err);
  }, [attack]);

  const handleCardClick = useCallback((card: GameCard) => {
    if (pairingPilotId && card.definition.type === 'Unit') {
      handlePlayCard(pairingPilotId, card.instanceId);
      return;
    }
    setSelectedInstanceId(card.instanceId);
  }, [pairingPilotId, handlePlayCard, setSelectedInstanceId]);

  const handleCardDoubleClick = useCallback((card: GameCard) => {
    manualToggleActive(card.instanceId);
  }, [manualToggleActive]);

  const handleZoneClick = useCallback((_zoneId: string) => {
    // Placeholder for zone-specific actions
  }, []);

  if (deckEntries.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gf-light">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-lg font-bold text-gf-text">No Deck Loaded</h2>
          <p className="mt-2 text-sm text-gf-text-secondary">Build a deck first to start testing</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-gf-light">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gf-text">Deck Test - Solo Goldfish</h2>
          <p className="mt-2 text-sm text-gf-text-secondary">
            {validation.metrics.mainDeckCards} main deck / {validation.metrics.resourceDeckCards || '10 auto'} resources
          </p>
          {validation.errors.length > 0 && (
            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 max-w-md mx-auto">
              <p className="text-xs text-yellow-800">
                Deck has validation issues. The simulator will still run.
              </p>
            </div>
          )}
          <button
            onClick={handleStartGame}
            className="mt-6 rounded-lg bg-gf-blue px-8 py-3 text-sm font-bold text-white hover:bg-gf-blue-dark transition-colors shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  const player = gameState.players[0];
  const opponent = gameState.players[1];
  const phase = gameState.phase;
  const isInBattle = BATTLE_PHASE_ORDER.includes(phase);
  const isMainPhase = phase === 'main';
  const isGameOver = gameState.gameOver;

  const selectedCard = selectedInstanceId
    ? [...player.hand, ...player.battleArea, ...player.resourceArea, ...player.trash].find(
        (c) => c.instanceId === selectedInstanceId
      ) ?? (player.shieldArea.base?.instanceId === selectedInstanceId ? player.shieldArea.base : null)
    : null;

  const selectedDef = selectedCard?.definition;

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 flex flex-col bg-playmat-felt overflow-hidden">
        {/* Phase Indicator */}
        <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-1">
            {PHASE_GROUPS.map((group, gi) => {
              const isActive = group.phases.some((p) => p === phase);
              const isPast = gi < PHASE_GROUPS.findIndex((g) => g.phases.some((p) => p === phase));
              return (
                <div key={group.label} className="flex items-center">
                  {gi > 0 && <div className={`mx-1 h-px w-4 ${isPast ? 'bg-gf-blue' : 'bg-gf-white/20'}`} />}
                  <span
                    className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                      isActive
                        ? 'bg-gf-blue text-white shadow'
                        : isPast
                        ? 'bg-gf-blue/20 text-gf-blue'
                        : 'text-white/40'
                    }`}
                  >
                    {group.label}
                  </span>
                </div>
              );
            })}
            {isInBattle && (
              <div className="ml-2 flex items-center gap-1">
                <div className="mx-1 h-px w-4 bg-red-500/50" />
                <span className="rounded-md bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow animate-pulse">
                  Battle
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span>Turn {gameState.turnNumber}</span>
            <span>{PHASE_LABELS[phase]}</span>
          </div>
        </div>

        {/* Player Info Bar */}
        <div className="flex items-center justify-between bg-gray-900/80 px-4 py-1.5 border-b border-white/5">
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span className="font-bold text-white">{player.name}</span>
            <span>Shields: {player.shieldArea.shields.length}</span>
            <span>Resources: {countActiveResources(player)}/{countTotalResources(player)}</span>
            <span>Hand: {player.hand.length}</span>
            <span>Deck: {player.deck.length}</span>
            <span>Units: {player.battleArea.length}/6</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <span>Opp Shields: {opponent.shieldArea.shields.length}</span>
            <span>Opp Deck: {opponent.deck.length}</span>
          </div>
        </div>

        {/* Banners */}
        {actionError && (
          <div className="bg-red-600/90 px-4 py-1.5 text-xs font-medium text-white text-center">
            {actionError}
          </div>
        )}
        {isGameOver && (
          <div className="bg-yellow-500/90 px-4 py-3 text-center">
            <span className="text-sm font-bold text-black">
              Game Over! {gameState.winner === 0 ? 'You win!' : 'Opponent wins!'}
            </span>
            <button
              onClick={() => { resetGame(); }}
              className="ml-4 rounded bg-black/20 px-3 py-1 text-xs font-bold text-black hover:bg-black/30"
            >
              Play Again
            </button>
          </div>
        )}
        {pairingPilotId && (
          <div className="bg-orange-500/90 px-4 py-1.5 text-xs font-medium text-white text-center">
            Select a Unit in the Battle Area to pair this Pilot with.
            <button onClick={() => setPairingPilotId(null)} className="ml-2 underline">Cancel</button>
          </div>
        )}

        {/* Playmat Area */}
        <div className="flex-1 overflow-auto p-4">
          <PlaymatRoot
            gameState={gameState}
            onCardClick={handleCardClick}
            onCardDoubleClick={handleCardDoubleClick}
            onZoneClick={handleZoneClick}
          />
        </div>

        {/* Hand Area */}
        <div className="bg-gradient-to-t from-playmat-felt to-playmat-surface border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">Hand ({player.hand.length})</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 min-h-[100px]">
            {player.hand.map((card) => {
              const def = card.definition;
              const imageSrc = resolveCardImage(def);
              const isSelected = selectedInstanceId === card.instanceId;
              return (
                <div
                  key={card.instanceId}
                  className="flex-shrink-0 w-16 cursor-pointer"
                  onClick={() => setSelectedInstanceId(card.instanceId)}
                >
                  <div className={`relative overflow-hidden rounded-lg border-2 shadow-lg transition-all hover:-translate-y-1 ${
                    isSelected ? 'border-gf-blue ring-2 ring-gf-blue/40' : 'border-white/30 hover:border-white/60'
                  }`}>
                    <div className="relative w-full pb-[140%] bg-gray-900">
                      {imageSrc ? (
                        <img src={imageSrc} alt={def.name} className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white p-1 text-center">
                          {def.name}
                        </div>
                      )}
                      <div className="absolute top-0.5 left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[8px] font-bold text-white">
                        {def.cost}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
                        <span className="text-[7px] font-medium text-white/90">{def.type}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-0.5 truncate text-[9px] font-medium text-white/80">{def.name}</p>
                </div>
              );
            })}
            {player.hand.length === 0 && (
              <div className="flex items-center justify-center w-full text-sm text-white/30">
                No cards in hand
              </div>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between bg-gf-white border-t border-gf-border px-4 py-2">
          <div className="flex gap-2 flex-wrap">
            {!isGameOver && (
              <>
                <button
                  onClick={nextPhase}
                  className="rounded-lg bg-gf-blue px-4 py-2 text-sm font-medium text-white hover:bg-gf-blue-dark transition-colors"
                >
                  {isInBattle ? 'Next Battle Step' : 'Next Phase'}
                </button>

                {isMainPhase && selectedInstanceId && player.hand.some((c) => c.instanceId === selectedInstanceId) && (
                  <button
                    onClick={() => {
                      const card = player.hand.find((c) => c.instanceId === selectedInstanceId);
                      if (!card) return;
                      if (card.definition.type === 'Pilot') {
                        setPairingPilotId(card.instanceId);
                      } else {
                        handlePlayCard(card.instanceId);
                      }
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Play Card
                  </button>
                )}

                {isMainPhase && selectedInstanceId && player.battleArea.some((c) => c.instanceId === selectedInstanceId && c.active && !c.deployedThisTurn) && (
                  <button
                    onClick={() => handleAttackPlayer(selectedInstanceId!)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    Attack Player
                  </button>
                )}

                {phase === 'battle-damage' && (
                  <button
                    onClick={() => {
                      const err = resolveDamageAction();
                      if (err) setActionError(err);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors animate-pulse"
                  >
                    Resolve Damage
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => manualDraw(1)}
              className="rounded-lg border border-gf-border bg-gf-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              Draw
            </button>
            <button
              onClick={manualMulligan}
              className="rounded-lg border border-gf-border bg-gf-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
            >
              Mulligan
            </button>
            {selectedInstanceId && player.hand.some((c) => c.instanceId === selectedInstanceId) && (
              <button
                onClick={() => manualDiscard(selectedInstanceId!)}
                className="rounded-lg border border-gf-border bg-gf-white px-3 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="rounded-lg border border-gf-border bg-gf-white px-4 py-2 text-sm font-medium text-gf-text hover:bg-gray-50 transition-colors disabled:opacity-30"
            >
              Undo
            </button>
            <button
              onClick={resetGame}
              className="rounded-lg bg-gf-orange px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Card Detail + Game Log */}
      <div className="w-72 flex-shrink-0 border-l border-gf-border bg-gf-white overflow-hidden flex flex-col">
        {selectedDef ? (
          <div className="p-4 border-b border-gf-border overflow-y-auto gf-scroll">
            <div className="relative overflow-hidden rounded-xl border border-gf-border shadow-sm">
              <img
                src={resolveCardImage(selectedDef)}
                alt={selectedDef.name}
                className="h-auto w-full object-cover"
              />
              <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white shadow-lg">
                {selectedDef.cost}
              </div>
            </div>

            <h3 className="mt-3 font-heading text-base font-bold text-gf-text">{selectedDef.name}</h3>
            <p className="text-xs text-gf-text-secondary">{selectedDef.type} - {selectedDef.color}</p>

            {(selectedDef.type === 'Unit' || selectedDef.type === 'Base') && selectedCard && (
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                  AP {getEffectiveAP(selectedCard)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                  HP {getRemainingHP(selectedCard)}/{getEffectiveHP(selectedCard)}
                </span>
              </div>
            )}

            {selectedCard?.pairedPilot && (
              <p className="mt-1 text-xs text-orange-600 font-medium">
                Pilot: {selectedCard.pairedPilot.definition.name}
              </p>
            )}

            {selectedDef.traits && selectedDef.traits.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedDef.traits.map((trait) => (
                  <span key={trait} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                    {trait}
                  </span>
                ))}
              </div>
            )}

            {selectedDef.text && (
              <p className="mt-2 rounded-lg bg-gf-light border border-gf-border p-2 text-xs leading-relaxed text-gf-text">
                {selectedDef.text}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 border-b border-gf-border text-center">
            <p className="text-xs text-gf-text-secondary">Click a card to view details</p>
          </div>
        )}

        {/* Game Log */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-gf-border">
            <h4 className="text-xs font-bold text-gf-text uppercase tracking-wider">Game Log</h4>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 gf-scroll">
            {gameState.log.map((entry, i) => (
              <p key={i} className="text-[11px] text-gf-text-secondary leading-relaxed py-0.5 border-b border-gf-border/30 last:border-0">
                {entry}
              </p>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
