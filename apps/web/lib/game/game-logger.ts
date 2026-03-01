/**
 * Game Logging System
 * Comprehensive action and state trace for rules enforcement and replay
 */

import { GAME_LOG_CONFIG } from './rules-constants';
import type { ActionType, Phase } from './game-engine';

/**
 * Log entry represents a single game event
 */
export interface GameLogEntry {
  id: string;
  timestamp: number;
  turnNumber: number;
  phase: Phase;
  activePlayer: string;
  actionType: ActionType;
  description: string;
  rulesTrace: string; // Why this action was allowed/why it triggered
  cardIds?: string[]; // Cards involved
  // Simplified state snapshot (not full state)
  gameState?: {
    player1Life?: number;
    player2Life?: number;
    player1ShieldsCount?: number;
    player2ShieldsCount?: number;
    player1HandSize?: number;
    player2HandSize?: number;
    player1DeckSize?: number;
    player2DeckSize?: number;
  };
}

/**
 * Game Logger - maintains comprehensive game log
 */
export class GameLogger {
  private entries: GameLogEntry[] = [];
  private nextId: number = 0;

  /**
   * Log an action
   */
  logAction(
    timestamp: number,
    turnNumber: number,
    phase: Phase,
    activePlayer: string,
    actionType: ActionType,
    description: string,
    rulesTrace: string,
    options?: {
      cardIds?: string[];
      gameState?: GameLogEntry['gameState'];
    },
  ): GameLogEntry {
    const entry: GameLogEntry = {
      id: `log-${this.nextId++}`,
      timestamp,
      turnNumber,
      phase,
      activePlayer,
      actionType,
      description,
      rulesTrace,
      cardIds: options?.cardIds,
      gameState: options?.gameState,
    };

    this.entries.push(entry);

    // Enforce max entries
    if (this.entries.length > GAME_LOG_CONFIG.maxLogEntries) {
      this.entries = this.entries.slice(-GAME_LOG_CONFIG.maxLogEntries);
    }

    return entry;
  }

  /**
   * Get all log entries
   */
  getLog(): GameLogEntry[] {
    return [...this.entries];
  }

  /**
   * Get log entries for specific turn
   */
  getLogForTurn(turnNumber: number): GameLogEntry[] {
    return this.entries.filter((e) => e.turnNumber === turnNumber);
  }

  /**
   * Get log entries for specific phase
   */
  getLogForPhase(phase: Phase): GameLogEntry[] {
    return this.entries.filter((e) => e.phase === phase);
  }

  /**
   * Get log entries for specific player
   */
  getLogForPlayer(playerId: string): GameLogEntry[] {
    return this.entries.filter((e) => e.activePlayer === playerId);
  }

  /**
   * Get recent entries
   */
  getRecentLogs(count: number = 10): GameLogEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Get entries related to card
   */
  getLogForCard(cardId: string): GameLogEntry[] {
    return this.entries.filter((e) => e.cardIds?.includes(cardId));
  }

  /**
   * Get log entries of specific action type
   */
  getLogForAction(actionType: ActionType): GameLogEntry[] {
    return this.entries.filter((e) => e.actionType === actionType);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.entries = [];
    this.nextId = 0;
  }

  /**
   * Export log as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /**
   * Export log as text (human readable)
   */
  exportAsText(): string {
    let text = '=== GUNDAM TCG GAME LOG ===\n\n';

    for (const entry of this.entries) {
      text += `[Turn ${entry.turnNumber} - ${entry.phase}] (${entry.activePlayer})\n`;
      text += `${entry.actionType}: ${entry.description}\n`;
      if (GAME_LOG_CONFIG.includeRulesTrace) {
        text += `Rules: ${entry.rulesTrace}\n`;
      }
      text += '\n';
    }

    return text;
  }

  /**
   * Get log summary stats
   */
  getStats(): {
    totalActions: number;
    turnsCompleted: number;
    actionsByType: Record<ActionType, number>;
    actionsByPlayer: Record<string, number>;
  } {
    const actionsByType: Record<string, number> = {};
    const actionsByPlayer: Record<string, number> = {};

    for (const entry of this.entries) {
      actionsByType[entry.actionType] = (actionsByType[entry.actionType] ?? 0) + 1;
      actionsByPlayer[entry.activePlayer] = (actionsByPlayer[entry.activePlayer] ?? 0) + 1;
    }

    const maxTurn = this.entries.length > 0 ? Math.max(...this.entries.map((e) => e.turnNumber)) : 0;

    return {
      totalActions: this.entries.length,
      turnsCompleted: maxTurn,
      actionsByType: actionsByType as Record<ActionType, number>,
      actionsByPlayer,
    };
  }

