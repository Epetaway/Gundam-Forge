/**
 * useDragDropZones Hook
 * Manages drag & drop logic for card zones in playtester
 * Validates card placement based on zone rules
 */

import { useCallback } from 'react';
import type { CardInstance } from '@/lib/game/game-engine';

export type ZoneType = 'shields' | 'base' | 'battle' | 'resources' | 'trash' | 'deck' | 'hand' | 'opponent-shields' | 'opponent-base' | 'opponent-battle' | 'opponent-resources';

export interface ZoneRules {
  [zoneType: string]: {
    allowedCardTypes: string[];
    maxCards?: number;
    description: string;
  };
}

/**
 * Rules for which card types can go in which zones
 * Based on Gundam TCG official rules
 */
const ZONE_RULES: ZoneRules = {
  shields: {
    allowedCardTypes: ['Unit', 'Support', 'Modifier'],
    maxCards: 5,
    description: 'Shield Zone - Max 5 shields',
  },
  base: {
    allowedCardTypes: ['Base'],
    maxCards: 1,
    description: 'Base Area - Only Base cards',
  },
  battle: {
    allowedCardTypes: ['Unit'],
    description: 'Battle Area - Units only',
  },
  resources: {
    allowedCardTypes: ['Support', 'Resource'],
    description: 'Resources - Support/Resource cards',
  },
  trash: {
    allowedCardTypes: ['Unit', 'Support', 'Base', 'Modifier', 'Resource'],
    description: 'Trash - Any card can be discarded',
  },
  deck: {
    allowedCardTypes: [],
    description: 'Deck - Cannot move to deck',
  },
  hand: {
    allowedCardTypes: [],
    description: 'Hand - Only cards drawn can be here',
  },
  'opponent-shields': {
    allowedCardTypes: [],
    description: 'Opponent shields - Cannot modify',
  },
  'opponent-base': {
    allowedCardTypes: [],
    description: 'Opponent base - Cannot modify',
  },
  'opponent-battle': {
    allowedCardTypes: [],
    description: 'Opponent battle - Cannot modify',
  },
  'opponent-resources': {
    allowedCardTypes: [],
    description: 'Opponent resources - Cannot modify',
  },
};

export interface DragDropValidation {
  valid: boolean;
  reason?: string;
  feedback?: 'success' | 'warning' | 'error';
}

interface UseDragDropZonesResult {
  validateZonePlacement: (
    card: CardInstance,
    fromZone: ZoneType,
    toZone: ZoneType,
    cardDatabase: Record<string, any>
  ) => DragDropValidation;
  canDragFromZone: (zone: ZoneType) => boolean;
  canDropToZone: (zone: ZoneType) => boolean;
  getZoneRule: (zone: ZoneType) => ZoneRules[string] | undefined;
}

/**
 * Hook providing drag & drop zone validation
 */
export function useDragDropZones(): UseDragDropZonesResult {
  /**
   * Check if a card can be moved from one zone to another
   */
  const validateZonePlacement = useCallback(
    (
      card: CardInstance,
      fromZone: ZoneType,
      toZone: ZoneType,
      cardDatabase: Record<string, any>,
    ): DragDropValidation => {
      // Can't drag from opponent zones
      if (fromZone.startsWith('opponent-')) {
        return {
          valid: false,
          reason: "Cannot move opponent's cards",
          feedback: 'error',
        };
      }

      // Can't drag from deck or opponent zones
      if (fromZone === 'deck') {
        return {
          valid: false,
          reason: 'Cannot move cards from deck',
          feedback: 'error',
        };
      }

      // Can't move to opponent zones
      if (toZone.startsWith('opponent-')) {
        return {
          valid: false,
          reason: 'Cannot move cards to opponent zones',
          feedback: 'error',
        };
      }

      // Get target zone rules
      const targetZoneRule = ZONE_RULES[toZone];
      if (!targetZoneRule) {
        return {
          valid: false,
          reason: `Unknown zone: ${toZone}`,
          feedback: 'error',
        };
      }

      // Get card definition
      const cardDef = cardDatabase[card.cardId];
      if (!cardDef) {
        return {
          valid: false,
          reason: 'Card definition not found',
          feedback: 'error',
        };
      }

      // Check if card type is allowed in target zone
      const cardType = cardDef.type || 'Unknown';
      if (
        targetZoneRule.allowedCardTypes.length > 0 &&
        !targetZoneRule.allowedCardTypes.includes(cardType)
      ) {
        return {
          valid: false,
          reason: `${cardType} cards cannot go to ${toZone}`,
          feedback: 'error',
        };
      }

      // Allow move
      return {
        valid: true,
        feedback: 'success',
      };
    },
    [],
  );

  /**
   * Check if zone allows dragging FROM it
   */
  const canDragFromZone = useCallback((zone: ZoneType): boolean => {
    const restrictedZones = ['deck', 'opponent-shields', 'opponent-base', 'opponent-battle', 'opponent-resources'];
    return !restrictedZones.includes(zone);
  }, []);

  /**
   * Check if zone allows dropping TO it
   */
  const canDropToZone = useCallback((zone: ZoneType): boolean => {
    const restrictedZones = ['deck', 'opponent-shields', 'opponent-base', 'opponent-battle', 'opponent-resources'];
    return !restrictedZones.includes(zone);
  }, []);

  /**
   * Get rules for a specific zone
   */
  const getZoneRule = useCallback((zone: ZoneType) => {
    return ZONE_RULES[zone];
  }, []);

  return {
    validateZonePlacement,
    canDragFromZone,
    canDropToZone,
    getZoneRule,
  };
}
