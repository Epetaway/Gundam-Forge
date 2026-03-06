/**
 * Trigger Queue System
 * Implements official Gundam TCG trigger/ability resolution order
 *
 * Official timing order:
 * 1. BURST - "Before [event]" - resolves BEFORE event completes
 * 2. DEPLOY - "When [unit] is deployed" - immediately after unit enters
 * 3. ATTACK - "When [unit] attacks" - when unit declared as attacker
 * 4. DESTROYED - "When [unit] is destroyed" - on destruction
 * 5. BREACH - "When this unit destroys a unit by battle" - special condition
 */

import type { CardInstance, PlayerState, GameState } from './game-engine';
import {
  AbilityTrigger,
  getAbilitiesForCard,
  type CardAbility,
  type CardAbilityRegistry,
} from '@gundam-forge/shared';

/**
 * Trigger type with resolution priority
 */
export type TriggerType =
  | 'BURST'        // Priority 1: Before event
  | 'DEPLOY'       // Priority 2: When deployed
  | 'ATTACK'       // Priority 3: When attacks
  | 'DESTROYED'    // Priority 4: When destroyed
  | 'BREACH'       // Priority 5: Special combat trigger
  | 'END_OF_TURN'  // Priority 6: End phase
  | 'INSTANT';     // Priority 0: Can interrupt (future)

/**
 * Pending trigger in queue
 */
export interface QueuedTrigger {
  id: string;
  type: TriggerType;
  sourceInstanceId: string;
  sourceCardId: string;
  ownerPlayerId: string;
  priority: number; // Lower = earlier
  condition: () => boolean; // Check if still valid
  resolve: (gameState: GameState) => void; // Execute effect
  description: string;
  createdAt: number;
  isOptional: boolean; // Player can choose to resolve or not
  registeredAbilities: CardAbility[];
}

export interface TriggerQueueOptions {
  abilityRegistry?: CardAbilityRegistry;
  executeRegisteredAbility?: (
    ability: CardAbility,
    gameState: GameState,
    trigger: QueuedTrigger,
  ) => void;
}

/**
 * Trigger Queue Manager
 * Maintains pending triggers and resolves them in correct order
 */
export class TriggerQueueManager {
  private queue: QueuedTrigger[] = [];
  private triggerIdCounter = 0;
  private resolvedTriggers: QueuedTrigger[] = [];
  private abilityRegistry?: CardAbilityRegistry;
  private executeRegisteredAbility?: TriggerQueueOptions['executeRegisteredAbility'];

  constructor(options?: TriggerQueueOptions) {
    this.abilityRegistry = options?.abilityRegistry;
    this.executeRegisteredAbility = options?.executeRegisteredAbility;
  }

  /**
   * Get next trigger ID
   */
  private getTriggerId(): string {
    return `trigger-${this.triggerIdCounter++}`;
  }

  /**
   * Add trigger to queue
   */
  addTrigger(
    type: TriggerType,
    sourceInstanceId: string,
    sourceCardId: string,
    ownerPlayerId: string,
    condition: () => boolean,
    resolve: (gameState: GameState) => void,
    description: string,
    isOptional: boolean = false,
  ): QueuedTrigger {
    const priority = this.getPriorityForTriggerType(type);
    const mappedTrigger = this.mapTriggerTypeToAbilityTrigger(type);
    const registeredAbilities = mappedTrigger
      ? getAbilitiesForCard(sourceCardId, this.abilityRegistry).filter(
          (ability) => ability.trigger === mappedTrigger,
        )
      : [];

    const trigger: QueuedTrigger = {
      id: this.getTriggerId(),
      type,
      sourceInstanceId,
      sourceCardId,
      ownerPlayerId,
      priority,
      condition,
      resolve,
      description,
      createdAt: Date.now(),
      isOptional,
      registeredAbilities,
    };

    this.queue.push(trigger);
    this.sortQueue();

    return trigger;
  }

  private mapTriggerTypeToAbilityTrigger(type: TriggerType): AbilityTrigger | null {
    switch (type) {
      case 'DEPLOY':
        return AbilityTrigger.DEPLOY;
      case 'ATTACK':
        return AbilityTrigger.ATTACK;
      case 'DESTROYED':
        return AbilityTrigger.DESTROY;
      case 'END_OF_TURN':
        return AbilityTrigger.END_OF_TURN;
      default:
        return null;
    }
  }

