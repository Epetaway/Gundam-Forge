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
      // Convert DeckRecord to DeckDefinition
      const deckDefinition: DeckDefinition = {
        id: playerDeck.id,
        name: playerDeck.name,
        description: playerDeck.description,
        cards: playerDeck.entries.map((entry) => ({
          cardId: entry.cardId,
          count: entry.qty,
          zone: 'main' as const,
        })),
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

  // Auto-advance 'setup' phase during normal turns (turn 2+)
  useEffect(() => {
    if (!engine || !gameState || !gameReady) return;
    if (gameState.phase !== 'setup') return;

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
    if (gameState.phase === 'setup' || gameState.phase === 'gameOver') return;

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg text-white">Initializing Gundam TCG Playtester...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !gameState || !engine) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">Error</p>
          <p className="text-slate-300 mt-2">{error || 'Failed to load game'}</p>
        </div>
      </div>
    );
  }

  const isSetupPhase = !gameReady;
  const isPlayerTurn = gameState.activePlayerId === 'player1';
  const isDrawPhase = gameState.phase === 'draw';
  const needsToDraw = isDrawPhase && isPlayerTurn && !gameState.hasDrawnThisTurn;
  const playerState = gameState.players['player1'];
  const opponentState = gameState.players['player2'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
      {/* HEADER: Phase Indicator + Controls */}
      <header className="border-b-2 border-purple-600/30 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3">
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-white whitespace-nowrap">Gundam TCG Playtester</h1>

          <div className="flex gap-2 items-center flex-wrap">
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className={`px-3 py-1.5 rounded transition text-sm font-semibold ${
                isMuted
                  ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
              title={isMuted ? 'Sound muted' : 'Sound on'}
              aria-label={isMuted ? 'Enable sound' : 'Disable sound'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition text-sm"
              title="Show keyboard shortcuts (?)"
              aria-label="Show help"
            >
              Help
            </button>

            {/* Undo/Redo */}
            {!isSetupPhase && (
              <div className="flex gap-1 border-l border-r border-slate-600 px-2">
                <button
                  onClick={handleUndo}
                  disabled={!engine?.canUndo()}
                  className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-sm transition"
                  title="Undo (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!engine?.canRedo()}
                  className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded text-sm transition"
                  title="Redo (Ctrl+Y)"
                >
                  ↷
                </button>
              </div>
            )}

            {/* Phase Indicator */}
            {!isSetupPhase && (
              <PhaseIndicator
                currentPhase={gameState.phase}
                turnNumber={gameState.turnNumber}
                activePlayer={isPlayerTurn ? 'You' : 'Opponent'}
              />
            )}

            {/* Draw Card button — only shown when player must draw */}
            {!isSetupPhase && needsToDraw && (
              <button
                onClick={handleDraw}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition animate-pulse"
                title="Draw a card (draw phase)"
              >
                Draw Card
              </button>
            )}

            {/* Next Phase Button */}
            {!isSetupPhase && (
              <button
                onClick={handleAdvancePhase}
                disabled={!isPlayerTurn || needsToDraw}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition"
                title={needsToDraw ? 'Draw a card first' : 'Next phase (Enter)'}
                aria-label="Next phase"
              >
                {needsToDraw ? 'Draw First' : 'Next Phase →'}
              </button>
            )}
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
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse max-w-xs z-50">
          {error}
        </div>
      )}

      {/* Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
    </div>
  );
}
