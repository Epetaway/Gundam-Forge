/**
 * Enhanced PlaytestGame Component
 * PHASE 1-4 COMPLETE INTEGRATION
 *
 * Integrates:
 * - Phase 1: Official Gundam TCG Battlefield Layout
 * - Phase 2: Interactive Gameplay Systems (Undo/Redo, Mulligan, Keyboard Shortcuts)
 * - Phase 3: Visual Polish & Audio (Animations, Sound Effects)
 * - Phase 4: Intelligence & Advanced Features (AI, Responsive Design, Accessibility)
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GameEngine } from '@/lib/game/game-engine';
import { Autoplayer } from '@/lib/game/autoplayer';
import { Battlefield } from './Battlefield';
import { GameStartFlow } from './GameStartFlow';
import type { GameStartPhase } from './GameStartFlow';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { PhaseIndicator } from './PhaseIndicator';
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend';
import { DragDropProvider } from '@/lib/hooks/DragDropContext';
import type { GameState, GameAction, CardInstance, DeckDefinition } from '@/lib/game/game-engine';
import type { DeckRecord } from '@/lib/data/decks';

interface PlaytestGameEnhancedProps {
  playerDeck: DeckRecord;
  opponentDeckId: string;
  cardDatabase: Record<string, any>;
  onGameEnd?: (winner: string, reason: string) => void;
}

/**
 * Enhanced Playtester Game Component
 * Full Phase 1-4 implementation matching master prompt specifications
 */
