/**
 * Advanced Autoplayer AI
 * Smarter opponent with strategic decision making
 *
 * Difficulty: INTERMEDIATE+
 * - Evaluates board state (unit count, total power)
 * - Prioritizes threats (targets strong opponent units)
 * - Calculates possible lethal damage
 * - Makes strategic plays (not just random)
 * - Manages resources efficiently
 * - Adaptive based on game situation
 */

import type { CardInstance, PlayerState, GameState, GameAction, CardDefinition } from './game-engine';

export interface BoardEvaluation {
  unitCount: number;
  totalAttack: number;
  totalDefense: number;
  threatLevel: 'low' | 'medium' | 'high';
  hasHighManeuverUnits: boolean;
  averagePower: number;
}

export interface StrategyDecision {
  actions: GameAction[];
  reasoning: string;
  strategy: string;
}

/**
 * Advanced Autoplayer with strategic AI
 */
export class AdvancedAutoplayer {
  private playerId: string = 'player2';
  private cardDatabase: Record<string, CardDefinition> = {};

  constructor(playerId: string = 'player2', cardDatabase?: Record<string, CardDefinition>) {
    this.playerId = playerId;
    if (cardDatabase) {
      this.cardDatabase = cardDatabase;
    }
  }

  /**
   * Evaluate current board state
   */
  evaluateBoard(playerState: PlayerState, opponentState: PlayerState): {
    myBoard: BoardEvaluation;
    opponentBoard: BoardEvaluation;
  } {
    const evaluateState = (player: PlayerState): BoardEvaluation => {
      const units = player.battleArea;
      const totalAttack = units.reduce((sum, u) => {
        const def = this.cardDatabase[u.cardId] as any;
        return sum + (def?.ap ?? def?.atk ?? 0);
      }, 0);
      const unitCount = units.length;

      // Calculate average power per unit
      const averagePower = unitCount > 0 ? totalAttack / unitCount : 0;

      // Determine threat level
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      if (totalAttack >= 15) threatLevel = 'high';
      else if (totalAttack >= 8) threatLevel = 'medium';

      // Check for high-maneuver units
      const hasHighManeuverUnits = units.some((u) =>
        (u.state === 'ready' && totalAttack > 0),
      );

      return {
        unitCount,
        totalAttack,
        totalDefense: units.filter((u) => u.state === 'ready').length,
        threatLevel,
        hasHighManeuverUnits,
        averagePower,
      };
    };

    return {
      myBoard: evaluateState(playerState),
      opponentBoard: evaluateState(opponentState),
    };
  }

  /**
   * Calculate if lethal is possible this turn
   */
  canAchieveLethal(
    myUnits: CardInstance[],
    opponentShields: number,
    opponentHealth: number,
  ): boolean {
    const readyUnits = myUnits.filter((u) => u.state === 'ready');
    const totalDamage = readyUnits.length * 3; // Average 3 damage per unit

    // Lethal = can destroy all shields + deal remainder to base
    const damageToBase = Math.max(0, totalDamage - opponentShields);
    return damageToBase >= opponentHealth;
  }

  /**
   * Prioritize opponent units to attack
   * Returns units sorted by threat priority
   */
  prioritizeTargets(opponentUnits: CardInstance[]): CardInstance[] {
    return opponentUnits.sort((a, b) => {
      // Attack high-damage units first
      const damageA = a.damageMarkers || 0;
      const damageB = b.damageMarkers || 0;
      return damageB - damageA;
    });
  }

  /**
   * Decide card to play based on game situation
   */
  selectCardToPlay(
    player: PlayerState,
    gameState: GameState,
    availableResources: number,
  ): CardInstance | null {
    const hand = player.hand.filter((c) => {
      const def = this.cardDatabase[c.cardId];
      return def && def.type === 'Unit';
    });

    if (hand.length === 0) return null;

    // Strategy: Play mid-cost units that balance board presence with resources
    // Prefer to play units that don't exceed current resources
    const playableCards = hand.filter((c) => {
      const cost = this.cardDatabase[c.cardId]?.cost ?? 0;
      return cost <= availableResources && cost > 0;
    });

    if (playableCards.length === 0) return null;

    // Sort by attack value (descending) - prefer stronger units
    playableCards.sort((a, b) => {
      const atkA = this.cardDatabase[a.cardId]?.atk ?? 0;
      const atkB = this.cardDatabase[b.cardId]?.atk ?? 0;
      return atkB - atkA;
    });

    return playableCards[0];
  }

