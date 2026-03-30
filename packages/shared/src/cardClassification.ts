import { CardDefinition } from './types';

export const isExCard = (card: CardDefinition): boolean => {
    return card.type === 'Ex';
};

export const isResourceCard = (card: CardDefinition): boolean => {
    return card.type === 'Resource';
};

export const isMainDeckCard = (card: CardDefinition): boolean => {
    return card.type === 'MainDeck';
};
