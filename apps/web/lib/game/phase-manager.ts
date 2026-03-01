/**
 * Phase Management System
 * Enforces official turn structure and action gating
 *
 * OFFICIAL PHASE ORDER:
 * 1. Setup Phase - untap units, refresh resources, refresh once-per-turn
 * 2. Draw Phase - draw 1 card
 * 3. Main Phase - play cards, activate abilities, declare attacks
 * 4. (Optional) Action Phase - action window
 * 5. (Optional) Battle Phase - declare blockers, resolve combat
 * 6. End Phase - discard down to 7, resolve end-of-turn effects
 */

import { PHASE_RULES, PHASE_SEQUENCE } from './rules-constants';
import type { Phase } from './game-engine';
import type { ActionType } from './game-engine';

/**
 * Phase manager tracks current phase and validates actions
 */
export class PhaseManager {
  private currentPhase: Phase = 'setup';
  private turnNumber: number = 1;
  private activePlayerId: string = 'player1';
  private drawedThisTurn: boolean = false;
  private mainPhaseActionCount: number = 0;

  /**
   * Initialize for start of game
   */
  initialize(activePlayerId: string = 'player1', turnNumber: number = 1): void {
    this.currentPhase = 'setup';
    this.turnNumber = turnNumber;
    this.activePlayerId = activePlayerId;
    this.drawedThisTurn = false;
    this.mainPhaseActionCount = 0;
  }

  /**
   * Get current phase
   */
  getPhase(): Phase {
    return this.currentPhase;
  }

  /**
   * Get turn number
   */
  getTurnNumber(): number {
    return this.turnNumber;
  }

  /**
   * Get active player ID
   */
  getActivePlayer(): string {
    return this.activePlayerId;
  }

