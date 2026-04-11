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
import { GameEngine } from '@/lib/game';
import { AdvancedAutoplayer, type StrategyBias } from '@/lib/game/advanced-autoplayer';
import { Battlefield } from './Battlefield';
import { GameStartFlow } from './GameStartFlow';
import type { GameStartPhase } from './GameStartFlow';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useSoundEffects } from '@/lib/hooks/useSoundEffects';
import { PhaseIndicator } from './PhaseIndicator';
import { KeyboardShortcutsLegend } from './KeyboardShortcutsLegend';
import { PlaytesterAssistBanner } from './PlaytesterAssistBanner';
import { DragDropProvider } from '@/lib/hooks/DragDropContext';
import type { GameState, GameAction, CardInstance, DeckDefinition } from '@/lib/game/game-engine';
import type { DeckRecord } from '@/lib/data/decks';
import { getStarterDeckTemplates } from '@/lib/deck/starterTemplates';
import { downloadPlayingCardsDeckExport } from '@/lib/export/playingCards';
import { features } from '@/lib/features/feature-flags';
import { getPlaytesterAssistHint } from '@/lib/playtester/assist';
import {
  AlertTriangle,
  Coins,
  Clock,
  Timer,
  Moon,
  LayoutGrid,
  Swords,
  Castle,
  RefreshCw,
  PackageOpen,
  Flag,
  X,
} from 'lucide-react';

interface PlaytestGameEnhancedProps {
  playerDeck: DeckRecord;
  opponentDeckId: string;
  cardDatabase: Record<string, any>;
  onGameEnd?: (winner: string, reason: string) => void;
}

interface OpponentDeckOption {
  id: string;
  name: string;
  entries: Array<{ cardId: string; qty: number }>;
}

function readBooleanQueryParam(paramName: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const value = new URLSearchParams(window.location.search).get(paramName);
  if (value === '1' || value === 'true') return true;
  if (value === '0' || value === 'false') return false;
  return fallback;
}

function readStringQueryParam(paramName: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(paramName);
}

const DEFAULT_RESOURCE_DECK: Array<{ cardId: string; count: number; zone: 'resource' }> = [
  { cardId: 'TOKEN-RESOURCE-001', count: 8, zone: 'resource' as const },
  { cardId: 'EX-RESOURCE-TOKEN', count: 2, zone: 'resource' as const },
];

function toDeckDefinition(deck: DeckRecord): DeckDefinition {
  const mainDeckEntries: Array<{ cardId: string; count: number; zone: 'main' }> = deck.entries.map((entry) => ({
    cardId: entry.cardId,
    count: entry.qty,
    zone: 'main' as const,
  }));

  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    cards: [...mainDeckEntries, ...DEFAULT_RESOURCE_DECK],
  };
}

function toOpponentDeckDefinition(option: OpponentDeckOption): DeckDefinition {
  const mainDeckEntries: Array<{ cardId: string; count: number; zone: 'main' }> = option.entries.map((entry) => ({
    cardId: entry.cardId,
    count: entry.qty,
    zone: 'main' as const,
  }));

  return {
    id: option.id,
    name: option.name,
    description: `${option.name} starter template`,
    cards: [...mainDeckEntries, ...DEFAULT_RESOURCE_DECK],
  };
}