  /**
   * Get priority for trigger type
   * Lower number = higher priority = resolves first
   */
  private getPriorityForTriggerType(type: TriggerType): number {
    const priorities: Record<TriggerType, number> = {
      INSTANT: 0,      // Interrupts everything
      BURST: 1,        // Before event
      DEPLOY: 2,       // On enter
      ATTACK: 3,       // When attacks
      DESTROYED: 4,    // When destroyed
      BREACH: 5,       // Special combat
      END_OF_TURN: 6,  // End phase
    };
    return priorities[type] ?? 99;
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Primary: By type priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Secondary: By creation time (FIFO for same priority)
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Get next pending trigger
   */
  peekNextTrigger(): QueuedTrigger | null {
    // Filter out invalid triggers
    const validTriggers = this.queue.filter((t) => t.condition());

    if (validTriggers.length === 0) {
      return null;
    }

    return validTriggers[0];
  }

  /**
   * Resolve next trigger in queue
   */
  resolveNextTrigger(gameState: GameState): QueuedTrigger | null {
    const trigger = this.peekNextTrigger();

    if (!trigger) {
      return null;
    }

    // Remove from queue
    this.queue = this.queue.filter((t) => t.id !== trigger.id);

    // Execute trigger
    trigger.resolve(gameState);

    // Optional bridge to registry-based execution.
    // Existing behavior remains unchanged unless executor is provided.
    if (this.executeRegisteredAbility) {
      for (const ability of trigger.registeredAbilities) {
        this.executeRegisteredAbility(ability, gameState, trigger);
      }
    }

    // Track resolved trigger
    this.resolvedTriggers.push(trigger);

    return trigger;
  }

  /**
   * Resolve all queued triggers
   */
  resolveAll(gameState: GameState): QueuedTrigger[] {
    const resolved: QueuedTrigger[] = [];

    let trigger = this.resolveNextTrigger(gameState);
    while (trigger) {
      resolved.push(trigger);
      trigger = this.resolveNextTrigger(gameState);
    }

    return resolved;
  }

  /**
   * Get all pending triggers
   */
  getPendingTriggers(): QueuedTrigger[] {
    return this.queue.filter((t) => t.condition());
  }

  /**
   * Get pending triggers for specific cardinstance
   */
  getPendingTriggersForCard(sourceInstanceId: string): QueuedTrigger[] {
    return this.getPendingTriggers().filter((t) => t.sourceInstanceId === sourceInstanceId);
  }

  /**
   * Get pending triggers of specific type
   */
  getPendingTriggersOfType(type: TriggerType): QueuedTrigger[] {
    return this.getPendingTriggers().filter((t) => t.type === type);
  }

  /**
   * Remove specific trigger from queue
   */
  removeTrigger(triggerId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((t) => t.id !== triggerId);
    return this.queue.length < initialLength;
  }

  /**
   * Clear all pending triggers
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get trigger history
   */
  getResolvedTriggers(): QueuedTrigger[] {
    return [...this.resolvedTriggers];
  }

  /**
   * Get count of pending triggers
   */
  getPendingCount(): number {
    return this.getPendingTriggers().length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.getPendingCount() === 0;
  }
}

/**
 * Helper: Create DEPLOY trigger for unit entering battlefield
 */
export function createDeployTrigger(
  unit: CardInstance,
  cardDef: any,
  ownerPlayerId: string,
  description: string,
  callback: (gameState: GameState) => void,
): QueuedTrigger | null {
  // Parse card text for "When this enters" effects
  if (!cardDef.text || !cardDef.text.toLowerCase().includes('when this enters')) {
    return null;
  }

  return {
    id: `deploy-${unit.instanceId}`,
    type: 'DEPLOY',
    sourceInstanceId: unit.instanceId,
    sourceCardId: unit.cardId,
    ownerPlayerId,
    priority: 2,
    condition: () => unit.zone === 'battle',
    resolve: callback,
    description: `Deploy: ${description}`,
    createdAt: Date.now(),
    isOptional: false,
    registeredAbilities: [],
  };
}

/**
 * Helper: Create BURST trigger (before event)
 */
export function createBurstTrigger(
  sourceInstanceId: string,
  sourceCardId: string,
  ownerPlayerId: string,
  description: string,
  callback: (gameState: GameState) => void,
): QueuedTrigger {
  return {
    id: `burst-${sourceInstanceId}-${Date.now()}`,
    type: 'BURST',
    sourceInstanceId,
    sourceCardId,
    ownerPlayerId,
    priority: 1,
    condition: () => true,
    resolve: callback,
    description: `Burst: ${description}`,
    createdAt: Date.now(),
    isOptional: false,
    registeredAbilities: [],
  };
}

/**
 * Helper: Create DESTROYED trigger
 */
export function createDestroyedTrigger(
  unit: CardInstance,
  ownerPlayerId: string,
  description: string,
  callback: (gameState: GameState) => void,
): QueuedTrigger {
  return {
    id: `destroyed-${unit.instanceId}-${Date.now()}`,
    type: 'DESTROYED',
    sourceInstanceId: unit.instanceId,
    sourceCardId: unit.cardId,
    ownerPlayerId,
    priority: 4,
    condition: () => unit.zone === 'trash', // Only fires if destroyed
    resolve: callback,
    description: `Destroyed: ${description}`,
    createdAt: Date.now(),
    isOptional: false,
    registeredAbilities: [],
  };
}
