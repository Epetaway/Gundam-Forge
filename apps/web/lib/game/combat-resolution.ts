/**
 * Combat Resolution System
 * Implements official Gundam TCG combat rules with damage calculation
 *
 * Combat Sequence:
 * 1. Declare attackers and pay cost
 * 2. Defender declares blockers
 * 3. Resolve combat (damage calculation)
 * 4. Apply damage to units
 * 5. Check for destroyed units
 * 6. Trigger DESTROYED effects
 */

import type { CardInstance, PlayerState, GameState } from './game-engine';
import { TriggerQueueManager, createDestroyedTrigger } from './trigger-queue';

/**
 * Combat information
 */
export interface Combat {
  id: string;
  attackerId: string;
  attackerCardId: string;
  defenderId: string | null; // null = unblocked (goes to life/shields)
  defenderCardId: string | null;
  attackerDamage: number;
  defenderDamage: number;
  hasFirstStrike: boolean;
  hasHighManeuver: boolean;
  isResolved: boolean;
  timestamp: number;
}

/**
 * Combat result after resolution
 */
export interface CombatResult {
  combat: Combat;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  netDamageToDefender: number;
  netDamageToAttacker: number;
  description: string;
}

/**
 * Combat Resolver
 */
export class CombatResolver {
  private triggerQueue: TriggerQueueManager;

  constructor(triggerQueue: TriggerQueueManager) {
    this.triggerQueue = triggerQueue;
  }

  /**
   * Create new combat (attacker vs defender)
   */
  createCombat(
    attackerId: string,
    attackerCardId: string,
    defenderId: string | null,
    defenderCardId: string | null,
  ): Combat {
    return {
      id: `combat-${Date.now()}-${Math.random()}`,
      attackerId,
      attackerCardId,
      defenderId,
      defenderCardId,
      attackerDamage: 0,
      defenderDamage: 0,
      hasFirstStrike: false,
      hasHighManeuver: false,
      isResolved: false,
      timestamp: Date.now(),
    };
  }

  /**
   * Resolve combat between two units
   * Returns damage dealt and units destroyed
   */
  resolveCombat(
    combat: Combat,
    attacker: CardInstance,
    defender: CardInstance | null,
    gameState: GameState,
    cardDatabase: Record<string, any>,
  ): CombatResult {
    const attackerDef = cardDatabase[combat.attackerCardId];
    const defenderDef = defender && combat.defenderCardId ? cardDatabase[combat.defenderCardId] : null;

    // Get base power values
    const attackerAttack = attackerDef?.ap ?? 0;
    const defenderAttack = defenderDef?.ap ?? 0;
    const defenderHealth = defenderDef?.hp ?? 0;

    // Apply damage modifiers
    let totalAttackerDamage = attackerAttack;
    let totalDefenderDamage = defenderAttack;

    // First Strike: Attacker deals damage first
    const hasFirstStrike = attackerDef?.keywords?.includes('First Strike') ?? false;

    // High-Maneuver: Cannot be blocked
    const hasHighManeuver = attackerDef?.keywords?.includes('High-Maneuver') ?? false;

    // Check if defender can block
    const canBlock =
      defender &&
      defender.state === 'ready' &&
      !hasHighManeuver &&
      defenderDef?.keywords?.includes('Blocker');

    let result: CombatResult;

    if (!defender || !canBlock) {
      // Unblocked attack - damage goes to life/shields
      result = {
        combat: { ...combat, attackerDamage: 0, defenderDamage: 0, isResolved: true },
        attackerDestroyed: false,
        defenderDestroyed: false,
        netDamageToDefender: 0,
        netDamageToAttacker: 0,
        description: `${attacker.cardId} attacks unblocked for ${totalAttackerDamage} damage.`,
      };
    } else if (hasFirstStrike) {
      // First Strike: Attacker damage first, defender only if survives
      attacker.damageMarkers += totalAttackerDamage;
      const attackerSurvives = attacker.damageMarkers < (attackerDef?.hp ?? 1);

      if (attackerSurvives) {
        defender.damageMarkers += totalDefenderDamage;
      }

      const attackerDestroyed = attacker.damageMarkers >= (attackerDef?.hp ?? 1);
      const defenderDestroyed = defender.damageMarkers >= (defenderDef?.hp ?? 1);

      result = {
        combat: {
          ...combat,
          attackerDamage: totalAttackerDamage,
          defenderDamage: totalDefenderDamage,
          isResolved: true,
          hasFirstStrike: true,
        },
        attackerDestroyed,
        defenderDestroyed,
        netDamageToDefender: totalDefenderDamage,
        netDamageToAttacker: totalAttackerDamage,
        description: `First Strike: ${attacker.cardId} deals ${totalAttackerDamage} to ${defender.cardId}. ${
          attackerSurvives ? `${defender.cardId} deals ${totalDefenderDamage} back.` : 'Blocker destroyed.'
        }`,
      };
    } else {
      // Normal combat: Both deal damage simultaneously
      const attackerWould = totalAttackerDamage;
      const defenderWould = totalDefenderDamage;

      attacker.damageMarkers += defenderWould;
      defender.damageMarkers += attackerWould;

      const attackerDestroyed = attacker.damageMarkers >= (attackerDef?.hp ?? 1);
      const defenderDestroyed = defender.damageMarkers >= (defenderDef?.hp ?? 1);

      result = {
        combat: {
          ...combat,
          attackerDamage: attackerWould,
          defenderDamage: defenderWould,
          isResolved: true,
        },
        attackerDestroyed,
        defenderDestroyed,
        netDamageToDefender: attackerWould,
        netDamageToAttacker: defenderWould,
        description: `${attacker.cardId} (${attackerAttack} ATK) vs ${defender.cardId} (${defenderAttack} ATK). ${
          attackerDestroyed && defenderDestroyed
            ? 'Both destroyed.'
            : attackerDestroyed
              ? `${attacker.cardId} destroyed.`
              : defenderDestroyed
                ? `${defender.cardId} destroyed.`
                : `Both survive.`
        }`,
      };
    }

    if (result.defenderDestroyed && defender) {
      this.destroyUnit(defender, gameState);

      // Add DESTROYED trigger for defender
      const defendingPlayerId =
        Object.entries(gameState.players).find(([_, p]) =>
          p.battleArea.some((u) => u.instanceId === defender.instanceId),
        )?.[0] || gameState.activePlayerId;

      const destroyedTrigger = createDestroyedTrigger(
        defender,
        defendingPlayerId,
        `${defender.cardId} destroyed in combat`,
        () => {
          // Trigger callback would go here
        },
      );
      this.triggerQueue.addTrigger(
        destroyedTrigger.type,
        destroyedTrigger.sourceInstanceId,
        destroyedTrigger.sourceCardId,
        destroyedTrigger.ownerPlayerId,
        destroyedTrigger.condition,
        destroyedTrigger.resolve,
        destroyedTrigger.description,
      );
    }

    return result;
  }