  /**
   * Check if action is allowed in current phase
   */
  canExecuteAction(action: ActionType): {
    allowed: boolean;
    reason?: string;
  } {
    // Get allowed actions for current phase from constants
    const phaseConfig = PHASE_RULES[this.currentPhase];
    if (!phaseConfig) {
      return { allowed: false, reason: `Unknown phase: ${this.currentPhase}` };
    }

    const allowedActions = (phaseConfig.allowedActions as readonly ActionType[]) ?? [];

    if (!allowedActions.includes(action)) {
      return {
        allowed: false,
        reason: `${action} not allowed in ${this.currentPhase} phase`,
      };
    }

    // Phase-specific validation
    switch (action) {
      case 'DRAW':
        if (this.drawedThisTurn) {
          return { allowed: false, reason: 'Already drawn this turn' };
        }
        if (this.currentPhase !== 'draw') {
          return { allowed: false, reason: 'Can only draw in Draw Phase' };
        }
        break;

      case 'ADVANCE_PHASE':
        // Validate preconditions for advancing
        if (this.currentPhase === 'draw' && !this.drawedThisTurn) {
          return { allowed: false, reason: 'Must draw before advancing from Draw Phase' };
        }
        break;

      case 'PLAY_CARD':
        if (this.currentPhase !== 'main') {
          return { allowed: false, reason: 'Can only play cards in Main Phase' };
        }
        break;

      case 'DECLARE_ATTACK':
        if (this.currentPhase !== 'main') {
          return { allowed: false, reason: 'Must declare attacks from Main Phase' };
        }
        break;

      case 'DECLARE_BLOCK':
        if (this.currentPhase !== 'battle') {
          return { allowed: false, reason: 'Can only declare blocks in Battle Phase' };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Advance to next phase in sequence
   */
  advancePhase(): { phase: Phase; log: string } {
    const previousPhase = this.currentPhase;

    // Get next phase in sequence
    const currentIndex = PHASE_SEQUENCE.indexOf(this.currentPhase as any);
    let nextIndex = (currentIndex + 1) % PHASE_SEQUENCE.length;
    const nextPhase = PHASE_SEQUENCE[nextIndex];

    // Handle turn transition
    if (nextPhase === 'setup') {
      this.turnNumber++;
      this.switchActivePlayer();
      this.drawedThisTurn = false;
      this.mainPhaseActionCount = 0;
    }

    // Reset per-phase flags
    if (nextPhase === 'draw') {
      this.drawedThisTurn = false;
    }
    if (nextPhase === 'main') {
      this.mainPhaseActionCount = 0;
    }

    this.currentPhase = nextPhase;

    const log = `Turn ${this.turnNumber} — ${getPhaseName(this.currentPhase)} start`;
    return { phase: this.currentPhase, log };
  }

  /**
   * Switch to next player
   */
  private switchActivePlayer(): void {
    this.activePlayerId = this.activePlayerId === 'player1' ? 'player2' : 'player1';
  }

  /**
   * Mark card drawn this turn
   */
  markDrawn(): void {
    this.drawedThisTurn = true;
  }

  /**
   * Increment main phase action counter
   */
  incrementMainPhaseActions(): void {
    this.mainPhaseActionCount++;
  }

  /**
   * Get formatted phase display
   */
  getPhaseDisplay(): string {
    return `Turn ${this.turnNumber} — ${getPhaseName(this.currentPhase)} (${this.activePlayerId}'s turn)`;
  }

  /**
   * Get all phase progress
   */
  getPhaseProgress(): { current: Phase; order: Phase[] } {
    return {
      current: this.currentPhase,
      order: [...PHASE_SEQUENCE] as Phase[],
    };
  }

  /**
   * Reset for new turn (called at Setup Phase)
   */
  resetForNewTurn(): void {
    this.drawedThisTurn = false;
    this.mainPhaseActionCount = 0;
  }

  /**
   * Check if in combat-related phase
   */
  isInCombatPhase(): boolean {
    return this.currentPhase === 'battle' || this.currentPhase === 'main';
  }

  /**
   * Check if in main action phase
   */
  isInMainActionPhase(): boolean {
    return this.currentPhase === 'main' || this.currentPhase === 'action';
  }
}

/**
 * Get human-readable phase name
 */
export function getPhaseName(phase: Phase): string {
  const names: Record<Phase, string> = {
    setup: 'Setup Phase',
    draw: 'Draw Phase',
    main: 'Main Phase',
    action: 'Action Window',
    battle: 'Battle Phase',
    end: 'End Phase',
    gameOver: 'Game Over',
  };

  return names[phase] || phase;
}

/**
 * Export phase sequence for UI
 */
export function getPhaseSequence(): Phase[] {
  return [...PHASE_SEQUENCE] as Phase[];
}

/**
 * Get next X phases starting from current
 */
export function getUpcomingPhases(
  currentPhase: Phase,
  count: number = 3,
): Phase[] {
  const index = PHASE_SEQUENCE.indexOf(currentPhase as any);
  if (index === -1) return [];

  const upcoming: Phase[] = [];
  for (let i = 1; i <= count; i++) {
    const nextIndex = (index + i) % PHASE_SEQUENCE.length;
    upcoming.push(PHASE_SEQUENCE[nextIndex]);
  }

  return upcoming;
}

/**
 * Check if phase transition is legal
 */
export function isValidPhaseTransition(
  from: Phase,
  to: Phase,
): boolean {
  const allPhases = PHASE_SEQUENCE;
  const fromIndex = allPhases.indexOf(from as any);
  const toIndex = allPhases.indexOf(to as any);

  if (fromIndex === -1 || toIndex === -1) return false;

  // Can advance to next phase
  if ((fromIndex + 1) % allPhases.length === toIndex) return true;

  // Can wrap around at end of turn
  if (from === 'end' && to === 'setup') return true;

  return false;
}

/**
 * Get actions available in specific phase
 */
export function getAvailableActions(phase: Phase): ActionType[] {
  const config = PHASE_RULES[phase];
  if (!config) return [];
  return [...(config.allowedActions as readonly ActionType[])] as ActionType[];
}
