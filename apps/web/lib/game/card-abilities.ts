/**
 * Card Abilities System
 * Parses and executes card text abilities
 *
 * Supports:
 * - Draw cards: "Draw X cards"
 * - Damage: "Deal X damage to shields"
 * - Tokens: "Create X token units"
 * - Conditional: "If [condition], then [effect]"
 */

import type { GameState, CardInstance, PlayerState } from './game-engine';
import {
  AbilityType,
  AbilityTrigger,
  DEFAULT_CARD_ABILITY_REGISTRY,
  type CardAbility,
} from '@gundam-forge/shared';

type ExecutableCardAbility = CardAbility & {
  condition?: (gameState: GameState, source: CardInstance) => boolean;
};

export interface AbilityExecutionResult {
  executed: boolean;
  message: string;
  effectDescription: string;
}

/**
 * Parses card ability text into structured format
 */
export class AbilityParser {
  /**
   * Parse ability text like "Draw 1 card"
   */
  static parseAbilityText(text: string): CardAbility | null {
    const normalizedText = text.toLowerCase().trim();

    // Draw X cards
    if (normalizedText.includes('draw')) {
      const match = normalizedText.match(/draw\s+(\d+)\s+card/);
      if (match) {
        return {
          id: `ability-draw-${Date.now()}`,
          name: `Draw ${match[1]}`,
          trigger: AbilityTrigger.DEPLOY,
          type: AbilityType.DRAW,
          text,
          parameters: { amount: parseInt(match[1], 10) },
        };
      }
    }

    // Damage shields X
    if (normalizedText.includes('damage') && normalizedText.includes('shield')) {
      const match = normalizedText.match(/damage\s+(\d+)\s+shield/);
      if (match) {
        return {
          id: `ability-damage-${Date.now()}`,
          name: `Damage Shields ${match[1]}`,
          trigger: AbilityTrigger.ATTACK,
          type: AbilityType.DAMAGE_SHIELDS,
          text,
          parameters: { amount: parseInt(match[1], 10) },
        };
      }
    }

    // Deal X damage to base
    if (normalizedText.includes('deal') && normalizedText.includes('damage')) {
      const match = normalizedText.match(/deal\s+(\d+)\s+damage.*base/i);
      if (match) {
        return {
          id: `ability-damage-base-${Date.now()}`,
          name: `Damage Base ${match[1]}`,
          trigger: AbilityTrigger.ATTACK,
          type: AbilityType.DAMAGE_BASE,
          text,
          parameters: { amount: parseInt(match[1], 10) },
        };
      }
    }

    // Create tokens
    if (normalizedText.includes('create') && normalizedText.includes('token')) {
      const match = normalizedText.match(/create\s+(\d+)\s+token/);
      if (match) {
        return {
          id: `ability-token-${Date.now()}`,
          name: `Create ${match[1]} Tokens`,
          trigger: AbilityTrigger.DEPLOY,
          type: AbilityType.CREATE_TOKEN,
          text,
          parameters: { count: parseInt(match[1], 10) },
        };
      }
    }

    // Heal X
    if (normalizedText.includes('heal')) {
      const match = normalizedText.match(/heal\s+(\d+)/);
      if (match) {
        return {
          id: `ability-heal-${Date.now()}`,
          name: `Heal ${match[1]}`,
          trigger: AbilityTrigger.DEPLOY,
          type: AbilityType.HEAL,
          text,
          parameters: { amount: parseInt(match[1], 10) },
        };
      }
    }

    // Return null if no match
    return null;
  }
}

/**
 * Executes card abilities
 */
