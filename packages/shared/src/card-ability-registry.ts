import type { CardColor } from './types';

export enum AbilityType {
  DRAW = 'DRAW',
  DAMAGE_SHIELDS = 'DAMAGE_SHIELDS',
  DAMAGE_BASE = 'DAMAGE_BASE',
  CREATE_TOKEN = 'CREATE_TOKEN',
  HEAL = 'HEAL',
  SEARCH_DECK = 'SEARCH_DECK',
  CONDITIONAL = 'CONDITIONAL',
}

export enum AbilityTrigger {
  DEPLOY = 'DEPLOY',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  DESTROY = 'DESTROY',
  END_OF_TURN = 'END_OF_TURN',
}

export interface CardAbility {
  id: string;
  name: string;
  trigger: AbilityTrigger;
  type: AbilityType;
  text: string;
  parameters: Record<string, unknown>;
}

export interface AbilityRegistryEntry extends CardAbility {
  cardIds?: string[];
  colors?: CardColor[];
}

export type CardAbilityRegistry = Record<string, AbilityRegistryEntry>;

export const DEFAULT_CARD_ABILITY_REGISTRY: CardAbilityRegistry = {
  DRAW_1: {
    id: 'ability-draw-1',
    name: 'Draw 1',
    trigger: AbilityTrigger.DEPLOY,
    type: AbilityType.DRAW,
    text: 'Draw 1 card',
    parameters: { amount: 1 },
  },
  DRAW_2: {
    id: 'ability-draw-2',
    name: 'Draw 2',
    trigger: AbilityTrigger.DEPLOY,
    type: AbilityType.DRAW,
    text: 'Draw 2 cards',
    parameters: { amount: 2 },
  },
  DAMAGE_2_SHIELDS: {
    id: 'ability-damage-shields-2',
    name: 'Damage Shields 2',
    trigger: AbilityTrigger.ATTACK,
    type: AbilityType.DAMAGE_SHIELDS,
    text: 'When this unit attacks, deal 2 damage to shields',
    parameters: { amount: 2 },
  },
  DAMAGE_1_BASE: {
    id: 'ability-damage-base-1',
    name: 'Damage Base 1',
    trigger: AbilityTrigger.ATTACK,
    type: AbilityType.DAMAGE_BASE,
    text: 'When this unit attacks, deal 1 damage directly to base',
    parameters: { amount: 1 },
  },
  HEAL_3: {
    id: 'ability-heal-3',
    name: 'Heal 3',
    trigger: AbilityTrigger.DEPLOY,
    type: AbilityType.HEAL,
    text: 'Heal 3 health',
    parameters: { amount: 3 },
  },
};

export function getAbilityById(
  abilityId: string,
  registry: CardAbilityRegistry = DEFAULT_CARD_ABILITY_REGISTRY,
): AbilityRegistryEntry | undefined {
  return Object.values(registry).find((entry) => entry.id === abilityId);
}

export function getAbilitiesByTrigger(
  trigger: AbilityTrigger,
  registry: CardAbilityRegistry = DEFAULT_CARD_ABILITY_REGISTRY,
): AbilityRegistryEntry[] {
  return Object.values(registry).filter((entry) => entry.trigger === trigger);
}

export function getAbilitiesByColor(
  color: CardColor,
  registry: CardAbilityRegistry = DEFAULT_CARD_ABILITY_REGISTRY,
): AbilityRegistryEntry[] {
  return Object.values(registry).filter((entry) => !entry.colors || entry.colors.includes(color));
}

export function getAbilitiesForCard(
  cardId: string,
  registry: CardAbilityRegistry = DEFAULT_CARD_ABILITY_REGISTRY,
): AbilityRegistryEntry[] {
  return Object.values(registry).filter((entry) => !entry.cardIds || entry.cardIds.includes(cardId));
}
