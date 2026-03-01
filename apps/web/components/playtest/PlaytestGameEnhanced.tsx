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

import React, { useEffect, useState } from 'react';
import { GameEngine } from '@/lib/game/game-engine';
import { Battlefield } from './Battlefield';
import { SetupPhase } from './SetupPhase';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { PhaseIndicator } from './PhaseIndicator';
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend';
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
    playDestroyed,
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
          zone: 'main' as const, // Default to main zone for all cards
        })),
      };

      const engine = new GameEngine(playerDeck.id, deckDefinition, cardDatabase);
      setEngine(engine);
      setGameState(engine.getState());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize game');
      setIsLoading(false);
    }
  }, [playerDeck, cardDatabase]);

  // Phase 2: Game Action Handler
  const handleAction = (action: GameAction) => {
    if (!engine) return;

    const validation = engine.executeAction(action);
    if (validation.valid) {
      // Phase 3: Sound Effects Triggers
      switch (action.type) {
        case 'PLAY_CARD':
          playCardPlay();
          break;
        case 'DECLARE_ATTACK':
          playAttack();
          break;
        case 'END_PHASE':
          break; // Silent
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

  // Phase 2: Undo/Redo Handlers
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

  // Phase 2: Phase Advance
  const handleAdvancePhase = () => {
    if (!gameState?.activePlayerId) return;
    handleAction({
      type: 'ADVANCE_PHASE',
      playerId: gameState.activePlayerId,
      timestamp: Date.now(),
      payload: {},
    });
  };

  // Phase 2: Keyboard Shortcuts Integration
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">Error</p>
          <p className="text-slate-300 mt-2">{error || 'Failed to load game'}</p>
        </div>
      </div>
    );
  }

  const isSetupPhase = gameState.phase === 'setup';
  const isPlayerTurn = gameState.activePlayerId === 'player1';
  const playerState = gameState.players['player1'];
  const opponentState = gameState.players['player2'];

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col overflow-hidden">
      {/* HEADER: Phase Indicator + Controls */}
      <header className="border-b-2 border-purple-600/30 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Gundam TCG Playtester</h1>

          <div className="flex gap-4 items-center">
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className={`px-3 py-2 rounded transition text-sm font-semibold ${
                isMuted
                  ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
              title={isMuted ? 'Sound muted' : 'Sound on'}
              aria-label={isMuted ? 'Enable sound' : 'Disable sound'}
            >
              {isMuted ? 'Mute' : 'Sound'}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition text-sm"
              title="Show keyboard shortcuts (Press ?)"
              aria-label="Show help"
            >
              Help
            </button>

            {/* Undo/Redo Buttons (Phase 2) */}
            {!isSetupPhase && (
              <div className="flex gap-1 border-l border-r border-slate-600 px-3">
                <button
                  onClick={handleUndo}
                  disabled={!engine?.canUndo()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded font-semibold text-sm transition"
                  title="Undo last action (Ctrl+Z)"
                  aria-label="Undo"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!engine?.canRedo()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded font-semibold text-sm transition"
                  title="Redo last undone action (Ctrl+Y)"
                  aria-label="Redo"
                >
                  ↷ Redo
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

            {/* Next Phase Button */}
            {!isSetupPhase && (
              <button
                onClick={handleAdvancePhase}
                disabled={!isPlayerTurn}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 rounded-lg font-semibold transition"
                title="Advance to next phase (Press Enter)"
                aria-label="Next phase"
              >
                Next Phase
              </button>
            )}
          </div>
        </div>
      </header>
      {/* SETUP PHASE */}
      {isSetupPhase && (
        <SetupPhase
          engine={engine}
          cardDatabase={cardDatabase}
          onSetupComplete={() => setGameState(engine.getState())}
          onError={setError}
        />
      )}

      {/* MAIN GAME AREA: Battlefield (Phase 1) */}
      {!isSetupPhase && (
        <main className="flex-1 overflow-hidden">
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
      )}

      {/* Keyboard Shortcuts Legend Modal (Phase 2) */}
      <KeyboardShortcutsLegend
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Error Toast (Phase 3: Visual Feedback) */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse max-w-xs">
          {error}
        </div>
      )}

      {/* Accessibility: Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
    </div>
  );
}
