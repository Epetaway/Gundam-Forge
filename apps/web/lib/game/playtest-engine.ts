/**
 * Playtester Game Engine
 * Integrates all systems: setup, phases, combat, logging, AI
 *
 * This is the main orchestrator that coordinates:
 * - Deck validation & loading
 * - Setup sequence execution
 * - Phase management & action gating
 * - Combat resolution
 * - Trigger queue management
 * - Game logging
 * - Autoplayer decisions
 */

import { SetupController } from './setup-sequence';
import { PhaseManager, getPhaseName } from './phase-manager';
import { TriggerQueueManager } from './trigger-queue';
import { CombatResolver, CombatResult } from './combat-resolution';
import { GameLogger, GameLogEntry } from './game-logger';
import { Autoplayer } from './autoplayer';
import { createSeed, shuffleDeck, drawMultipleCards } from './shuffle-and-seed';
import { performCoinFlip } from './coin-flip';
import type { CardInstance, GameState, GameAction, ActionType, Phase } from './game-engine';

/**
 * PlaytestEngine - Main game orchestrator
 */
export class PlaytestEngine {
  private gameState: GameState;
  private setupController: SetupController;
  private phaseManager: PhaseManager;
  private triggerQueue: TriggerQueueManager;
  private combatResolver: CombatResolver;
  private logger: GameLogger;
  private autoplayer: Autoplayer;
  private cardDatabase: Record<string, any>;

  constructor(
    gameId: string,
    deckId: string,
    playerDeck: CardInstance[],
    opponentDeck: CardInstance[],
    cardDatabase: Record<string, any>,
    playerName: string = 'Player',
    opponentName: string = 'Opponent',
  ) {
    this.cardDatabase = cardDatabase;

    // Initialize game state
    this.gameState = {
      gameId,
      deckId,
      turnNumber: 1,
      activePlayerId: 'player1',
      phase: 'setup',
      priorityPlayer: 'player1',
      players: {
        player1: this.createPlayerState('player1', playerName, playerDeck),
        player2: this.createPlayerState('player2', opponentName, opponentDeck),
      },
      stack: [],
      log: [],
      rngSeed: 0,
      isGameOver: false,
      hasDrawnThisTurn: false,
      hasMainPhaseActions: 0,
    };

    // Initialize systems
    this.setupController = new SetupController();
    this.phaseManager = new PhaseManager();
    this.triggerQueue = new TriggerQueueManager();
    this.combatResolver = new CombatResolver(this.triggerQueue);
    this.logger = new GameLogger();
    this.autoplayer = new Autoplayer();
    this.autoplayer.initialize('player2');

    this.phaseManager.initialize('player1', 1);
  }

  /**
   * Create player state from deck
   */
  private createPlayerState(
    playerId: string,
    playerName: string,
    deck: CardInstance[],
  ): any {
    return {
      playerId,
      name: playerName,
      deck: [...deck],
      hand: [],
      discardPile: [],
      battleArea: [],
      shields: [],
      base: null,
      resources: [],
      exZone: { exResources: [] },
      baseHealth: 20,
      maxBaseHealth: 20,
      shieldsDrawnThisTurn: 0,
      deckShuffleSeed: 0,
    };
  }

  /**
   * Execute full setup sequence
   */
  async executeSetup(): Promise<{ success: boolean; message: string }> {
    const seed = createSeed(this.gameState.deckId);
    this.gameState.rngSeed = seed.value;

    // Shuffle both decks
    this.gameState.players['player1'].deck = shuffleDeck(
      this.gameState.players['player1'].deck,
      seed.value,
    );
    this.gameState.players['player2'].deck = shuffleDeck(
      this.gameState.players['player2'].deck,
      seed.value + 1,
    );

    // Draw opening hands
    const player1Hand = drawMultipleCards(this.gameState.players['player1'].deck, 7);
    player1Hand.forEach((c) => {
      c.zone = 'hand';
      this.gameState.players['player1'].hand.push(c);
    });

    const player2Hand = drawMultipleCards(this.gameState.players['player2'].deck, 7);
    player2Hand.forEach((c) => {
      c.zone = 'hand';
      this.gameState.players['player2'].hand.push(c);
    });

    // Place shields (5 for each player)
    for (let i = 0; i < 5; i++) {
      const shieldCard1 = drawMultipleCards(this.gameState.players['player1'].deck, 1)[0];
      if (shieldCard1) {
        shieldCard1.zone = 'shields';
        this.gameState.players['player1'].shields.push(shieldCard1);
      }

      const shieldCard2 = drawMultipleCards(this.gameState.players['player2'].deck, 1)[0];
      if (shieldCard2) {
        shieldCard2.zone = 'shields';
        this.gameState.players['player2'].shields.push(shieldCard2);
      }
    }

    // Coin flip
    const coinFlip = performCoinFlip();
    const firstPlayerId = coinFlip.firstPlayer === 'player' ? 'player1' : 'player2';

    this.gameState.activePlayerId = firstPlayerId;
    this.phaseManager.initialize(firstPlayerId, 1);

    this.logger.logAction(
      Date.now(),
      1,
      'setup',
      firstPlayerId,
      'ADVANCE_PHASE',
      `Setup complete. Coin flip: ${coinFlip.face.toUpperCase()}. ${firstPlayerId} goes first.`,
      'Official setup sequence completed.',
      {
        gameState: {
          player1Life: this.gameState.players['player1'].baseHealth,
          player2Life: this.gameState.players['player2'].baseHealth,
          player1ShieldsCount: this.gameState.players['player1'].shields.length,
          player2ShieldsCount: this.gameState.players['player2'].shields.length,
          player1HandSize: this.gameState.players['player1'].hand.length,
          player2HandSize: this.gameState.players['player2'].hand.length,
          player1DeckSize: this.gameState.players['player1'].deck.length,
          player2DeckSize: this.gameState.players['player2'].deck.length,
        },
      },
    );

    return { success: true, message: 'Setup sequence complete!' };
  }