export function PlaytestGameEnhanced({
  playerDeck,
  opponentDeckId,
  cardDatabase,
  onGameEnd,
}: PlaytestGameEnhancedProps) {
  // Game State
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Autoplayer
  const autoplayerRef = useRef(new Autoplayer());

  // GameStartFlow phase state (only shown once at game start)
  const [startPhase, setStartPhase] = useState<GameStartPhase>('coinFlip');
  const [gameReady, setGameReady] = useState(false);
  // Track which player goes first (set by coin flip choice)
  const [playerGoesFirst, setPlayerGoesFirst] = useState(true);

  // UI State
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [showHandPanel, setShowHandPanel] = useState(true);
  const [showBoardPanel, setShowBoardPanel] = useState(true);
  const [showMobileLog, setShowMobileLog] = useState(false);

  // Phase 3: Sound Effects Integration
  const {
    playCardPlay,
    playAttack,
    playShieldBreak,
    playVictory,
    playDefeat,
    toggleMute,
    isMuted,
  } = useSoundEffects();

  // Initialize Game Engine
  useEffect(() => {
    try {
      // Build resource deck from player's deck: expand all entries by quantity, take first 10
      const allCardIds = playerDeck.entries.flatMap((entry) =>
        Array.from({ length: entry.qty }, () => entry.cardId)
      );
      const resourceDeckCards = allCardIds.slice(0, 10);

      // Convert DeckRecord to DeckDefinition
      const deckDefinition: DeckDefinition = {
        id: playerDeck.id,
        name: playerDeck.name,
        description: playerDeck.description,
        cards: [
          ...playerDeck.entries.map((entry) => ({
            cardId: entry.cardId,
            count: entry.qty,
            zone: 'main' as const,
          })),
          // Official GCG: separate 10-card resource deck (outside 50-card main deck)
          // Cards drawn from player's deck in order of construction
          ...resourceDeckCards.map((cardId) => ({
            cardId,
            count: 1,
            zone: 'resource' as const,
          })),
        ],
      };

      const eng = new GameEngine(playerDeck.id, deckDefinition, cardDatabase);
      autoplayerRef.current.initialize('player2', cardDatabase);
      setEngine(eng);
      setGameState(eng.getState());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize game');
      setIsLoading(false);
    }
  }, [playerDeck, cardDatabase]);

  // Game Action Handler
  const handleAction = (action: GameAction) => {
    if (!engine) return;

    const validation = engine.executeAction(action);
    if (validation.valid) {
      switch (action.type) {
        case 'PLAY_CARD':
          playCardPlay();
          break;
        case 'DECLARE_ATTACK':
          playAttack();
          break;
      }

      setGameState(engine.getState());

      // Check for game end
      const finalState = engine.getState();
      if (finalState.isGameOver && finalState.winner) {
        if (finalState.winner === 'player1') {
          playVictory();
          onGameEnd?.(finalState.winner, 'You win!');
        } else {
          playDefeat();
          onGameEnd?.(finalState.winner, 'You lose!');
        }
      }
    } else {
      setError(validation.error || 'Invalid action');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Auto-advance 'start' phase during normal turns (turn 2+)
  useEffect(() => {
    if (!engine || !gameState || !gameReady) return;
    if (gameState.phase !== 'start') return;

    const timeout = setTimeout(() => {
      engine.executeAction({
        type: 'ADVANCE_PHASE',
        playerId: gameState.activePlayerId,
        timestamp: Date.now(),
        payload: {},
      });
      setGameState(engine.getState());
    }, 100);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameReady]);

  // Opponent turn: fire autoplayer when it's player2's turn
  useEffect(() => {
    if (!engine || !gameState) return;
    if (gameState.activePlayerId !== 'player2') return;
    if (gameState.phase === 'start' || gameState.phase === 'gameOver') return;

    const timeout = setTimeout(() => {
      const currentState = engine.getState();
      if (currentState.activePlayerId !== 'player2') return;

      const decision = autoplayerRef.current.decideActions(currentState, cardDatabase);
      for (const action of decision.actions) {
        engine.executeAction(action);
      }

      // If phase hasn't fully cycled back to player1 after autoplayer, advance it
      const afterState = engine.getState();
      if (afterState.activePlayerId === 'player2' && afterState.phase !== 'gameOver') {
        engine.executeAction({
          type: 'ADVANCE_PHASE',
          playerId: 'player2',
          timestamp: Date.now(),
          payload: {},
        });
      }

      setGameState(engine.getState());
    }, 800);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.activePlayerId, gameState?.phase]);

  // Dismiss error
  const dismissError = () => setError(null);

  // Undo/Redo Handlers
  const handleUndo = () => {
    if (!engine) return;
    if (engine.undo()) {
      setGameState(engine.getState());
      setSelectedCard(null);
    }
  };

  const handleRedo = () => {
    if (!engine) return;
    if (engine.redo()) {
      setGameState(engine.getState());
      setSelectedCard(null);
    }
  };

  // Phase Advance
  const handleAdvancePhase = () => {
    if (!gameState?.activePlayerId) return;
    handleAction({
      type: 'ADVANCE_PHASE',
      playerId: gameState.activePlayerId,
      timestamp: Date.now(),
      payload: {},
    });
  };

  // Draw Card (draw phase)
  const handleDraw = () => {
    if (!gameState?.activePlayerId) return;
    handleAction({
      type: 'DRAW',
      playerId: 'player1',
      timestamp: Date.now(),
    });
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onNextPhase: handleAdvancePhase,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeselectCard: () => setSelectedCard(null),
    onToggleLog: () => setShowLogPanel(!showLogPanel),
    onToggleHand: () => setShowHandPanel(!showHandPanel),
    onToggleBoard: () => setShowBoardPanel(!showBoardPanel),
    onShowHelp: () => setShowHelpModal(true),
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-surface to-surface-elevated">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-foreground">Initializing Gundam TCG Playtester...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !gameState || !engine) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-surface to-surface-elevated">
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">Error</p>
          <p className="text-steel-300 mt-2">{error || 'Failed to load game'}</p>
        </div>
      </div>
    );
  }

  const isSetupPhase = !gameReady;
  const isPlayerTurn = gameState.activePlayerId === 'player1';
  const isDrawPhase = gameState.phase === 'draw';
  const isResourcePhase = gameState.phase === 'resource';
  const needsToDraw = isDrawPhase && isPlayerTurn && !gameState.hasDrawnThisTurn;
  const playerState = gameState.players['player1'];
  const opponentState = gameState.players['player2'];
  const needsToPlaceResource =
    isResourcePhase &&
    isPlayerTurn &&
    !gameState.hasResourcePlacedThisTurn &&
    playerState.resourceDeck.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* HEADER: Phase Indicator + Controls */}
      <header className="flex-shrink-0 border-b-2 border-cobalt-500/30 bg-gradient-to-r from-surface-elevated to-surface px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Title */}
          <h1 className="text-base font-bold text-foreground whitespace-nowrap mr-2">Gundam TCG</h1>

          {/* Phase + turn info */}
          {!isSetupPhase && (
            <PhaseIndicator
              currentPhase={gameState.phase}
              turnNumber={gameState.turnNumber}
              activePlayer={isPlayerTurn ? 'You' : 'Opponent'}
            />
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons — always in one row, never wrap */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Undo/Redo */}
            {!isSetupPhase && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={!engine?.canUndo()}
                  className="px-2 py-1 bg-surface-elevated hover:bg-surface disabled:bg-surface-muted disabled:text-steel-600 rounded text-xs transition"
                  title="Undo (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!engine?.canRedo()}
                  className="px-2 py-1 bg-surface-elevated hover:bg-surface disabled:bg-surface-muted disabled:text-steel-600 rounded text-xs transition"
                  title="Redo (Ctrl+Y)"
                >
                  ↷
                </button>
              </>
            )}

            {/* Draw Card — only when player must draw */}
            {!isSetupPhase && needsToDraw && (
              <button
                onClick={handleDraw}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-xs transition animate-pulse"
              >
                Draw Card
              </button>
            )}

            {/* Place Resource — resource phase */}
            {!isSetupPhase && needsToPlaceResource && (
              <button
                onClick={() =>
                  handleAction({ type: 'PLACE_RESOURCE', playerId: 'player1', timestamp: Date.now() })
                }
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-xs transition animate-pulse"
              >
                Place Resource
              </button>
            )}

            {/* Next Phase */}
            {!isSetupPhase && (
              <button
                onClick={handleAdvancePhase}
                disabled={!isPlayerTurn || needsToDraw || needsToPlaceResource}
                className="px-3 py-1 bg-cobalt-600 hover:bg-cobalt-700 disabled:bg-surface-muted disabled:text-steel-600 disabled:cursor-not-allowed text-foreground rounded font-semibold text-xs transition"
                title={needsToDraw ? 'Draw first' : needsToPlaceResource ? 'Place resource first' : 'Next phase (Enter)'}
              >
                {needsToDraw ? 'Draw First' : needsToPlaceResource ? 'Place Resource First' : 'Next Phase →'}
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className="px-2 py-1 bg-surface-elevated hover:bg-surface rounded text-xs transition"
              aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Help */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-2 py-1 text-steel-500 hover:text-foreground hover:bg-surface-elevated rounded text-xs transition"
              aria-label="Keyboard shortcuts help"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>

            {/* Back to Decks */}
            <Link
              href="/decks"
              className="px-2 py-1 text-steel-500 hover:text-foreground hover:bg-surface-elevated rounded text-xs transition border border-border ml-1"
              title="Exit playtester and return to deck list"
            >
              ← Decks
            </Link>
          </div>
        </div>
      </header>

      {/* SETUP PHASE — GameStartFlow */}
      {isSetupPhase && (
        <GameStartFlow
          phase={startPhase}
          playerId="player1"
          opponentId="player2"
          handCards={engine.getState().players['player1'].hand}
          cardDatabase={cardDatabase}
          onCoinFlipResult={(_isHeads, goesFirst) => {
            setPlayerGoesFirst(goesFirst);
            setStartPhase('shuffle');
          }}
          onShuffleComplete={() => {
            engine.setupDraw('player1', 5);
            setGameState(engine.getState());
            setStartPhase('draw');
          }}
          onDrawComplete={() => {
            setStartPhase('mulligan');
          }}
          onMulliganCards={() => {
            engine.executeAction({
              type: 'MULLIGAN',
              playerId: 'player1',
              timestamp: Date.now(),
            });
            setGameState(engine.getState());
            setStartPhase('shields');
          }}
          onMulliganSkip={() => {
            setStartPhase('shields');
          }}
          onShieldsPlaced={() => {
            // Draw opponent's opening hand (5 cards)
            engine.setupDraw('player2', 5);
            setGameState(engine.getState());
            setStartPhase('ready');
          }}
          onGameReady={() => {
            // Apply the coin flip choice: set which player goes first
            const firstPlayerId = playerGoesFirst ? 'player1' : 'player2';
            engine.setFirstPlayer(firstPlayerId);
            // Advance engine out of setup phase
            engine.executeAction({
              type: 'ADVANCE_PHASE',
              playerId: firstPlayerId,
              timestamp: Date.now(),
            });
            setGameState(engine.getState());
            setGameReady(true);
          }}
        />
      )}

      {/* MAIN GAME AREA: Battlefield */}
      {!isSetupPhase && (
        <DragDropProvider
          cardDatabase={cardDatabase}
          onCardPlayRequested={(card) =>
            handleAction({
              type: 'PLAY_CARD',
              playerId: 'player1',
              timestamp: Date.now(),
              payload: { cardInstanceId: card.instanceId },
            })
          }
          onDropError={(msg) => {
            setError(msg);
            setTimeout(() => setError(null), 3000);
          }}
        >
          <main className="flex-1 overflow-hidden" id="main-content">
            <Battlefield
              playerState={playerState}
              opponentState={opponentState}
              isPlayerTurn={isPlayerTurn}
              gamePhase={gameState.phase}
              cardDatabase={cardDatabase}
              selectedCard={selectedCard}
              gameLog={engine.getLog().slice(-20)}
              onUnitSelected={(unit, isOpponent) => {
                if (!isOpponent) {
                  setSelectedCard(unit);
                }
              }}
              onSelectCard={(card) => {
                setSelectedCard(card);
              }}
              onCardPlayRequested={(card) => {
                handleAction({
                  type: 'PLAY_CARD',
                  playerId: 'player1',
                  timestamp: Date.now(),
                  payload: { cardInstanceId: card.instanceId },
                });
              }}
              onShieldDamaged={(remaining) => {
                if (remaining === 0) {
                  playShieldBreak();
                }
              }}
              onAttackDeclared={(attackerInstanceId, targetInstanceId) => {
                handleAction({
                  type: 'DECLARE_ATTACK',
                  playerId: 'player1',
                  timestamp: Date.now(),
                  payload: { attackerInstanceId, ...(targetInstanceId ? { targetInstanceId } : {}) },
                });
              }}
            />
          </main>
        </DragDropProvider>
      )}

      {/* Keyboard Shortcuts Legend */}
      <KeyboardShortcutsLegend
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Error Toast */}
      {error && (
        <div
          className="fixed bottom-4 right-4 flex items-start gap-2 bg-destructive/90 text-white px-4 py-3 rounded-lg shadow-lg max-w-xs z-50 border border-destructive"
          role="alert"
          aria-live="assertive"
        >
          <span className="flex-1 text-sm">{error}</span>
          <button
            onClick={dismissError}
            className="ml-1 shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Game Log Button (visible only on mobile) */}
      {!isSetupPhase && engine && (
        <button
          onClick={() => setShowMobileLog(!showMobileLog)}
          className="fixed md:hidden bottom-4 right-4 bg-cobalt-600 hover:bg-cobalt-700 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-colors z-40"
          title="Toggle game log"
        >
          📋 Log
        </button>
      )}

      {/* Mobile Game Log Panel */}
      {showMobileLog && !isSetupPhase && engine && (
        <div className="fixed md:hidden bottom-16 inset-x-0 z-50 max-h-64 overflow-y-auto bg-surface border-t border-border p-3 max-h-[40vh]">
          <div className="space-y-2">
            {engine.getLog().slice(-20).reverse().map((entry, i) => (
              <div key={i} className="text-xs border-b border-border/30 pb-2 last:border-b-0">
                <span className="text-steel-500 font-mono text-[10px]">[T{entry.state.turnNumber ?? '?'}]</span>
                <span className="text-steel-300 ml-1">{entry.description || entry.actionType}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cobalt-600 focus:text-foreground focus:rounded"
      >
        Skip to main content
      </a>
    </div>
  );
}
