/**
 * Autoplayer AI
 * Simple but functional opponent AI that plays basic units and attacks
 *
 * Difficulty: BASIC
 * - Plays basic units when resources allow
 * - Attacks with all ready units, shields first
 * - No advanced strategy or combo plays
 * - Deterministic (uses game seed for reproducibility)
 */

import { AUTOPLAYER_CONFIG } from './rules-constants';
import type { CardInstance, PlayerState, GameState, GameAction } from './game-engine';

export interface AutoplayerDecision {
  actions: GameAction[];
  reasoning: string;
}

/**
 * Autoplayer brain - makes decisions based on game state
 */
export class Autoplayer {
  private playerId: string = 'player2';
  private gameState: GameState | null = null;

  /**
   * Initialize autoplayer
   */
  initialize(playerId: string = 'player2'): void {
    this.playerId = playerId;
  }

  /**
   * Get next actions for autoplayer
   */
  decideActions(gameState: GameState): AutoplayerDecision {
    this.gameState = gameState;
    const actions: GameAction[] = [];
    let reasoning = '';

    if (gameState.activePlayerId !== this.playerId) {
      reasoning = 'Not autoplayer turn';
      return { actions, reasoning };
    }

    const player = gameState.players[this.playerId];
    const phase = gameState.phase;

    // DRAW PHASE
    if (phase === 'draw' && !gameState.hasDrawnThisTurn) {
      actions.push({
        type: 'DRAW',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Draw Phase: Drew 1 card. ';
    }

    // MAIN PHASE
    if (phase === 'main') {
      reasoning += this.decideMainPhaseActions(player, actions);
    }

    // BATTLE PHASE
    if (phase === 'battle') {
      reasoning += this.decideBattlePhaseActions(player, actions);
    }

    // END PHASE
    if (phase === 'end') {
      reasoning += 'End Phase: Passing turn. ';
      actions.push({
        type: 'ADVANCE_PHASE',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
    }

    if (actions.length === 0) {
      reasoning += `Waiting in ${phase} phase.`;
    }

    return { actions, reasoning };
  }

  /**
   * Decide main phase actions
   * Priority: Play units -> Declare attacks
   */
  private decideMainPhaseActions(player: PlayerState, actions: GameAction[]): string {
    let reasoning = 'Main Phase: ';

    // Play units if possible and we have board space
    const unitsInPlay = player.battleArea.length;
    if (unitsInPlay < 3) {
      const playableUnit = this.findPlayableUnit(player);
      if (playableUnit && player.resources.length >= (playableUnit.cost || 1)) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: this.playerId,
          timestamp: Date.now(),
          payload: { cardInstanceId: playableUnit.instanceId },
        });
        reasoning += `Played unit (cost ${playableUnit.cost}). `;
      }
    }

    // Declare attacks
    if (player.battleArea.length > 0) {
      const readyUnits = player.battleArea.filter((u) => u.state === 'ready');
      if (readyUnits.length > 0) {
        for (const unit of readyUnits) {
          actions.push({
            type: 'DECLARE_ATTACK',
            playerId: this.playerId,
            timestamp: Date.now(),
            payload: { attackerInstanceId: unit.instanceId },
          });
        }
        reasoning += `Declared ${readyUnits.length} attacker${readyUnits.length !== 1 ? 's' : ''}. `;
      }
    }

    if (actions.length === 0) {
      reasoning += 'No actions available. ';
    }

    return reasoning;
  }

  /**
   * Decide battle phase actions
   * Strategies: Don't block (basic), just take damage
   */
  private decideBattlePhaseActions(player: PlayerState, actions: GameAction[]): string {
    let reasoning = 'Battle Phase: ';

    // Basic strategy: Don't block, just take the damage
    // (More advanced: evaluate blocking value)
    reasoning += 'Opponent is attacking. No blockers assigned. ';

    return reasoning;
  }

  /**
   * Find a playable unit in hand
   * Prefers lowest cost first
   */
  private findPlayableUnit(player: PlayerState): CardInstance | null {
    const units = player.hand.filter((c) => {
      const def = this.gameState?.cardDb?.[c.cardId];
      return def && def.type === 'Unit';
    });

    // Sort by cost (lowest first)
    units.sort((a, b) => {
      const costA = this.gameState?.cardDb?.[a.cardId]?.cost ?? 0;
      const costB = this.gameState?.cardDb?.[b.cardId]?.cost ?? 0;
      return costA - costB;
    });

    return units.length > 0 ? units[0] : null;
  }

  /**
   * Evaluate if unit should attack shields or base
   * Shields = 0 -> attack base
   * Shields > 0 -> attack shields
   */
  private getAttackTarget(
    opponent: PlayerState,
  ): 'shields' | 'base' {
    return opponent.shields.length > 0 ? 'shields' : 'base';
  }

  /**
   * Evaluate if attack is worthwhile
   * (Future: more complex evaluation)
   */
  private evaluateAttack(attacker: CardInstance, targetShields: number): number {
    const damage = attacker.damageMarkers; // Damage already dealt
    return damage;
  }
}

/**
 * Token deck for autoplayer
 * Simple, rules-light units for gameplay
 */
export const AUTOPLAYER_TOKEN_DECK = {
  name: 'Autoplayer Token Deck',
  cards: [
    // Basic units - low cost, low power
    {
      id: 'TOKEN-UNIT-001',
      name: 'Colorless Token Unit 1',
      type: 'Unit' as const,
      cost: 1,
      atk: 2,
      def: 1,
      keywords: [],
      text: 'Basic token unit',
    },
    {
      id: 'TOKEN-UNIT-002',
      name: 'Colorless Token Unit 2',
      type: 'Unit' as const,
      cost: 2,
      atk: 3,
      def: 2,
      keywords: [],
      text: 'Basic token unit',
    },
    {
      id: 'TOKEN-UNIT-003',
      name: 'Colorless Token Unit 3',
      type: 'Unit' as const,
      cost: 3,
      atk: 4,
      def: 3,
      keywords: [],
      text: 'Basic token unit',
    },
    // Resources
    {
      id: 'TOKEN-RESOURCE-001',
      name: 'Colorless Token Resource',
      type: 'Resource' as const,
      cost: 0,
      keywords: [],
      text: 'Generic resource',
    },
  ],
};

/**
 * Create autoplayer action queue for testing
 */
export function createAutplayerTurnSequence(
  gameState: GameState,
): GameAction[] {
  const autoplayer = new Autoplayer();
  autoplayer.initialize('player2');

  const decision = autoplayer.decideActions(gameState);
  return decision.actions;
}