  /**
   * Execute a game action
   */
  executeAction(action: GameAction): { success: boolean; message: string; log?: GameLogEntry } {
    const phase = this.phaseManager.getPhase();

    // Validate action is allowed in current phase
    const canExecute = this.phaseManager.canExecuteAction(action.type);
    if (!canExecute.allowed) {
      return {
        success: false,
        message: canExecute.reason || `Action ${action.type} not allowed in ${phase} phase`,
      };
    }

    let result = { success: false, message: 'Unknown action' };

    switch (action.type) {
      case 'DRAW':
        result = this.handleDraw(action);
        break;
      case 'ADVANCE_PHASE':
        result = this.handleAdvancePhase(action);
        break;
      case 'PLAY_CARD':
        result = this.handlePlayCard(action);
        break;
      case 'DECLARE_ATTACK':
        result = this.handleDeclareAttack(action);
        break;
      case 'END_PHASE':
        result = this.handleEndPhase(action);
        break;
      default:
        result = { success: false, message: `Unknown action: ${action.type}` };
    }

    return result;
  }

  /**
   * Handle DRAW action
   */
  private handleDraw(action: GameAction): { success: boolean; message: string } {
    const player = this.gameState.players[action.playerId];

    if (player.deck.length === 0) {
      return { success: false, message: 'Deck is empty - you lose!' };
    }

    const card = player.deck.pop();
    if (!card) {
      return { success: false, message: 'Failed to draw card' };
    }

    card.zone = 'hand';
    player.hand.push(card);

    this.phaseManager.markDrawn();
    this.logger.logAction(
      Date.now(),
      this.phaseManager.getTurnNumber(),
      this.phaseManager.getPhase(),
      action.playerId,
      'DRAW',
      `Drew ${this.cardDatabase[card.cardId]?.name || card.cardId}`,
      'Card drawn from deck in Draw Phase',
      { cardIds: [card.cardId] },
    );

    return {
      success: true,
      message: `Drew ${this.cardDatabase[card.cardId]?.name || card.cardId}`,
    };
  }

  /**
   * Handle ADVANCE_PHASE action
   */
  private handleAdvancePhase(action: GameAction): { success: boolean; message: string } {
    const { phase, log } = this.phaseManager.advancePhase();

    this.gameState.phase = phase;
    this.gameState.activePlayerId = this.phaseManager.getActivePlayer();

    this.logger.logAction(
      Date.now(),
      this.phaseManager.getTurnNumber(),
      phase,
      action.playerId,
      'ADVANCE_PHASE',
      log,
      `Transitioned to ${getPhaseName(phase)}`,
    );

    return { success: true, message: log };
  }

  /**
   * Handle PLAY_CARD action
   */
  private handlePlayCard(action: GameAction): { success: boolean; message: string } {
    const { cardInstanceId } = action.payload || {};
    const player = this.gameState.players[action.playerId];

    const card = player.hand.find((c) => c.instanceId === cardInstanceId);
    if (!card) {
      return { success: false, message: 'Card not in hand' };
    }

    const cardDef = this.cardDatabase[card.cardId];
    if (!cardDef) {
      return { success: false, message: 'Card definition not found' };
    }

    // Remove from hand
    player.hand = player.hand.filter((c) => c.instanceId !== cardInstanceId);

    // Add to appropriate zone
    card.zone = 'battle';
    card.state = 'rest'; // Units enter exhausted
    player.battleArea.push(card);

    this.logger.logAction(
      Date.now(),
      this.phaseManager.getTurnNumber(),
      this.phaseManager.getPhase(),
      action.playerId,
      'PLAY_CARD',
      `Played ${cardDef.name}`,
      `Card played from hand to Battle Zone`,
      { cardIds: [card.cardId] },
    );

    return { success: true, message: `Played ${cardDef.name}` };
  }