  /**
   * Get turn-by-turn summary
   */
  getTurnSummary(turnNumber: number): {
    turnNumber: number;
    player1Actions: number;
    player2Actions: number;
    description: string;
  } {
    const turnEntries = this.getLogForTurn(turnNumber);
    const player1Actions = turnEntries.filter((e) => e.activePlayer === 'player1').length;
    const player2Actions = turnEntries.filter((e) => e.activePlayer === 'player2').length;

    const firstAction = turnEntries[0];
    const lastAction = turnEntries[turnEntries.length - 1];

    const description =
      turnEntries.length > 0
        ? `${firstAction.activePlayer}'s turn: ${lastAction.description}`
        : 'No actions';

    return {
      turnNumber,
      player1Actions,
      player2Actions,
      description,
    };
  }

  /**
   * Format entry for display
   */
  static formatEntry(entry: GameLogEntry): string {
    return `[T${entry.turnNumber}] ${entry.description}`;
  }

  /**
   * Format entry with full details
   */
  static formatEntryDetailed(entry: GameLogEntry): string {
    let text = `\n[${'='.repeat(50)}]\n`;
    text += `Turn: ${entry.turnNumber}\n`;
    text += `Phase: ${entry.phase}\n`;
    text += `Player: ${entry.activePlayer}\n`;
    text += `Action: ${entry.actionType}\n`;
    text += `Description: ${entry.description}\n`;
    text += `Rules: ${entry.rulesTrace}\n`;

    if (entry.gameState) {
      text += `\nGame State:\n`;
      text += `  P1 Life: ${entry.gameState.player1Life}\n`;
      text += `  P2 Life: ${entry.gameState.player2Life}\n`;
      text += `  P1 Shields: ${entry.gameState.player1ShieldsCount}\n`;
      text += `  P2 Shields: ${entry.gameState.player2ShieldsCount}\n`;
    }

    return text;
  }
}

/**
 * Create a game logger instance with replay capability
 */
export function createGameLogger(): GameLogger {
  return new GameLogger();
}

/**
 * Analyze game log for rules violations
 */
export function analyzeLog(log: GameLogEntry[]): {
  violations: string[];
  warnings: string[];
} {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate draws per turn
  const drawsByTurn: Record<number, number> = {};
  for (const entry of log.filter((e) => e.actionType === 'DRAW')) {
    const key = `${entry.turnNumber}-${entry.activePlayer}`;
    drawsByTurn[key] = (drawsByTurn[key] ?? 0) + 1;
    if (drawsByTurn[key] > 1) {
      violations.push(`Turn ${entry.turnNumber}: Player drew ${drawsByTurn[key]} cards (max 1)`);
    }
  }

  // Check for phase order violations
  const validPhaseOrder = ['setup', 'draw', 'main', 'action', 'battle', 'end'];
  let lastPhaseIndex = -1;
  for (const entry of log) {
    const currentIndex = validPhaseOrder.indexOf(entry.phase);
    if (currentIndex !== -1 && lastPhaseIndex !== -1) {
      // Allow wrap-around (end -> setup)
      const isValidTransition =
        currentIndex === (lastPhaseIndex + 1) % validPhaseOrder.length ||
        currentIndex === lastPhaseIndex; // Same phase ok
      if (!isValidTransition && entry.phase !== 'setup') {
        warnings.push(`Potential phase order issue: ${entry.phase} after ${validPhaseOrder[lastPhaseIndex]}`);
      }
    }
    if (currentIndex !== -1) {
      lastPhaseIndex = currentIndex;
    }
  }

  return { violations, warnings };
}

/**
 * Export game log for sharing/archival
 */
export interface ExportedGameLog {
  gameId: string;
  timestamp: number;
  entries: GameLogEntry[];
  metadata: {
    totalActions: number;
    totalTurns: number;
    winner?: string;
  };
}

export function exportGameLog(
  gameId: string,
  logger: GameLogger,
  winner?: string,
): ExportedGameLog {
  const log = logger.getLog();
  const stats = logger.getStats();

  return {
    gameId,
    timestamp: Date.now(),
    entries: log,
    metadata: {
      totalActions: stats.totalActions,
      totalTurns: stats.turnsCompleted,
      winner,
    },
  };
}
