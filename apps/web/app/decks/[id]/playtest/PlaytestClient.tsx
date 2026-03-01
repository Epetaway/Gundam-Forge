'use client';

import { useState } from 'react';
import { GameState, GameEngine, DeckDefinition } from '@/lib/game/game-engine';
import { cardsById } from '@/lib/data/cards';
import OpeningHandModal from '@/components/playtest/OpeningHandModal';
import CardFan from '@/components/playtest/CardFan';
import ZonesPanel from '@/components/playtest/ZonesPanel';
import PlaytestActionPanel from '@/components/playtest/PlaytestActionPanel';
import PlaytestLog from '@/components/playtest/PlaytestLog';
import PlaytestPhaseIndicator from '@/components/playtest/PlaytestPhaseIndicator';
import PlaymatCenter from '@/components/playtest/PlaymatCenter';
import CardInspector from '@/components/playtest/CardInspector';
import PlaytestTriggerQueue from '@/components/playtest/PlaytestTriggerQueue';

interface PlaytestClientProps {
  deckId: string;
  deck: DeckDefinition;
}

interface PlaytestPageState {
  gameState?: GameState;
  engine?: GameEngine;
  loading: boolean;
  error?: string;
  showOpeningHand: boolean;
  mulliganCount: number;
  selectedCardId?: string;
  history: GameState[];
  historyIndex: number;
}

export default function PlaytestClient({ deckId, deck }: PlaytestClientProps) {
  const [state, setState] = useState<PlaytestPageState>(() => {
    try {
      const cardDatabase = Object.fromEntries(cardsById) as unknown as Record<string, any>;
      const engine = new GameEngine(deckId, deck, cardDatabase);
      const gameState = engine.getState();

      return {
        loading: false,
        gameState,
        engine,
        showOpeningHand: true,
        mulliganCount: 0,
        selectedCardId: undefined,
        history: [gameState],
        historyIndex: 0,
      };
    } catch (error) {
      console.error('Error initializing playtest:', error);
      return {
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize playtest',
        showOpeningHand: false,
        mulliganCount: 0,
        selectedCardId: undefined,
        history: [],
        historyIndex: -1,
      };
    }
  });

  const handleKeepHand = () => {
    setState((prev) => ({
      ...prev,
      showOpeningHand: false,
    }));
  };

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

      const currentPlayer = prev.gameState.players[prev.gameState.activePlayerId];
      const deckCopy = [...currentPlayer.deck];
      const handCopy = [...currentPlayer.hand];

      deckCopy.push(...handCopy);
      currentPlayer.deck = deckCopy;
      currentPlayer.hand = [];

      for (let i = 0; i < 7 && deckCopy.length > 0; i++) {
        const card = deckCopy.pop();
        if (card) {
          card.zone = 'hand';
          currentPlayer.hand.push(card);
        }
      }

      const newCount = prev.mulliganCount + 1;

      return {
        ...prev,
        gameState: { ...prev.gameState },
        history: [...prev.history, { ...prev.gameState }],
        historyIndex: prev.history.length,
        mulliganCount: newCount,
      };
    });
  };

  const handleCardRest = (instanceId: string) => {
    setState((prev) => {
      if (!prev.gameState) return prev;

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
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newGameState);

      return {
        ...prev,
        gameState: newGameState,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  const handleCardSelect = (instanceId: string) => {
    setState((prev) => ({
      ...prev,
      selectedCardId: prev.selectedCardId === instanceId ? undefined : instanceId,
    }));
  };

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

  const executeAction = (actionType: string, payload?: Record<string, unknown>) => {
    setState((prev) => {
      if (!prev.engine || !prev.gameState) return prev;

      try {
        let computedPayload = payload ? { ...payload } : undefined;
        const activePlayer = prev.gameState.players[prev.gameState.activePlayerId];

        if (actionType === 'ACTIVATE_ABILITY' && !computedPayload) {
          const supportSource = activePlayer.battleArea.find((unit) => {
            const def = cardsById.get(unit.cardId) as any;
            const keywords: string[] = def?.keywords || [];
            return keywords.map((k) => String(k).toLowerCase()).includes('support');
          });

          const supportTarget =
            activePlayer.battleArea.find((unit) => unit.instanceId !== supportSource?.instanceId) ||
            activePlayer.battleArea[0];

          if (supportSource && supportTarget) {
            computedPayload = {
              sourceInstanceId: supportSource.instanceId,
              targetInstanceId: supportTarget.instanceId,
              abilityId: 'SUPPORT_MAIN',
            };
          }
        }

        if (actionType === 'PAIR_PILOT' && !computedPayload) {
          const pilot = activePlayer.battleArea.find((unit) => {
            const def = cardsById.get(unit.cardId) as any;
            return def?.type === 'Pilot';
          });
          const hostUnit = activePlayer.battleArea.find((unit) => {
            const def = cardsById.get(unit.cardId) as any;
            return def?.type === 'Unit';
          });

          if (pilot && hostUnit) {
            computedPayload = {
              pilotInstanceId: pilot.instanceId,
              unitInstanceId: hostUnit.instanceId,
              mode: 'pair',
            };
          }
        }

        const action = {
          type: actionType as any,
          playerId: prev.gameState.activePlayerId,
          timestamp: Date.now(),
          payload: computedPayload,
        };

        const validation = prev.engine.executeAction(action);

        if (!validation.valid) {
          console.warn(`Invalid action: ${validation.error}`);
          return prev;
        }

        const newGameState = prev.engine.getState();

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
          <a
            href={`/decks/${deckId}`}
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <OpeningHandModal
        hand={currentPlayer.hand}
        onKeep={handleKeepHand}
        onMulligan={handleMulligan}
        isOpen={state.showOpeningHand}
      />

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

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <PlaytestPhaseIndicator currentPhase={gameState.phase} turnNumber={gameState.turnNumber} />
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ZonesPanel player={currentPlayer} />
            <PlaytestTriggerQueue
              stack={gameState.stack}
              onResolveTrigger={(triggerId, chooseResolve) =>
                executeAction('RESOLVE_TRIGGER', { triggerId, chooseResolve })
              }
              onResolveAll={() => executeAction('RESOLVE_ALL_TRIGGERS')}
            />
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-300 mb-3 text-sm">Log</h3>
              <PlaytestLog log={gameState.log.slice(-8)} compact />
            </div>
          </div>

          <div className="lg:col-span-3">
            <PlaymatCenter
              gameState={gameState}
              selectedCardId={state.selectedCardId}
              onCardSelect={handleCardSelect}
              onCardRest={handleCardRest}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <CardInspector cardId={getSelectedCardId()} />
            <div>
              <PlaytestActionPanel gameState={gameState} onAction={executeAction} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <CardFan hand={currentPlayer.hand} />
        </div>
      </div>

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
