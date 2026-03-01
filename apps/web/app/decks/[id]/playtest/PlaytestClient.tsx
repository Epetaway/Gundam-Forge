'use client';

import { useEffect, useState } from 'react';
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
  const [botAutoplay, setBotAutoplay] = useState(false);
  const [botDecisionLog, setBotDecisionLog] = useState<string[]>([]);
  const [hoveredCardInstanceId, setHoveredCardInstanceId] = useState<string>();
  const [cardScale, setCardScale] = useState(1);
  const [focusMode, setFocusMode] = useState(false);
  const [legalityMode, setLegalityMode] = useState<'strict' | 'sandbox'>('strict');
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileHandOpen, setIsMobileHandOpen] = useState(false);
  const [mobilePreviewCardId, setMobilePreviewCardId] = useState<string>();
  const [contextMenu, setContextMenu] = useState<{
    instanceId: string;
    x: number;
    y: number;
  } | null>(null);

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
    if (legalityMode === 'strict') return;

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
    setState((prev) => {
      const nextSelected = prev.selectedCardId === instanceId ? undefined : instanceId;

      if (isMobile && prev.gameState) {
        for (const player of Object.values(prev.gameState.players)) {
          const card = [
            ...player.deck,
            ...player.hand,
            ...player.battleArea,
            ...player.resources,
            ...player.discardPile,
          ].find((c) => c.instanceId === instanceId);

          if (card) {
            setMobilePreviewCardId(card.cardId);
            break;
          }
        }
      }

      return {
        ...prev,
        selectedCardId: nextSelected,
      };
    });
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

  const applySandboxCardAction = (
    instanceId: string,
    action: 'restToggle' | 'damageUp' | 'damageDown' | 'moveHand' | 'moveBattle' | 'moveTrash',
  ) => {
    if (legalityMode === 'strict') return;

    setState((prev) => {
      if (!prev.gameState) return prev;

      const players = Object.values(prev.gameState.players);

      for (const player of players) {
        const zones: Array<'deck' | 'hand' | 'battleArea' | 'resources' | 'discardPile' | 'shields'> = [
          'deck',
          'hand',
          'battleArea',
          'resources',
          'discardPile',
          'shields',
        ];

        for (const zone of zones) {
          const list = player[zone as keyof typeof player] as unknown as Array<any>;
          const index = Array.isArray(list)
            ? list.findIndex((card) => card.instanceId === instanceId)
            : -1;

          if (index === -1) continue;

          const card = list[index];

          if (action === 'restToggle') {
            card.state = card.state === 'ready' ? 'rest' : 'ready';
          } else if (action === 'damageUp') {
            card.damageMarkers = (card.damageMarkers ?? 0) + 1;
          } else if (action === 'damageDown') {
            card.damageMarkers = Math.max(0, (card.damageMarkers ?? 0) - 1);
          } else {
            list.splice(index, 1);
            if (action === 'moveHand') {
              card.zone = 'hand';
              player.hand.push(card);
            }
            if (action === 'moveBattle') {
              card.zone = 'battle';
              player.battleArea.push(card);
            }
            if (action === 'moveTrash') {
              card.zone = 'trash';
              player.discardPile.push(card);
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
        }
      }

      return prev;
    });
  };

  const appendBotDecision = (entry: string) => {
    setBotDecisionLog((prev) => [...prev.slice(-11), `[T${state.gameState?.turnNumber ?? 0}] ${entry}`]);
  };

  const runBotStep = () => {
    if (!state.gameState) return;

    const gameState = state.gameState;
    const botPlayer = gameState.players['player2'];
    const humanPlayer = gameState.players['player1'];
    const combat = gameState.currentCombat;

    if (gameState.phase === 'battle' && combat?.defenderPlayerId === 'player2') {
      const blockerChoices = botPlayer.battleArea.filter((unit) => unit.state === 'ready');
      const attackerInstanceId = combat.attackerInstanceIds?.[0];
      if (attackerInstanceId && blockerChoices.length > 0 && !combat.blockerInstanceIds?.length) {
        appendBotDecision(`Bot blocks with ${blockerChoices[0].cardId}`);
        executeAction('DECLARE_BLOCK', {
          defenderId: 'player2',
          attackerPlayerId: combat.attackerPlayerId,
          attackerInstanceId,
          blockerId: blockerChoices[0].instanceId,
        });
        return;
      }

      appendBotDecision('Bot resolves combat while defending');
      executeAction('RESOLVE_COMBAT', {
        attackerPlayerId: combat.attackerPlayerId,
        defenderPlayerId: combat.defenderPlayerId,
        attackerInstanceId: attackerInstanceId,
        blockerInstanceIds: combat.blockerInstanceIds || [],
        target: combat.target || 'shield',
      });
      return;
    }

    if (gameState.activePlayerId !== 'player2') {
      return;
    }

    if (gameState.phase === 'setup') {
      appendBotDecision('Bot advances from setup to draw');
      executeAction('ADVANCE_PHASE');
      return;
    }

    if (gameState.phase === 'draw') {
      if (!gameState.hasDrawnThisTurn && botPlayer.deck.length > 0) {
        appendBotDecision('Bot draws for turn');
        executeAction('DRAW');
      } else {
        appendBotDecision('Bot advances to main phase');
        executeAction('ADVANCE_PHASE');
      }
      return;
    }

    if (gameState.phase === 'main') {
      if (botPlayer.hand.length > 0) {
        appendBotDecision(`Bot deploys ${botPlayer.hand[0].cardId}`);
        executeAction('PLAY_CARD', { cardInstanceId: botPlayer.hand[0].instanceId });
        return;
      }

      const readyAttackers = botPlayer.battleArea.filter((unit) => unit.state === 'ready');
      if (readyAttackers.length > 0) {
        appendBotDecision(`Bot attacks with ${readyAttackers[0].cardId}`);
        executeAction('DECLARE_ATTACK', {
          attackerInstanceIds: [readyAttackers[0].instanceId],
          attackerInstanceId: readyAttackers[0].instanceId,
          attackerPlayerId: 'player2',
          defenderPlayerId: 'player1',
          target: humanPlayer.shields.length > 0 ? 'shield' : 'base',
        });
        return;
      }

      appendBotDecision('Bot has no play in main; advancing phase');
      executeAction('ADVANCE_PHASE');
      return;
    }

    if (gameState.phase === 'battle') {
      const attackerInstanceId = combat?.attackerInstanceIds?.[0];
      appendBotDecision('Bot resolves combat');
      executeAction('RESOLVE_COMBAT', {
        attackerPlayerId: combat?.attackerPlayerId ?? 'player2',
        defenderPlayerId: combat?.defenderPlayerId ?? 'player1',
        attackerInstanceId,
        blockerInstanceIds: combat?.blockerInstanceIds || [],
        target: combat?.target || 'shield',
      });
      return;
    }

    appendBotDecision(`Bot advances from ${gameState.phase}`);
    executeAction('ADVANCE_PHASE');
  };

  useEffect(() => {
    if (!botAutoplay || state.showOpeningHand || !state.gameState) return;

    const gameState = state.gameState;
    const botShouldAct =
      gameState.activePlayerId === 'player2' ||
      (gameState.phase === 'battle' && gameState.currentCombat?.defenderPlayerId === 'player2');

    if (!botShouldAct) return;

    const timer = setTimeout(() => runBotStep(), 250);
    return () => clearTimeout(timer);
  }, [botAutoplay, state.showOpeningHand, state.gameState]);

  useEffect(() => {
    const evaluateMobile = () => setIsMobile(window.innerWidth < 1024);
    evaluateMobile();
    window.addEventListener('resize', evaluateMobile);
    return () => window.removeEventListener('resize', evaluateMobile);
  }, []);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = event.key.toLowerCase();
      if (key === 'u') {
        event.preventDefault();
        handleUndo();
      }
      if (key === 'd') {
        event.preventDefault();
        executeAction('DRAW');
      }
      if (key === 's') {
        event.preventDefault();
        executeAction('ACTIVATE_ABILITY');
      }
      if (key === 'e') {
        event.preventDefault();
        executeAction('ADVANCE_PHASE');
      }
      if (key === 'r' && state.selectedCardId) {
        event.preventDefault();
        if (legalityMode === 'sandbox') {
          handleCardRest(state.selectedCardId);
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [state.selectedCardId, legalityMode]);

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
  const canBotStep =
    gameState.activePlayerId === 'player2' ||
    (gameState.phase === 'battle' && gameState.currentCombat?.defenderPlayerId === 'player2');
  const inspectorCardId = (() => {
    const activeInstanceId = isMobile ? state.selectedCardId : hoveredCardInstanceId || state.selectedCardId;
    if (!activeInstanceId) return undefined;

    for (const player of Object.values(gameState.players)) {
      const found = [
        ...player.deck,
        ...player.hand,
        ...player.battleArea,
        ...player.resources,
        ...player.discardPile,
      ].find((card) => card.instanceId === activeInstanceId);

      if (found) return found.cardId;
    }
    return undefined;
  })();

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
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setFocusMode((prev) => !prev)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition"
            >
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </button>
            <button
              onClick={() => setCardScale((prev) => Math.max(0.8, Number((prev - 0.1).toFixed(1))))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition"
            >
              Zoom -
            </button>
            <button
              onClick={() => setCardScale((prev) => Math.min(1.4, Number((prev + 0.1).toFixed(1))))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition"
            >
              Zoom +
            </button>
            <button
              onClick={() => setLegalityMode((prev) => (prev === 'strict' ? 'sandbox' : 'strict'))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition"
            >
              Mode: {legalityMode === 'strict' ? 'Strict' : 'Sandbox'}
            </button>
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

        <div className={`grid grid-cols-1 ${focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-5'} gap-6`}>
          {!focusMode && (
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

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-300 mb-3 text-sm">Bot Decisions</h3>
              {botDecisionLog.length === 0 ? (
                <p className="text-xs text-slate-500">No bot decisions yet.</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-300 max-h-36 overflow-y-auto pr-1">
                  {botDecisionLog.slice(-8).map((entry, index) => (
                    <li key={`${entry}-${index}`}>{entry}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h3 className="font-semibold text-slate-300 mb-3 text-sm">Quick Rules</h3>
              <ul className="space-y-1 text-xs text-slate-300">
                <li>• D: Draw</li>
                <li>• S: Activate support</li>
                <li>• U: Undo</li>
                <li>• E: End phase</li>
                <li>• R: Rest/ready selected (Sandbox)</li>
              </ul>
            </div>
          </div>
          )}

          <div className={focusMode ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <PlaymatCenter
              gameState={gameState}
              selectedCardId={state.selectedCardId}
              onCardSelect={handleCardSelect}
              onCardRest={legalityMode === 'sandbox' ? handleCardRest : undefined}
              onCardHoverStart={(instanceId) => setHoveredCardInstanceId(instanceId)}
              onCardHoverEnd={() => setHoveredCardInstanceId(undefined)}
              onCardContextMenu={(instanceId, x, y) => {
                if (legalityMode !== 'sandbox') return;
                setContextMenu({ instanceId, x, y });
              }}
              cardScale={cardScale}
            />
          </div>

          {!focusMode && (
          <div className="lg:col-span-1 space-y-6">
            <CardInspector cardId={inspectorCardId || getSelectedCardId()} />
            <div>
              <PlaytestActionPanel
                gameState={gameState}
                onAction={executeAction}
                botAutoplay={botAutoplay}
                onToggleBotAutoplay={() => setBotAutoplay((prev) => !prev)}
                onBotStep={runBotStep}
                canBotStep={canBotStep}
              />
            </div>
          </div>
          )}
        </div>

        <div className="mt-6 hidden lg:block">
          <CardFan hand={currentPlayer.hand} scale={cardScale} />
        </div>

        <div className="lg:hidden mt-4">
          <button
            onClick={() => setIsMobileHandOpen((prev) => !prev)}
            className="w-full px-4 py-3 rounded bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-200"
          >
            {isMobileHandOpen ? 'Close Hand' : `Open Hand (${currentPlayer.hand.length})`}
          </button>

          {isMobileHandOpen && (
            <div className="mt-3 bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-2">
                {currentPlayer.hand.length === 0 ? (
                  <p className="text-xs text-slate-500">No cards in hand</p>
                ) : (
                  currentPlayer.hand.map((card) => (
                    <button
                      key={card.instanceId}
                      onClick={() => setMobilePreviewCardId(card.cardId)}
                      className="w-full text-left text-xs bg-slate-900 border border-slate-700 rounded px-2 py-2 text-slate-200"
                    >
                      {card.cardId}
                    </button>
                  ))
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => executeAction('DRAW')}
                  className="px-2 py-2 rounded bg-blue-700 text-white text-xs"
                >
                  Draw
                </button>
                <button
                  onClick={() => executeAction('PLAY_CARD', { cardInstanceId: currentPlayer.hand[0]?.instanceId })}
                  disabled={currentPlayer.hand.length === 0}
                  className="px-2 py-2 rounded bg-green-700 disabled:bg-slate-700 text-white text-xs"
                >
                  Play
                </button>
                <button
                  onClick={() => executeAction('ADVANCE_PHASE')}
                  className="px-2 py-2 rounded bg-slate-700 text-white text-xs"
                >
                  End
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {contextMenu && legalityMode === 'sandbox' && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div
            className="absolute bg-slate-900 border border-slate-700 rounded shadow-xl p-2 w-44"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'restToggle');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              Rest / Ready
            </button>
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'damageUp');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              +1 Damage
            </button>
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'damageDown');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              -1 Damage
            </button>
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'moveBattle');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              Move to Battle
            </button>
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'moveHand');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              Move to Hand
            </button>
            <button
              onClick={() => {
                applySandboxCardAction(contextMenu.instanceId, 'moveTrash');
                setContextMenu(null);
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-slate-800 rounded text-slate-200"
            >
              Move to Trash
            </button>
          </div>
        </div>
      )}

      {isMobile && mobilePreviewCardId && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setMobilePreviewCardId(undefined)}>
          <div className="absolute inset-x-4 top-8 bottom-8" onClick={(e) => e.stopPropagation()}>
            <CardInspector cardId={mobilePreviewCardId} />
          </div>
        </div>
      )}

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
