/**
 * Main Playtester Game Component
 * Orchestrates the full game UI and integrates all systems
 */

'use client';

import React, { useEffect, useState } from 'react';
import { GameEngine } from '@/lib/game/game-engine';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { PhaseIndicator } from './PhaseIndicator';
import { BattleArea } from './BattleArea';
import { PlayerHand } from './PlayerHand';
import { GameLog } from './GameLog';
import { CombatDisplay } from './CombatDisplay';
import { SetupPhase } from './SetupPhase';
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend';
import type { GameState, GameAction, CardInstance } from '@/lib/game/game-engine';

interface PlaytestGameProps {
  playerDeckId: string;
  opponentDeckId: string;
  cardDatabase: Record<string, any>;
  onGameEnd?: (winner: string, reason: string) => void;
}

export function PlaytestGame({
  playerDeckId,
  opponentDeckId,
  cardDatabase,
  onGameEnd,
}: PlaytestGameProps) {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardInstance | null>(null);
  const [combatInProgress, setCombatInProgress] = useState(false);
  const [showLogVisibility, setShowLogVisibility] = useState(true);
  const [showHandVisibility, setShowHandVisibility] = useState(true);
  const [showBoardVisibility, setShowBoardVisibility] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Initialize sound effects
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

  // Initialize game engine
  useEffect(() => {
    try {
      // Mock deck loading for now - would integrate with actual deck data
      const playerDeck = {
        id: playerDeckId,
        name: 'Player Deck',
        cards: Array.from({ length: 60 }, (_, i) => ({
          cardId: `GD01-${String(i + 1).padStart(3, '0')}`,
          count: 1,
          zone: 'main' as const,
        })),
      };

      const engine = new GameEngine(playerDeckId, playerDeck, cardDatabase);
      setEngine(engine);
      setGameState(engine.getState());
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize game');
      setIsLoading(false);
    }
  }, [playerDeckId, opponentDeckId, cardDatabase]);

  // Execute game action
  const handleAction = (action: GameAction) => {
    if (!engine) return;

    const validation = engine.executeAction(action);
    if (validation.valid) {
      // Play action sounds
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
          onGameEnd?.(
            finalState.winner,
            `You win!`,
          );
        } else {
          playDefeat();
          onGameEnd?.(
            finalState.winner,
            `You lose!`,
          );
        }
      }
    } else {
      setError(validation.error || 'Invalid action');
    }
  };

  // Handle card selection in hand
  const handleSelectCard = (card: CardInstance) => {
    setSelectedCard(card);
  };

  // Handle play card
  const handlePlayCard = (card: CardInstance) => {
    handleAction({
      type: 'PLAY_CARD',
      playerId: gameState?.activePlayerId || 'player1',
      timestamp: Date.now(),
      payload: { cardInstanceId: card.instanceId },
    });
    setSelectedCard(null);
  };

  // Handle declare attack
  const handleDeclareAttack = (attacker: CardInstance, defender: CardInstance | null) => {
    setCombatInProgress(true);
    handleAction({
      type: 'DECLARE_ATTACK',
      playerId: gameState?.activePlayerId || 'player1',
      timestamp: Date.now(),
      payload: {
        attackerInstanceId: attacker.instanceId,
        targetInstanceId: defender?.instanceId || null,
      },
    });
    setCombatInProgress(false);
  };

  // Handle phase advance
  const handleAdvancePhase = () => {
    handleAction({
      type: 'ADVANCE_PHASE',
      playerId: gameState?.activePlayerId || 'player1',
      timestamp: Date.now(),
      payload: {},
    });
  };

  // Handle undo
  const handleUndo = () => {
    if (!engine) return;
    if (engine.undo()) {
      setGameState(engine.getState());
      setSelectedCard(null);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (!engine) return;
    if (engine.redo()) {
      setGameState(engine.getState());
      setSelectedCard(null);
    }
  };

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNextPhase: handleAdvancePhase,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeselectCard: () => setSelectedCard(null),
    onToggleLog: () => setShowLogVisibility(!showLogVisibility),
    onToggleHand: () => setShowHandVisibility(!showHandVisibility),
    onToggleBoard: () => setShowBoardVisibility(!showBoardVisibility),
    onShowHelp: () => setShowHelpModal(true),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg">Initializing game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState || !engine) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <p className="text-xl font-bold">Error</p>
          <p>{error || 'Failed to load game'}</p>
        </div>
      </div>
    );
  }

  const isSetupPhase = gameState.phase === 'setup';
  const isPlayerTurn = gameState.activePlayerId === 'player1';
  const playerState = gameState.players['player1'];
  const opponentState = gameState.players['player2'];

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gundam TCG Playtester</h1>
          <div className="flex gap-2 items-center">
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className={`px-3 py-2 rounded transition text-sm font-semibold ${
                isMuted
                  ? 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
              title={isMuted ? 'Sound muted' : 'Sound on'}
            >
              {isMuted ? '🔇 Mute' : '🔊 Sound'}
            </button>

            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition text-sm"
              title="Show keyboard shortcuts (Press ?)"
            >
              ⌨️ Help
            </button>

            {/* Undo/Redo Buttons */}
            {!isSetupPhase && (
              <div className="flex gap-1 border-l border-r border-slate-600 px-3">
                <button
                  onClick={handleUndo}
                  disabled={!engine?.canUndo()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded font-semibold text-sm transition"
                  title="Undo last action (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!engine?.canRedo()}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 rounded font-semibold text-sm transition"
                  title="Redo last undone action (Ctrl+Y)"
                >
                  ↷ Redo
                </button>
              </div>
            )}

            <PhaseIndicator
              currentPhase={gameState.phase}
              turnNumber={gameState.turnNumber}
              activePlayer={isPlayerTurn ? 'You' : 'Opponent'}
            />
            {!isSetupPhase && (
              <button
                onClick={handleAdvancePhase}
                disabled={!isPlayerTurn}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 rounded-lg font-semibold transition"
                title="Advance to next phase (Press Enter)"
              >
                Next Phase
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Setup Phase */}
      {isSetupPhase && (
        <SetupPhase
          engine={engine}
          onSetupComplete={() => setGameState(engine.getState())}
          onError={setError}
        />
      )}

      {/* Main Game Area */}
      {!isSetupPhase && (
        <div className="grid grid-cols-4 gap-4 p-6 h-full">
          {/* Opponent Area */}
          <div className="col-span-2 border border-slate-700 rounded-lg bg-slate-900/50 p-4 overflow-y-auto">
            {showBoardVisibility ? (
              <>
                <div className="text-sm text-slate-400 mb-2">
                  {opponentState.name} - {opponentState.baseHealth}/{opponentState.maxBaseHealth} HP
                </div>
                <BattleArea
                  units={opponentState.battleArea}
                  isOpponent={true}
                  onSelectUnit={(unit) => {
                    if (selectedCard && selectedCard.zone === 'battle') {
                      handleDeclareAttack(selectedCard, unit);
                    }
                  }}
                />
                <div className="mt-4 text-xs text-slate-500">
                  Shields: {opponentState.shields.length} | Deck: {opponentState.deck.length}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <button
                  onClick={() => setShowBoardVisibility(true)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  Show Board (B)
                </button>
              </div>
            )}
          </div>

          {/* Game Log */}
          <div className="col-span-2 border border-slate-700 rounded-lg bg-slate-900/50 overflow-hidden">
            {showLogVisibility ? (
              <GameLog entries={engine.getLog().slice(-50)} />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <button
                  onClick={() => setShowLogVisibility(true)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  Show Game Log (M)
                </button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="col-span-4" />

          {/* Player Area */}
          <div className="col-span-2 border border-slate-700 rounded-lg bg-slate-900/50 p-4 overflow-y-auto">
            <div className="text-sm text-slate-400 mb-2">
              {playerState.name} - {playerState.baseHealth}/{playerState.maxBaseHealth} HP
            </div>
            <BattleArea
              units={playerState.battleArea}
              isOpponent={false}
              onSelectUnit={setSelectedCard}
            />
            <div className="mt-4 text-xs text-slate-500">
              Shields: {playerState.shields.length} | Deck: {playerState.deck.length}
            </div>
          </div>

          {/* Player Hand */}
          <div className="col-span-2 border border-slate-700 rounded-lg bg-slate-900/50 p-4 overflow-y-auto">
            {showHandVisibility ? (
              <>
                <div className="text-sm text-slate-400 mb-2">Hand ({playerState.hand.length}/7)</div>
                <PlayerHand
                  cards={playerState.hand}
                  cardDatabase={cardDatabase}
                  selectedCard={selectedCard}
                  onSelectCard={handleSelectCard}
                  onPlayCard={handlePlayCard}
                  gamePhase={gameState.phase}
                  isPlayerTurn={isPlayerTurn}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <button
                  onClick={() => setShowHandVisibility(true)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  Show Hand (H)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Combat Display */}
      {combatInProgress && gameState.currentCombat && (
        <CombatDisplay combatResult={gameState.currentCombat.result} />
      )}

      {/* Keyboard Shortcuts Legend */}
      <KeyboardShortcutsLegend
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