  /**
   * Get strategic decision for current turn
   */
  decideActions(gameState: GameState, cardDatabase?: Record<string, CardDefinition>): StrategyDecision {
    if (cardDatabase) {
      this.cardDatabase = cardDatabase;
    }
    const player = gameState.players[this.playerId];
    const opponent = gameState.players['player1'];
    const actions: GameAction[] = [];
    let reasoning = '';
    let strategy = '';

    if (gameState.activePlayerId !== this.playerId) {
      strategy = 'NOT_TURN';
      return { actions, reasoning: 'Not autoplayer turn', strategy };
    }

    const phase = gameState.phase;
    const evaluation = this.evaluateBoard(player, opponent);

    // Determine overall strategy based on board evaluation
    if (evaluation.myBoard.threatLevel === 'high' && evaluation.opponentBoard.threatLevel === 'low') {
      strategy = 'AGGRESSIVE';
      reasoning = 'Board advantage: Playing aggressively. ';
    } else if (evaluation.opponentBoard.threatLevel === 'high') {
      strategy = 'DEFENSIVE';
      reasoning = 'Opponent threat detected: Playing defensively. ';
    } else {
      strategy = 'BALANCED';
      reasoning = 'Balanced game state: Playing strategically. ';
    }

    // DRAW PHASE
    if (phase === 'draw' && !gameState.hasDrawnThisTurn) {
      actions.push({
        type: 'DRAW',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Drew card. ';
    }

    // MAIN PHASE
    if (phase === 'main') {
      reasoning += this.decideMainPhase(player, opponent, gameState, strategy, actions);
    }

    // BATTLE PHASE
    if (phase === 'battle') {
      reasoning += this.decideBattlePhase(player, opponent, actions, strategy);
    }

    // ADVANCE TO NEXT PHASE
    if (
      (phase === 'main' || phase === 'battle' || phase === 'end') &&
      actions.length > 0
    ) {
      actions.push({
        type: 'ADVANCE_PHASE',
        playerId: this.playerId,
        timestamp: Date.now(),
      });
      reasoning += 'Advancing phase. ';
    }

    return { actions, reasoning, strategy };
  }

  /**
   * Decide main phase actions
   */
  private decideMainPhase(
    player: PlayerState,
    opponent: PlayerState,
    gameState: GameState,
    strategy: string,
    actions: GameAction[],
  ): string {
    let reasoning = 'Main Phase: ';

    // Check board space
    const boardSpace = 3 - player.battleArea.length;
    const availableResources = player.resources.length;

    // Decide how many cards to play based on strategy
    let cardsToPlay = 1;
    if (strategy === 'AGGRESSIVE' && boardSpace > 0) {
      cardsToPlay = Math.min(2, boardSpace);
    }

    // Play cards
    for (let i = 0; i < cardsToPlay && boardSpace > i && availableResources > 0; i++) {
      const cardToPlay = this.selectCardToPlay(player, gameState, availableResources);
      if (cardToPlay) {
        actions.push({
          type: 'PLAY_CARD',
          playerId: this.playerId,
          timestamp: Date.now(),
          payload: { cardInstanceId: cardToPlay.instanceId },
        });
        reasoning += `Played unit (strategic). `;
      }
    }

    // Consider declaring attacks in Main Phase (some rules allow this)
    // For now, defer to Battle Phase

    return reasoning;
  }

  /**
   * Decide battle phase actions
   */
  private decideBattlePhase(
    player: PlayerState,
    opponent: PlayerState,
    actions: GameAction[],
    strategy: string,
  ): string {
    let reasoning = 'Battle Phase: ';

    const readyUnits = player.battleArea.filter((u) => u.state === 'ready');

    if (readyUnits.length === 0) {
      reasoning += 'No ready units. ';
      return reasoning;
    }

    // Check for lethal
    const isLethal = this.canAchieveLethal(
      readyUnits,
      opponent.shields.length,
      opponent.baseHealth,
    );

    if (isLethal) {
      reasoning += 'Lethal condition detected: Attacking for lethal';
      // Attack with all units
      for (const unit of readyUnits) {
        actions.push({
          type: 'DECLARE_ATTACK',
          playerId: player.playerId,
          timestamp: Date.now(),
          payload: { attackerInstanceId: unit.instanceId },
        });
      }
    } else if (strategy === 'AGGRESSIVE') {
      reasoning += 'Aggressive strategy: Attacking with all units. ';
      // Attack indiscriminately
      for (const unit of readyUnits) {
        actions.push({
          type: 'DECLARE_ATTACK',
          playerId: player.playerId,
          timestamp: Date.now(),
          payload: { attackerInstanceId: unit.instanceId },
        });
      }
    } else {
      reasoning += 'Selective attacks based on board state. ';
      // Attack up to 50% of units (balanced approach)
      const attackCount = Math.ceil(readyUnits.length / 2);
      for (let i = 0; i < attackCount; i++) {
        actions.push({
          type: 'DECLARE_ATTACK',
          playerId: player.playerId,
          timestamp: Date.now(),
          payload: { attackerInstanceId: readyUnits[i].instanceId },
        });
      }
    }

    return reasoning;
  }
}

/**
 * Create advanced autoplayer turn decision
 */
export function createAdvancedAutplayerDecision(gameState: GameState): StrategyDecision {
  const autoplayer = new AdvancedAutoplayer('player2');
  return autoplayer.decideActions(gameState);
}