  /**
   * Move unit to trash and update zone
   */
  private destroyUnit(unit: CardInstance, gameState: GameState): void {
    // Remove from current zone
    const player = Object.values(gameState.players).find((p) =>
      p.battleArea.some((u) => u.instanceId === unit.instanceId),
    );

    if (player) {
      player.battleArea = player.battleArea.filter((u) => u.instanceId !== unit.instanceId);
      
      // Ensure discardPile exists (for testing scenarios)
      if (!player.discardPile) {
        player.discardPile = [];
      }
      player.discardPile.push(unit);
      unit.zone = 'trash';
    }
  }

  /**
   * Apply shield damage
   * Shields are face-down, so we don't calculate specific shield values
   * Just track that damage broke one shield
   */
  applyDamageToShields(
    gameState: GameState,
    defendingPlayerId: string,
    damage: number,
  ): { shieldsDestroyed: number; remainingDamage: number } {
    const player = gameState.players[defendingPlayerId];
    let shieldsDestroyed = 0;
    let remaining = damage;

    while (remaining > 0 && player.shields.length > 0) {
      // Each shield absorbs 1 damage (simplified)
      const shield = player.shields.pop()!;
      shield.zone = 'trash';
      player.discardPile.push(shield);
      shieldsDestroyed++;
      remaining--;
    }

    return { shieldsDestroyed, remainingDamage: remaining };
  }

  /**
   * Apply damage to base (life total)
   */
  applyDamageToBase(
    gameState: GameState,
    defendingPlayerId: string,
    damage: number,
  ): { baseHealthRemaining: number; isDefeated: boolean } {
    const player = gameState.players[defendingPlayerId];

    player.baseHealth -= damage;

    return {
      baseHealthRemaining: Math.max(0, player.baseHealth),
      isDefeated: player.baseHealth <= 0,
    };
  }

  /**
   * Check if unit has blocking ability
   */
  hasBlockingAbility(unit: CardInstance, cardDef: any): boolean {
    return cardDef?.keywords?.includes('Blocker') ?? false;
  }

  /**
   * Check for BREACH trigger condition
   * "When this unit destroys a unit by battle during your turn"
   */
  checkBreachTrigger(
    attacker: CardInstance,
    defenderDestroyed: boolean,
    isAttackerTurn: boolean,
  ): boolean {
    return defenderDestroyed && isAttackerTurn;
  }
}

/**
 * Helper: Format combat result for display
 */
export function formatCombatResult(result: CombatResult): string {
  let text = `\n${'='.repeat(50)}\n`;
  text += `COMBAT RESOLUTION\n`;
  text += `Attacker: ${result.combat.attackerCardId}\n`;
  text += `Defender: ${result.combat.defenderId ? result.combat.defenderCardId : 'Unblocked'}\n`;
  text += `\nDamage:\n`;
  text += `  Attacker takes: ${result.netDamageToAttacker}\n`;
  text += `  Defender takes: ${result.netDamageToDefender}\n`;
  text += `\nOutcome:\n`;
  text += `  Attacker: ${result.attackerDestroyed ? '❌ DESTROYED' : '✅ Survives'}\n`;
  text += `  Defender: ${result.defenderDestroyed ? '❌ DESTROYED' : '✅ Survives'}\n`;
  text += `\n${result.description}\n`;
  text += `${'='.repeat(50)}\n`;

  return text;
}