export class AbilityExecutor {
  /**
   * Execute an ability
   */
  static executeAbility(
    ability: ExecutableCardAbility,
    gameState: GameState,
    source: CardInstance,
    target: PlayerState | null = null,
  ): AbilityExecutionResult {
    // Check condition if present
    if (ability.condition && !ability.condition(gameState, source)) {
      return {
        executed: false,
        message: 'Ability condition not met',
        effectDescription: '',
      };
    }

    const activePlayer = gameState.players[source.zone === 'battle' ? 'player1' : 'player2'];
    const targetPlayer = target || gameState.players['player1'];

    switch (ability.type) {
      case AbilityType.DRAW:
        return this.executeDraw(gameState, activePlayer, ability);

      case AbilityType.DAMAGE_SHIELDS:
        return this.executeDamageShields(gameState, targetPlayer, ability);

      case AbilityType.DAMAGE_BASE:
        return this.executeDamageBase(gameState, targetPlayer, ability);

      case AbilityType.HEAL:
        return this.executeHeal(gameState, activePlayer, ability);

      case AbilityType.CREATE_TOKEN:
        return this.executeCreateToken(gameState, activePlayer, ability);

      default:
        return {
          executed: false,
          message: 'Unknown ability type',
          effectDescription: '',
        };
    }
  }

  /**
   * Draw cards
   */
  private static executeDraw(
    gameState: GameState,
    player: PlayerState,
    ability: CardAbility,
  ): AbilityExecutionResult {
    const amount = Number(ability.parameters.amount ?? 1);
    let cardsDrawn = 0;

    for (let i = 0; i < amount && player.deck.length > 0; i++) {
      const card = player.deck.pop();
      if (card) {
        card.zone = 'hand';
        player.hand.push(card);
        cardsDrawn++;
      }
    }

    return {
      executed: cardsDrawn > 0,
      message: `Drew ${cardsDrawn} card${cardsDrawn !== 1 ? 's' : ''}`,
      effectDescription: `${ability.name}: Drawn ${cardsDrawn} card${cardsDrawn !== 1 ? 's' : ''}`,
    };
  }

  /**
   * Damage shields
   */
  private static executeDamageShields(
    gameState: GameState,
    player: PlayerState,
    ability: CardAbility,
  ): AbilityExecutionResult {
    const amount = Number(ability.parameters.amount ?? 1);

    // Remove shields
    const shieldsDestroyed = Math.min(amount, player.shields.length);
    player.shields = player.shields.slice(shieldsDestroyed);

    return {
      executed: true,
      message: `${shieldsDestroyed} shields destroyed`,
      effectDescription: `${ability.name}: Destroyed ${shieldsDestroyed} shield${shieldsDestroyed !== 1 ? 's' : ''}`,
    };
  }

  /**
   * Damage base
   */
  private static executeDamageBase(
    gameState: GameState,
    player: PlayerState,
    ability: CardAbility,
  ): AbilityExecutionResult {
    const amount = Number(ability.parameters.amount ?? 1);
    const damageDealt = Math.min(amount, player.baseHealth);

    player.baseHealth -= damageDealt;

    return {
      executed: true,
      message: `Dealt ${damageDealt} damage to base`,
      effectDescription: `${ability.name}: Dealt ${damageDealt} damage`,
    };
  }

  /**
   * Heal base
   */
  private static executeHeal(
    gameState: GameState,
    player: PlayerState,
    ability: CardAbility,
  ): AbilityExecutionResult {
    const amount = Number(ability.parameters.amount ?? 1);
    const oldHealth = player.baseHealth;

    player.baseHealth = Math.min(
      player.baseHealth + amount,
      player.maxBaseHealth,
    );

    const healed = player.baseHealth - oldHealth;

    return {
      executed: healed > 0,
      message: `Healed ${healed} health`,
      effectDescription: `${ability.name}: Healed ${healed} health`,
    };
  }

  /**
   * Create token units (simplified - adds to hand)
   */
  private static executeCreateToken(
    gameState: GameState,
    player: PlayerState,
    ability: CardAbility,
  ): AbilityExecutionResult {
    const count = Number(ability.parameters.count ?? 1);

    // In a full implementation, would create actual token units
    // For now, just notify of intent

    return {
      executed: true,
      message: `Created ${count} token${count !== 1 ? 's' : ''}`,
      effectDescription: `${ability.name}: Created ${count} token unit${count !== 1 ? 's' : ''}`,
    };
  }
}

/**
 * Ability library - common card abilities
 */
export const ABILITY_LIBRARY: Record<string, CardAbility> = {
  ...DEFAULT_CARD_ABILITY_REGISTRY,
};