  /**
   * Handle DECLARE_ATTACK action
   */
  private handleDeclareAttack(action: GameAction): { success: boolean; message: string } {
    const { attackerInstanceId, targetInstanceId } = action.payload || {};
    const player = this.gameState.players[action.playerId];

    const attacker = player.battleArea.find((u) => u.instanceId === attackerInstanceId);
    if (!attacker) {
      return { success: false, message: 'Unit not found in battle area' };
    }

    if (attacker.state !== 'ready') {
      return { success: false, message: 'Unit is exhausted and cannot attack' };
    }

    // Attacker becomes exhausted
    attacker.state = 'rest';

    const attackerDef = this.cardDatabase[attacker.cardId];
    let message = `${attackerDef?.name || attacker.cardId} attacks`;

    if (targetInstanceId) {
      const opponent = Object.values(this.gameState.players).find(
        (p) => p.playerId !== action.playerId,
      );
      const defender = opponent?.battleArea.find((u) => u.instanceId === targetInstanceId);

      if (defender) {
        const combat = this.combatResolver.createCombat(
          attackerInstanceId,
          attacker.cardId,
          targetInstanceId,
          defender.cardId,
        );

        const result = this.combatResolver.resolveCombat(combat, attacker, defender, this.gameState, this.cardDatabase);

        message += ` - ${result.description}`;

        this.logger.logAction(
          Date.now(),
          this.phaseManager.getTurnNumber(),
          this.phaseManager.getPhase(),
          action.playerId,
          'DECLARE_ATTACK',
          message,
          `Combat resolved: ${result.description}`,
          { cardIds: [attacker.cardId, defender.cardId] },
        );

        return { success: true, message };
      }
    }

    this.logger.logAction(
      Date.now(),
      this.phaseManager.getTurnNumber(),
      this.phaseManager.getPhase(),
      action.playerId,
      'DECLARE_ATTACK',
      message,
      `Attack declared`,
      { cardIds: [attacker.cardId] },
    );

    return { success: true, message };
  }

  /**
   * Handle END_PHASE action
   */
  private handleEndPhase(action: GameAction): { success: boolean; message: string } {
    const player = this.gameState.players[action.playerId];

    // Enforce hand limit
    while (player.hand.length > 7) {
      player.hand.pop(); // Simplified - should let player choose
    }

    return { success: true, message: 'Ending phase...' };
  }

  /**
   * Execute autoplayer turn
   */
  async executeAutoplayer(): Promise<void> {
    if (this.gameState.activePlayerId !== 'player2') {
      return;
    }

    const decision = this.autoplayer.decideActions(this.gameState);

    for (const action of decision.actions) {
      this.executeAction(action);
      // Small delay for visibility
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  /**
   * Check win conditions
   */
  checkWinConditions(): { gameOver: boolean; winner?: string; reason?: string } {
    const player1 = this.gameState.players['player1'];
    const player2 = this.gameState.players['player2'];

    // Base health check
    if (player1.baseHealth <= 0) {
      return { gameOver: true, winner: 'player2', reason: 'Player 1 base destroyed' };
    }

    if (player2.baseHealth <= 0) {
      return { gameOver: true, winner: 'player1', reason: 'Player 2 base destroyed' };
    }

    // Deck out check
    if (player1.deck.length === 0) {
      return { gameOver: true, winner: 'player2', reason: 'Player 1 deck empty' };
    }

    if (player2.deck.length === 0) {
      return { gameOver: true, winner: 'player1', reason: 'Player 2 deck empty' };
    }

    return { gameOver: false };
  }

  /**
   * Get game state snapshot
   */
  getState(): GameState {
    return this.gameState;
  }

  /**
   * Get game log
   */
  getLog(): GameLogEntry[] {
    return this.logger.getLog();
  }

  /**
   * Get phase manager (for UI)
   */
  getPhaseManager(): PhaseManager {
    return this.phaseManager;
  }

  /**
   * Get trigger queue (for UI)
   */
  getTriggerQueue(): TriggerQueueManager {
    return this.triggerQueue;
  }

  /**
   * Get logger (for UI)
   */
  getLogger(): GameLogger {
    return this.logger;
  }

  /**
   * Format current game status
   */
  getGameStatus(): string {
    const player1 = this.gameState.players['player1'];
    const player2 = this.gameState.players['player2'];

    let status = `\n${'='.repeat(50)}\n`;
    status += `Turn ${this.phaseManager.getTurnNumber()} — ${getPhaseName(this.phaseManager.getPhase())}\n`;
    status += `Active: ${this.gameState.activePlayerId}\n\n`;

    status += `${player1.name}:\n`;
    status += `  Life: ${player1.baseHealth} / ${player1.maxBaseHealth}\n`;
    status += `  Shields: ${player1.shields.length}\n`;
    status += `  Hand: ${player1.hand.length}\n`;
    status += `  Deck: ${player1.deck.length}\n`;
    status += `  Battle: ${player1.battleArea.length} units\n\n`;

    status += `${player2.name}:\n`;
    status += `  Life: ${player2.baseHealth} / ${player2.maxBaseHealth}\n`;
    status += `  Shields: ${player2.shields.length}\n`;
    status += `  Hand: ${player2.hand.length}\n`;
    status += `  Deck: ${player2.deck.length}\n`;
    status += `  Battle: ${player2.battleArea.length} units\n`;

    status += `${'='.repeat(50)}\n`;

    return status;
  }
}
