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
import type { CardInstance, PlayerState, GameState, GameAction, CardDefinition } from './game-engine';

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
  private cardDatabase: Record<string, CardDefinition> = {};

  /**
   * Initialize autoplayer
   */
  initialize(playerId: string = 'player2', cardDatabase?: Record<string, CardDefinition>): void {
    this.playerId = playerId;
    if (cardDatabase) {
      this.cardDatabase = cardDatabase;
    }
  }

  /**
   * Get next actions for autoplayer
   */
  decideActions(gameState: GameState, cardDatabase?: Record<string, CardDefinition>): AutoplayerDecision {
    if (cardDatabase) {
      this.cardDatabase = cardDatabase;
    }
    this.gameState = gameState;
    const actions: GameAction[] = [];
    let reasoning = '';

    if (gameState.activePlayerId !== this.playerId) {
      reasoning = 'Not autoplayer turn';
      return { actions, reasoning };
    }

    const player = gameState.players[this.playerId];
    const phase = gameState.phase;

    // START PHASE — advance immediately (readying cards is handled by engine)
    if (phase === 'start') {
      actions.push({
        type: 'ADVANCE_PHASE',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Start Phase: Advanced. ';
    }

    // DRAW PHASE
    if (phase === 'draw' && !gameState.hasDrawnThisTurn) {
      actions.push({
        type: 'DRAW',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Draw Phase: Drew 1 card. ';
    }

    // RESOURCE PHASE — place resource if available, then advance
    if (phase === 'resource') {
      actions.push({
        type: 'PLACE_RESOURCE',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Resource Phase: Placed resource. ';
    }

    // MAIN PHASE
    if (phase === 'main') {
      reasoning += this.decideMainPhaseActions(player, actions);
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
   * Priority: Play token units (escalating cost) -> Declare attacks
   *
   * Token cost escalation: 1st token = 0 cost, 2nd = 1 cost, 3rd = 2 cost, etc.
   * Simulates the cost internally so all playable tokens are queued in one decision pass.
   */
  private decideMainPhaseActions(player: PlayerState, actions: GameAction[]): string {
    let reasoning = 'Main Phase: ';

    // Track which cards are already queued to avoid double-queueing
    const queuedInstanceIds = new Set(
      actions
        .filter((a) => a.type === 'PLAY_CARD')
        .map((a) => a.payload?.cardInstanceId as string),
    );

    // Simulate escalating token cost from the current engine state
    let simTokensPlayed = player.tokensPlayedThisTurn ?? 0;
    let availableResources = player.resources.filter((r) => r.state === 'ready').length;

    // Greedily queue tokens while board space and resources allow
    while (player.battleArea.length + queuedInstanceIds.size < 6) {
      const effectiveCost = simTokensPlayed; // 0-indexed: 1st free, 2nd costs 1, etc.

      if (effectiveCost > availableResources) break;

      const candidate = this.findPlayableTokenUnit(player, queuedInstanceIds);
      if (!candidate) break;

      actions.push({
        type: 'PLAY_CARD',
        playerId: this.playerId,
        timestamp: Date.now(),
        payload: { cardInstanceId: candidate.instanceId },
      });

      queuedInstanceIds.add(candidate.instanceId);
      availableResources -= effectiveCost;
      simTokensPlayed++;
      reasoning += `Queued token (cost ${effectiveCost}). `;
    }

    // Declare attacks with all ready units
    const readyUnits = player.battleArea.filter((u) => u.state === 'ready');
    for (const unit of readyUnits) {
      actions.push({
        type: 'DECLARE_ATTACK',
        playerId: this.playerId,
        timestamp: Date.now(),
        payload: { attackerInstanceId: unit.instanceId },
      });
    }
    if (readyUnits.length > 0) {
      reasoning += `Declared ${readyUnits.length} attacker${readyUnits.length !== 1 ? 's' : ''}. `;
    }

    if (actions.length === 0) {
      reasoning += 'No actions available. ';
    }

    return reasoning;
  }

  /**
   * Find a Token Unit in hand that hasn't been queued yet.
   * Token units are identified by having 'Token' in their traits.
   */
  private findPlayableTokenUnit(
    player: PlayerState,
    excludeIds: Set<string>,
  ): CardInstance | null {
    return (
      player.hand.find((c) => {
        if (excludeIds.has(c.instanceId)) return false;
        const def = this.cardDatabase[c.cardId];
        return def && def.type === 'Unit' && (def.traits ?? []).includes('Token');
      }) ?? null
    );
  }

  /**
   * Find a playable unit in hand (fallback for non-token units)
   * Prefers lowest cost first
   */
  private findPlayableUnit(player: PlayerState): CardInstance | null {
    const units = player.hand.filter((c) => {
      const def = this.cardDatabase[c.cardId];
      return def && def.type === 'Unit';
    });

    units.sort((a, b) => {
      const costA = this.cardDatabase[a.cardId]?.cost ?? 0;
      const costB = this.cardDatabase[b.cardId]?.cost ?? 0;
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
   * Evaluate if attack is worthwhile by attacker's AP
   */
  private evaluateAttack(attacker: CardInstance, targetShields: number): number {
    const cardDef = this.cardDatabase[attacker.cardId];
    return cardDef?.ap ?? 0;
  }
}

/**
 * Token deck for autoplayer
 * Simple, rules-light units for gameplay
 */
export const AUTOPLAYER_TOKEN_DECK = {
  name: 'Autoplayer Token Deck',
  cards: [
    // Token units — base cost 0; escalating cost is computed live by the engine
    {
      id: 'TOKEN-UNIT-001',
      name: 'Colorless Token Unit 1',
      type: 'Unit' as const,
      cost: 0,
      ap: 2,
      hp: 1,
      keywords: [],
      text: 'Basic token unit',
    },
    {
      id: 'TOKEN-UNIT-002',
      name: 'Colorless Token Unit 2',
      type: 'Unit' as const,
      cost: 0,
      ap: 3,
      hp: 2,
      keywords: [],
      text: 'Basic token unit',
    },
    {
      id: 'TOKEN-UNIT-003',
      name: 'Colorless Token Unit 3',
      type: 'Unit' as const,
      cost: 0,
      ap: 4,
      hp: 3,
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
