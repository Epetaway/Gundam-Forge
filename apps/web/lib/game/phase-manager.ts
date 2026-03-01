/**
 * Phase Management System
 * Enforces official Gundam TCG turn structure and action gating.
 *
 * OFFICIAL PHASE ORDER (Comprehensive Rules Ver. 1.5.0):
 * 1. Start Phase   — Ready all rested cards. "Start of turn" effects fire.
 * 2. Draw Phase    — Draw 1 card from main deck. Empty deck = loss.
 * 3. Resource Phase — Take top of Resource Deck → Resource Area (active). Skip if empty.
 * 4. Main Phase    — Play cards, activate abilities, declare attacks (any order, any times).
 * 5. End Phase     — Discard to 10. End-of-turn effects. Pass turn.
 *
 * NOTE: 'action' and 'battle' are card timing keywords, NOT separate phases.
 * Combat (DECLARE_ATTACK, DECLARE_BLOCK, RESOLVE_COMBAT) happens during Main Phase.
 */

import { PHASE_RULES, PHASE_SEQUENCE } from './rules-constants';
import type { Phase } from './game-engine';
import type { ActionType } from './game-engine';

/**
 * Phase manager tracks current phase and validates actions
 */
export class PhaseManager {
  private currentPhase: Phase = 'start';
  private turnNumber: number = 1;
  private activePlayerId: string = 'player1';
  private drawedThisTurn: boolean = false;
  private resourcePlacedThisTurn: boolean = false;
  private mainPhaseActionCount: number = 0;

  /**
   * Initialize for start of game
   */
  initialize(activePlayerId: string = 'player1', turnNumber: number = 1): void {
    this.currentPhase = 'start';
    this.turnNumber = turnNumber;
    this.activePlayerId = activePlayerId;
    this.drawedThisTurn = false;
    this.resourcePlacedThisTurn = false;
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
    const phaseConfig = PHASE_RULES[this.currentPhase as keyof typeof PHASE_RULES];
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

      case 'PLACE_RESOURCE':
        if (this.resourcePlacedThisTurn) {
          return { allowed: false, reason: 'Resource already placed this turn' };
        }
        if (this.currentPhase !== 'resource') {
          return { allowed: false, reason: 'Can only place resource in Resource Phase' };
        }
        break;

      case 'ADVANCE_PHASE':
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
          return { allowed: false, reason: 'Must declare attacks during Main Phase' };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Advance to next phase in sequence.
   * end → start triggers a turn switch to the other player.
   */
  advancePhase(): { phase: Phase; log: string } {
    const phaseSequence = [...PHASE_SEQUENCE] as Phase[];
    const currentIndex = phaseSequence.indexOf(this.currentPhase as any);
    const isLastPhase = currentIndex === phaseSequence.length - 1;
    const nextPhase: Phase = isLastPhase ? 'start' : phaseSequence[currentIndex + 1];

    // Turn transition happens when end phase completes
    if (isLastPhase) {
      this.turnNumber++;
      this.switchActivePlayer();
    }

    // Reset per-phase flags
    if (nextPhase === 'draw') {
      this.drawedThisTurn = false;
    }
    if (nextPhase === 'resource') {
      this.resourcePlacedThisTurn = false;
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
   * Mark resource placed this turn (Resource Phase)
   */
  markResourcePlaced(playerId: string): void {
    this.resourcePlacedThisTurn = true;
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
   * Reset for new turn (called at Start Phase)
   */
  resetForNewTurn(): void {
    this.drawedThisTurn = false;
    this.resourcePlacedThisTurn = false;
    this.mainPhaseActionCount = 0;
  }

  /**
   * Check if currently in a phase where combat is legal.
   * Official GCG: combat happens during Main Phase only.
   */
  isInCombatPhase(): boolean {
    return this.currentPhase === 'main';
  }

  /**
   * Check if currently in a phase where card play and abilities are legal.
   */
  isInMainActionPhase(): boolean {
    return this.currentPhase === 'main';
  }
}

/**
 * Get human-readable phase name
 */
export function getPhaseName(phase: Phase): string {
  const names: Record<Phase, string> = {
    start: 'Start Phase',
    draw: 'Draw Phase',
    resource: 'Resource Phase',
    main: 'Main Phase',
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
  const sequence = [...PHASE_SEQUENCE] as Phase[];
  const index = sequence.indexOf(currentPhase as any);
  if (index === -1) return [];

  const upcoming: Phase[] = [];
  for (let i = 1; i <= count; i++) {
    const nextIndex = (index + i) % sequence.length;
    upcoming.push(sequence[nextIndex]);
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
  const allPhases = [...PHASE_SEQUENCE] as Phase[];
  const fromIndex = allPhases.indexOf(from as any);
  const toIndex = allPhases.indexOf(to as any);

  if (fromIndex === -1 || toIndex === -1) return false;

  // Can advance to next phase in sequence
  if ((fromIndex + 1) % allPhases.length === toIndex) return true;

  // Can wrap around: end → start (turn transition)
  if (from === 'end' && to === 'start') return true;

  return false;
}

/**
 * Get actions available in specific phase
 */
export function getAvailableActions(phase: Phase): ActionType[] {
  const config = PHASE_RULES[phase as keyof typeof PHASE_RULES];
  if (!config) return [];
  return [...(config.allowedActions as readonly ActionType[])] as ActionType[];
}
