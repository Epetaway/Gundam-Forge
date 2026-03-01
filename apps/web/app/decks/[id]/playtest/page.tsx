'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GameState, GameEngine } from '@/lib/game/game-engine';
import { cardsById } from '@/lib/data/cards';
import OpeningHandModal from '@/components/playtest/OpeningHandModal';
import CardFan from '@/components/playtest/CardFan';
import ZonesPanel from '@/components/playtest/ZonesPanel';
import PlaytestBoard from '@/components/playtest/PlaytestBoard';
import PlaytestActionPanel from '@/components/playtest/PlaytestActionPanel';
import PlaytestLog from '@/components/playtest/PlaytestLog';
import PlaytestPhaseIndicator from '@/components/playtest/PlaytestPhaseIndicator';
import PlaymatCenter from '@/components/playtest/PlaymatCenter';
import CardInspector from '@/components/playtest/CardInspector';

interface PlaytestPageState {
  gameState?: GameState;
  engine?: GameEngine;
  loading: boolean;
  error?: string;
  showOpeningHand: boolean;
  mulliganCount: number;
  selectedCardId?: string;
  // Undo system
  history: GameState[];
  historyIndex: number;
}

export default function PlaytestPage() {
  const params = useParams();
  const deckId = params.id as string;

  const [state, setState] = useState<PlaytestPageState>({
    loading: true,
    showOpeningHand: false,
    mulliganCount: 0,
    selectedCardId: undefined,
    history: [],
    historyIndex: -1,
  });

  useEffect(() => {
    const initializePlaytest = async () => {
      try {
        // Fetch deck definition from API
        const deckResponse = await fetch(`/api/decks/${deckId}`);
        if (!deckResponse.ok) {
          throw new Error(`Failed to load deck: ${deckResponse.statusText}`);
        }

        const { deck } = await deckResponse.json();

        // Convert Map to Record for GameEngine
        const cardDatabase = Object.fromEntries(cardsById) as unknown as Record<
          string,
          any
        >;

        // Initialize game engine with the loaded deck
        const engine = new GameEngine(deckId, deck, cardDatabase);
        const gameState = engine.getState();

        setState((prev) => ({
          ...prev,
          loading: false,
          gameState,
          engine,
          showOpeningHand: true, // Show opening hand modal
        }));
      } catch (error) {
        console.error('Error loading deck for playtest:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load deck',
        }));
      }
    };

    initializePlaytest();
  }, [deckId]);

  const handleKeepHand = () => {
    setState((prev) => ({
      ...prev,
      showOpeningHand: false,
    }));
  };

  // Save current state to history
  const saveToHistory = (gameState: GameState) => {
    setState((prev) => {
      // Remove any redo history when a new action is taken
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(gameState);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  // Undo last action
  const handleUndo = () => {
    setState((prev) => {
      if (prev.historyIndex <= 0 || !prev.engine) return prev;
      const newIndex = prev.historyIndex - 1;
      const previousState = prev.history[newIndex];
      return {
        ...prev,
        gameState: previousState,
        historyIndex: newIndex,
        selectedCardId: undefined,
      };
    });
  };

  // Redo last undone action
  const handleRedo = () => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      const nextState = prev.history[newIndex];
      return {
        ...prev,
        gameState: nextState,
        historyIndex: newIndex,
        selectedCardId: undefined,
      };
    });
  };

  const handleMulligan = () => {
    setState((prev) => {
      if (!prev.engine || !prev.gameState) return prev;
      
      // Reshuffle hand back into deck
      const currentPlayer = prev.gameState.players[prev.gameState.activePlayerId];
      const deckCopy = [...currentPlayer.deck];
      const handCopy = [...currentPlayer.hand];
      
      // Put hand back in deck
      deckCopy.push(...handCopy);
      currentPlayer.deck = deckCopy;
      currentPlayer.hand = [];
      
      // Draw 7 new cards
      for (let i = 0; i < 7 && deckCopy.length > 0; i++) {
        const card = deckCopy.pop();
        if (card) {
          card.zone = 'hand';
          currentPlayer.hand.push(card);
        }
      }

      const newCount = prev.mulliganCount + 1;
      console.log(`Mulligan #${newCount} - New hand drawn`);

      return {
        ...prev,
        gameState: { ...prev.gameState },
        mulliganCount: newCount,
      };
    });
  };

  // Toggle card rest/unrest state
  const handleCardRest = (instanceId: string) => {
    setState((prev) => {
      if (!prev.gameState) return prev;
      
      // Find the card in any zone
      for (const player of Object.values(prev.gameState.players)) {
        const card = [
          ...player.deck,
          ...player.hand,
          ...player.battleArea,
          ...player.resources,
          ...player.discardPile,
        ].find((c) => c.instanceId === instanceId);

        if (card) {
          card.state = card.state === 'ready' ? 'rest' : 'ready';
          break;
        }
      }

      const newGameState = { ...prev.gameState };
      saveToHistory(newGameState);
      return {
        ...prev,
        gameState: newGameState,
      };
    });
  };

  // Select/deselect card
  const handleCardSelect = (instanceId: string) => {
    setState((prev) => ({
      ...prev,
      selectedCardId: prev.selectedCardId === instanceId ? undefined : instanceId,
    }));
  };

  // Get selected card ID for inspector
  const getSelectedCardId = (): string | undefined => {
    if (!state.selectedCardId || !state.gameState) return undefined;
    
    for (const player of Object.values(state.gameState.players)) {
      const card = [
        ...player.deck,
        ...player.hand,
        ...player.battleArea,
        ...player.resources,
        ...player.discardPile,
      ].find((c) => c.instanceId === state.selectedCardId);

      if (card) return card.cardId;
    }
    return undefined;
  };

  // Execute game action
  const executeAction = (actionType: string) => {
    setState((prev) => {
      if (!prev.engine || !prev.gameState) return prev;

      try {
        const action = {
          type: actionType as any,
          playerId: prev.gameState.activePlayerId,
          timestamp: Date.now(),
        };

        const validation = prev.engine.executeAction(action);
        
        if (!validation.valid) {
          console.warn(`Invalid action: ${validation.error}`);
          return prev;
        }

        const newGameState = prev.engine.getState();
        
        console.log(`Action executed: ${actionType}`, {
          phase: newGameState.phase,
          turn: newGameState.turnNumber,
          rulesTrace: validation.rulesTrace,
        });

        // Save to undo history
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(newGameState);

        return {
          ...prev,
          gameState: newGameState,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          selectedCardId: undefined,
        };
      } catch (error) {
        console.error('Error executing action:', error);
        return prev;
      }
    });
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-lg font-semibold text-white">Loading deck...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{state.error}</p>
          <a href={`/decks/${deckId}`} className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">
            Back to Deck
          </a>
        </div>
      </div>
    );
  }

  if (!state.gameState || !state.engine) {
    return null;
  }

  const gameState = state.gameState;
  const currentPlayer = gameState.players[gameState.activePlayerId];
  const opponentId = Object.keys(gameState.players).find((id) => id !== gameState.activePlayerId);
  const opponent = opponentId ? gameState.players[opponentId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      {/* Opening Hand Modal */}
      <OpeningHandModal
        hand={currentPlayer.hand}
        onKeep={handleKeepHand}
        onMulligan={handleMulligan}
        isOpen={state.showOpeningHand}
      />

      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Playtest
            </h1>
            <p className="text-sm text-slate-400">
              Turn {gameState.turnNumber} • Phase: {gameState.phase}
            </p>
          </div>
          <a
            href={`/decks/${deckId}`}
            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition text-sm font-medium"
          >
            Exit Playtest
          </a>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Phase Indicator & Controls */}
        <div className="mb-6 flex items-center justify-between">
          <PlaytestPhaseIndicator
            currentPhase={gameState.phase}
            turnNumber={gameState.turnNumber}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUndo}
              disabled={state.historyIndex <= 0}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm font-medium transition"
              title="Undo (U)"
            >
              ↶ Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={state.historyIndex >= state.history.length - 1}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded text-sm font-medium transition"
              title="Redo (Y)"
            >
              ↷ Redo
            </button>
          </div>
        </div>

        {/* 3-Column Layout: Left (Zones) | Center (Playmat) | Right (Inspector) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Zones Panel + Game Log */}
          <div className="lg:col-span-1 space-y-6">
            <ZonesPanel player={currentPlayer} />
            
            {/* Game Log */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-300 mb-3 text-sm">Log</h3>
              <PlaytestLog log={gameState.log.slice(-8)} compact />
            </div>
          </div>

          {/* CENTER: Playmat */}
          <div className="lg:col-span-3">
            <PlaymatCenter
              gameState={gameState}
              selectedCardId={state.selectedCardId}
              onCardSelect={handleCardSelect}
              onCardRest={handleCardRest}
            />
          </div>

          {/* RIGHT: Card Inspector + Action Panel */}
          <div className="lg:col-span-1 space-y-6">
            <CardInspector cardId={getSelectedCardId()} />
            
            {/* Action Panel */}
            <div>
              <PlaytestActionPanel
                gameState={gameState}
                onAction={executeAction}
              />
            </div>
          </div>
        </div>

        {/* Player Hand at Bottom */}
        <div className="mt-6">
          <CardFan hand={currentPlayer.hand} />
        </div>
      </div>

      {/* Footer with Deck Info */}
      <footer className="mt-8 border-t border-slate-700 bg-slate-900/50 py-4">
        <div className="max-w-7xl mx-auto px-6 text-xs text-slate-400">
          <p>
            Mulligan: <span className="font-semibold text-slate-300">{state.mulliganCount}</span> •
            History: <span className="font-semibold text-slate-300">{state.historyIndex + 1}/{state.history.length}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
