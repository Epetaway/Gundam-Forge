import type { CardDefinition } from './types';

/** Returns true if card is an EX card (by flag, trait, or ID prefix). */
export function isExCard(card: CardDefinition): boolean {
  if (typeof card.isExCard === 'boolean') return card.isExCard;
  if ((card.traits ?? []).some((t) => t.toLowerCase().includes('ex'))) return true;
  return card.id.toLowerCase().startsWith('ex');
}

/** Returns true if card belongs in the Resource deck (not drawn from). */
export function isResourceCard(card: CardDefinition): boolean {
  if (typeof card.isResource === 'boolean') return card.isResource;
  return card.type === 'Resource' || card.type === 'Base';
}

/** Returns true if card belongs in the main deck (drawable, playable). */
export function isMainDeckCard(card: CardDefinition): boolean {
  if (typeof card.isMainDeck === 'boolean') return card.isMainDeck;
  const ex = isExCard(card);
  return (card.type === 'Unit' || card.type === 'Pilot' || card.type === 'Command') && !ex;
}