function inferStrategyBiasFromDeckEntries(
  entries: Array<{ cardId: string; qty: number }>,
  cardDatabase: Record<string, any>,
): StrategyBias {
  const expanded: any[] = [];

  for (const entry of entries) {
    const card = cardDatabase[entry.cardId];
    if (!card || card.type !== 'Unit') continue;
    for (let i = 0; i < entry.qty; i++) {
      expanded.push(card);
    }
  }

  if (expanded.length === 0) return 'BALANCED';

  const avgCost = expanded.reduce((sum, card) => sum + Number(card.cost ?? 0), 0) / expanded.length;
  const avgPower = expanded.reduce((sum, card) => sum + Number(card.ap ?? 0), 0) / expanded.length;

  if (avgCost <= 2.3 && avgPower >= 2.2) return 'AGGRESSIVE';
  if (avgCost >= 3.4) return 'DEFENSIVE';
  return 'BALANCED';
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
  const playtesterAssistV2Enabled = features.playtesterAssistV2();
  const CONTROLS_TOAST_KEY = 'gf.playtest.controlsToastDismissed.v1';

  // Game State
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Misplay error toast — richer than the generic error string
  const [misplayError, setMisplayError] = useState<{
    message: string;
    hint: string;
    category: 'resource' | 'phase' | 'turn' | 'exhausted' | 'zone' | 'combat' | 'base' | 'mulligan' | 'deck' | 'generic';
    accent: string;
  } | null>(null);
  const misplayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMisplay = React.useCallback((message: string, rulesTrace?: string) => {
    if (misplayTimerRef.current) clearTimeout(misplayTimerRef.current);

    const text = `${message} ${rulesTrace ?? ''}`.toLowerCase();
    let hint = rulesTrace ?? '';
    let accent = 'bg-red-950/95 border-red-700/60';
    let category: NonNullable<typeof misplayError>['category'] = 'generic';

    if (text.includes('resource')) {
      category = 'resource';
      accent = 'bg-amber-950/95 border-amber-600/60';
      hint = rulesTrace || 'Place more resources during your Resource Phase before playing this card.';
    } else if (text.includes('phase') || text.includes('cannot be used in')) {
      category = 'phase';
      accent = 'bg-indigo-950/95 border-indigo-600/60';
      hint = rulesTrace || 'This action is not allowed in the current phase.';
    } else if (text.includes('not your turn')) {
      category = 'turn';
      accent = 'bg-slate-900/95 border-slate-600/60';
      hint = 'Wait for your opponent\'s turn to end.';
    } else if (text.includes('exhausted') || text.includes('rest')) {
      category = 'exhausted';
      accent = 'bg-slate-900/95 border-slate-600/60';
      hint = rulesTrace || 'Resting units cannot attack. They recover at the start of your next turn.';
    } else if (text.includes('battle area full') || text.includes('exceed 6')) {
      category = 'zone';
      accent = 'bg-red-950/95 border-red-700/60';
      hint = 'The battle area is full (max 6 units). A unit must be destroyed or removed first.';
    } else if (text.includes('blocker') || text.includes('high-maneuver') || text.includes('high_maneuver')) {
      category = 'combat';
      accent = 'bg-purple-950/95 border-purple-600/60';
      hint = rulesTrace || 'High-Maneuver units cannot be blocked.';
    } else if (text.includes('base already')) {
      category = 'base';
      accent = 'bg-red-950/95 border-red-700/60';
      hint = 'You already have a base in play. Only one base is allowed at a time.';
    } else if (text.includes('mulligan')) {
      category = 'mulligan';
      accent = 'bg-slate-900/95 border-slate-600/60';
      hint = 'You can only mulligan once per game.';
    } else if (text.includes('draw') || text.includes('empty')) {
      category = 'deck';
      accent = 'bg-slate-900/95 border-slate-600/60';
      hint = rulesTrace || 'No cards left to draw.';
    } else if (text.includes('game is over')) {
      category = 'generic';
      accent = 'bg-slate-900/95 border-slate-600/60';
      hint = 'The game has ended.';
    }

    setMisplayError({ message, hint, category, accent });
    const delay = hint.length > 60 ? 6000 : 4000;
    misplayTimerRef.current = setTimeout(() => setMisplayError(null), delay);
  }, []);

  // Autoplayer
  const autoplayerRef = useRef(new AdvancedAutoplayer());
  const mobilePlayerAutoplayerRef = useRef(new AdvancedAutoplayer('player1'));
  const mobileOpponentAutoplayerRef = useRef(new AdvancedAutoplayer('player2'));

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
  const [disableSetupAnimations, setDisableSetupAnimations] = useState(() =>
    readBooleanQueryParam('fastSetup', true),
  );
  const [autoResolveTriggers, setAutoResolveTriggers] = useState(() =>
    readBooleanQueryParam('autoTriggers', true),
  );
  const [selectedOpponentDeckId, setSelectedOpponentDeckId] = useState(() =>
    readStringQueryParam('opponentDeck') ?? opponentDeckId,
  );
  const [showControlsToast, setShowControlsToast] = useState(false);

  const opponentDeckOptions = React.useMemo<OpponentDeckOption[]>(() => {
    const starterOptions = getStarterDeckTemplates(8).map((template) => ({
      id: template.slug,
      name: template.name,
      entries: template.entries,
    }));

    return [
      {
        id: 'token-colorless-bot',
        name: 'Token Colorless Bot',
        entries: [],
      },
      ...starterOptions,
    ];
  }, []);

  useEffect(() => {
    if (opponentDeckOptions.some((option) => option.id === selectedOpponentDeckId)) return;
    setSelectedOpponentDeckId(opponentDeckOptions[0]?.id ?? opponentDeckId);
  }, [opponentDeckId, opponentDeckOptions, selectedOpponentDeckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.set('opponentDeck', selectedOpponentDeckId);
    url.searchParams.set('autoTriggers', autoResolveTriggers ? '1' : '0');
    url.searchParams.set('fastSetup', disableSetupAnimations ? '1' : '0');

    window.history.replaceState({}, '', url.toString());
  }, [autoResolveTriggers, disableSetupAnimations, selectedOpponentDeckId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(CONTROLS_TOAST_KEY) === '1';
    if (!dismissed) {
      setShowControlsToast(true);
    }
  }, [CONTROLS_TOAST_KEY]);

  const dismissControlsToast = () => {
    setShowControlsToast(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CONTROLS_TOAST_KEY, '1');
    }
  };

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

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);
  const isMobileAutoMode = isMobile;

  useEffect(() => {
    const checkMobileSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobileSize();

    // Listen for resize
    window.addEventListener('resize', checkMobileSize);
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    try {
      const deckDefinition = toDeckDefinition(playerDeck);
      const selectedOpponent = opponentDeckOptions.find((option) => option.id === selectedOpponentDeckId);
      const opponentDefinition = selectedOpponent && selectedOpponent.entries.length > 0
        ? toOpponentDeckDefinition(selectedOpponent)
        : undefined;

      const playerStrategyBias = inferStrategyBiasFromDeckEntries(playerDeck.entries, cardDatabase);
      const opponentStrategyBias = selectedOpponent
        ? inferStrategyBiasFromDeckEntries(selectedOpponent.entries, cardDatabase)
        : 'BALANCED';

      const eng = new GameEngine(playerDeck.id, deckDefinition, cardDatabase, opponentDefinition);
      autoplayerRef.current = new AdvancedAutoplayer('player2', cardDatabase);
      mobilePlayerAutoplayerRef.current = new AdvancedAutoplayer('player1', cardDatabase, playerStrategyBias);
      mobileOpponentAutoplayerRef.current = new AdvancedAutoplayer('player2', cardDatabase, opponentStrategyBias);
      setEngine(eng);
      setGameState(eng.getState());
      setStartPhase('coinFlip');
      setGameReady(false);
      setSelectedCard(null);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize game');
      setIsLoading(false);
    }
  }, [playerDeck, cardDatabase, opponentDeckOptions, selectedOpponentDeckId]);

  useEffect(() => {
    if (!isMobileAutoMode || !engine || gameReady) return;

    const current = engine.getState();
    if (current.players.player1.hand.length === 0) {
      engine.setupDraw('player1', 5);
    }
    if (current.players.player2.hand.length === 0) {
      engine.setupDraw('player2', 5);
    }

    engine.setFirstPlayer('player1');
    engine.executeAction({
      type: 'ADVANCE_PHASE',
      playerId: 'player1',
      timestamp: Date.now(),
    });

    setGameState(engine.getState());
    setGameReady(true);
  }, [engine, gameReady, isMobileAutoMode]);

  useEffect(() => {
    if (!engine || !gameState || !gameReady || !autoResolveTriggers) return;
    if (gameState.stack.length === 0) return;

    const timeout = setTimeout(() => {
      const current = engine.getState();
      if (current.stack.length === 0) return;

      const validation = engine.executeAction({
        type: 'RESOLVE_ALL_TRIGGERS',
        playerId: current.activePlayerId,
        timestamp: Date.now(),
      });

      if (validation.valid) {
        setGameState(engine.getState());
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [autoResolveTriggers, engine, gameReady, gameState]);

  useEffect(() => {
    if (!isMobileAutoMode || !engine || !gameReady || !gameState) return;
    if (gameState.isGameOver || gameState.phase === 'gameOver') return;

    const timeout = setTimeout(() => {
      const currentState = engine.getState();
      if (currentState.isGameOver || currentState.phase === 'gameOver') return;

      if (currentState.stack.length > 0) {
        const stackValidation = engine.executeAction({
          type: 'RESOLVE_ALL_TRIGGERS',
          playerId: currentState.activePlayerId,
          timestamp: Date.now(),
        });

        if (stackValidation.valid) {
          setGameState(engine.getState());
        }
        return;
      }

      const activeAutoplayer = currentState.activePlayerId === 'player1'
        ? mobilePlayerAutoplayerRef.current
        : mobileOpponentAutoplayerRef.current;

      const decision = activeAutoplayer.decideActions(currentState, cardDatabase);
      if (decision.actions.length === 0) {
        engine.executeAction({
          type: 'ADVANCE_PHASE',
          playerId: currentState.activePlayerId,
          timestamp: Date.now(),
        });
      } else {
        for (const action of decision.actions) {
          engine.executeAction(action);
        }
      }

      setGameState(engine.getState());
    }, 450);

    return () => clearTimeout(timeout);
  }, [cardDatabase, engine, gameReady, gameState, isMobileAutoMode]);

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
      showMisplay(validation.error || 'Invalid action', validation.rulesTrace);
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

  // Opponent turn: fire autoplayer when it's player2's turn (desktop/tablet mode)
  useEffect(() => {
    if (isMobileAutoMode) return;
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
  }, [gameState?.activePlayerId, gameState?.phase, isMobileAutoMode]);

  // Dismiss error
  const dismissError = () => {
    setError(null);
    setMisplayError(null);
    if (misplayTimerRef.current) clearTimeout(misplayTimerRef.current);
  };

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

  // Derived state — computed before early returns so hooks are never conditional.
  const isSetupPhase = !gameReady;
  const isPlayerTurn = gameState?.activePlayerId === 'player1';
  const isDrawPhase = gameState?.phase === 'draw';
  const isResourcePhase = gameState?.phase === 'resource';
  const needsToDraw = isDrawPhase && isPlayerTurn && !gameState?.hasDrawnThisTurn;
  const playerState = gameState?.players['player1'];
  const opponentState = gameState?.players['player2'];
  const needsToPlaceResource =
    isResourcePhase &&
    isPlayerTurn &&
    !gameState?.hasResourcePlacedThisTurn &&
    (playerState?.resourceDeck.length ?? 0) > 0;
  const hasPendingTriggers = (gameState?.stack.length ?? 0) > 0;

  const assistHint = React.useMemo(
    () =>
      getPlaytesterAssistHint({
        isSetupPhase,
        isPlayerTurn,
        hasPendingTriggers,
        stackSize: gameState?.stack.length ?? 0,
        needsToDraw,
        needsToPlaceResource,
        phase: gameState?.phase ?? 'start',
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameState?.phase, gameState?.stack.length, hasPendingTriggers, isPlayerTurn, isSetupPhase, needsToDraw, needsToPlaceResource],
  );

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
          <p className="text-white mt-2">{error || 'Failed to load game'}</p>
        </div>
      </div>
    );
  }

  // gameState and engine are guaranteed non-null past this point.
  const resolvedPlayerState = gameState.players['player1'];
  const resolvedOpponentState = gameState.players['player2'];

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

          {isMobileAutoMode && !isSetupPhase && (
            <span className="px-2 py-1 text-[10px] rounded-full border border-cyan-300/40 bg-cyan-950/50 text-cyan-100 whitespace-nowrap">
              Mobile Auto Match
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons — always in one row, never wrap */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Undo/Redo */}
            {!isSetupPhase && !isMobileAutoMode && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={!engine?.canUndo()}
                  className="px-2 py-1 bg-surface-elevated hover:bg-surface disabled:bg-surface-muted disabled:text-white rounded text-xs transition"
                  title="Undo (Ctrl+Z)"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!engine?.canRedo()}
                  className="px-2 py-1 bg-surface-elevated hover:bg-surface disabled:bg-surface-muted disabled:text-white rounded text-xs transition"
                  title="Redo (Ctrl+Y)"
                >
                  ↷
                </button>
              </>
            )}

            {/* Draw Card — only when player must draw */}
            {!isSetupPhase && !isMobileAutoMode && needsToDraw && (
              <button
                onClick={handleDraw}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-xs transition animate-pulse"
              >
                Draw Card
              </button>
            )}

            {/* Place Resource — resource phase */}
            {!isSetupPhase && !isMobileAutoMode && needsToPlaceResource && (
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
            {!isSetupPhase && !isMobileAutoMode && (
              <button
                onClick={handleAdvancePhase}
                disabled={!isPlayerTurn || needsToDraw || needsToPlaceResource}
                className="px-3 py-1 bg-cobalt-600 hover:bg-cobalt-700 disabled:bg-surface-muted disabled:text-white disabled:cursor-not-allowed text-foreground rounded font-semibold text-xs transition"
                title={needsToDraw ? 'Draw first' : needsToPlaceResource ? 'Place resource first' : 'Next phase (Enter)'}
              >
                {needsToDraw ? 'Draw First' : needsToPlaceResource ? 'Place Resource First' : 'Next Phase →'}
              </button>
            )}

            {/* Resolve Trigger Stack */}
            {!isSetupPhase && !isMobileAutoMode && hasPendingTriggers && (
              <button
                onClick={() =>
                  handleAction({
                    type: 'RESOLVE_ALL_TRIGGERS',
                    playerId: gameState.activePlayerId,
                    timestamp: Date.now(),
                  })
                }
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-xs transition"
                title="Resolve all pending triggers"
              >
                Resolve Triggers ({gameState.stack.length})
              </button>
            )}

            <button
              onClick={() => setAutoResolveTriggers((prev) => !prev)}
              className="px-2 py-1 bg-surface-elevated hover:bg-surface rounded text-xs transition"
              title={autoResolveTriggers ? 'Disable automatic trigger resolution' : 'Enable automatic trigger resolution'}
            >
              {autoResolveTriggers ? 'Auto Triggers On' : 'Auto Triggers Off'}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setDisableSetupAnimations((prev) => !prev)}
              className="px-2 py-1 bg-surface-elevated hover:bg-surface rounded text-xs transition"
              title={disableSetupAnimations ? 'Enable setup animations' : 'Disable setup animations'}
            >
              {disableSetupAnimations ? 'Fast Setup' : 'Animated Setup'}
            </button>

            <select
              value={selectedOpponentDeckId}
              onChange={(event) => setSelectedOpponentDeckId(event.target.value)}
              className="px-2 py-1 bg-surface-elevated border border-border rounded text-xs text-foreground max-w-[200px]"
              title="Select opponent deck"
            >
              {opponentDeckOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                downloadPlayingCardsDeckExport(playerDeck, cardDatabase);
                setError('PlayingCards export downloaded.');
                setTimeout(() => setError(null), 1500);
              }}
              className="px-2 py-1 bg-surface-elevated hover:bg-surface rounded text-xs transition"
              title="Download deck export for PlayingCards.io"
            >
              Export P.io
            </button>

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
              className="px-2 py-1 text-white hover:text-foreground hover:bg-surface-elevated rounded text-xs transition"
              aria-label="Keyboard shortcuts help"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>

            {/* Back to Decks */}
            <Link
              href="/decks"
              className="px-2 py-1 text-white hover:text-foreground hover:bg-surface-elevated rounded text-xs transition border border-border ml-1"
              title="Exit playtester and return to deck list"
            >
              ← Decks
            </Link>
          </div>
        </div>

        {!isSetupPhase && !isMobileAutoMode && (
          <div className="mt-1 hidden lg:flex items-center justify-end">
            <p className="text-[10px] text-slate-400/90 tracking-wide">
              Hover cards to preview · Double-click card or press P to pin
            </p>
          </div>
        )}

        {playtesterAssistV2Enabled && !isSetupPhase && (
          <PlaytesterAssistBanner assistHint={assistHint} isPlayerTurn={isPlayerTurn} turnNumber={gameState.turnNumber} />
        )}
      </header>

      {/* SETUP PHASE — GameStartFlow */}
      {isSetupPhase && !isMobileAutoMode && (
        <GameStartFlow
          phase={startPhase}
          playerId="player1"
          opponentId="player2"
          handCards={engine.getState().players['player1'].hand}
          cardDatabase={cardDatabase}
          disableAnimations={disableSetupAnimations}
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

      {isSetupPhase && isMobileAutoMode && (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div className="max-w-sm space-y-2">
            <div className="text-cyan-200 text-lg font-semibold">Preparing Auto Match</div>
            <p className="text-slate-300 text-sm">
              Setting opening hands and running AI strategies based on your playtest deck.
            </p>
          </div>
        </div>
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
          onDropError={(msg) => showMisplay(msg)}
        >
          <main className="flex-1 overflow-hidden" id="main-content">
            <Battlefield
              playerState={resolvedPlayerState}
              opponentState={resolvedOpponentState}
              isPlayerTurn={isPlayerTurn}
              gamePhase={gameState.phase}
              cardDatabase={cardDatabase}
              selectedCard={selectedCard}
              turnNumber={gameState.turnNumber}
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

      {/* Misplay Error Toast */}
      {misplayError && (() => {
        const iconMap: Record<NonNullable<typeof misplayError>['category'], React.ReactNode> = {
          resource: <Coins className="w-4 h-4 shrink-0 mt-0.5" />,
          phase:    <Clock className="w-4 h-4 shrink-0 mt-0.5" />,
          turn:     <Timer className="w-4 h-4 shrink-0 mt-0.5" />,
          exhausted: <Moon className="w-4 h-4 shrink-0 mt-0.5" />,
          zone:     <LayoutGrid className="w-4 h-4 shrink-0 mt-0.5" />,
          combat:   <Swords className="w-4 h-4 shrink-0 mt-0.5" />,
          base:     <Castle className="w-4 h-4 shrink-0 mt-0.5" />,
          mulligan: <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />,
          deck:     <PackageOpen className="w-4 h-4 shrink-0 mt-0.5" />,
          generic:  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />,
        };
        return (
          <div
            className={`fixed bottom-4 right-4 flex flex-col gap-1.5 text-white px-4 py-3 rounded-xl shadow-2xl max-w-sm z-50 border backdrop-blur-sm ${misplayError.accent}`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-2.5">
              <span aria-hidden="true" className="text-white/80">
                {iconMap[misplayError.category]}
              </span>
              <span className="flex-1 text-sm font-semibold leading-snug">
                {misplayError.message}
              </span>
              <button
                onClick={dismissError}
                className="shrink-0 text-white/50 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {misplayError.hint && misplayError.hint !== misplayError.message && (
              <p className="text-xs text-white/70 leading-snug pl-[26px]">
                {misplayError.hint}
              </p>
            )}
          </div>
        );
      })()}

      {/* Generic Error Toast (init/system errors) */}
      {error && !misplayError && (
        <div
          className="fixed bottom-4 right-4 flex items-start gap-2.5 bg-destructive/90 text-white px-4 py-3 rounded-xl shadow-lg max-w-xs z-50 border border-destructive/60 backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-white/80" aria-hidden="true" />
          <span className="flex-1 text-sm">{error}</span>
          <button
            onClick={dismissError}
            className="shrink-0 text-white/50 hover:text-white transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* One-time Controls Toast */}
      {!isSetupPhase && showControlsToast && !isMobileAutoMode && (
        <div
          className="fixed top-20 right-4 max-w-sm rounded-lg border border-cyan-400/35 bg-slate-950/95 px-4 py-3 text-slate-100 shadow-xl z-50"
          role="status"
          aria-live="polite"
        >
          <div className="text-sm font-semibold text-cyan-200 mb-1">New Controls</div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hover cards to preview. Double-click any card or press P to pin the preview while you play.
          </p>
          <div className="mt-2 flex justify-end">
            <button
              onClick={dismissControlsToast}
              className="text-xs px-2 py-1 rounded border border-cyan-300/40 text-cyan-200 hover:bg-cyan-900/30 transition"
            >
              Got it
            </button>
          </div>
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
                <span className="text-white font-mono text-[10px]">[T{entry.state.turnNumber ?? '?'}]</span>
                <span className="text-white ml-1">{entry.description || entry.actionType}</span>
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
