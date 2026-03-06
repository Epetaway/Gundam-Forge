import type { CardDefinition, DeckDefinition } from './playtest-game-engine';

export interface TokenDeckCardConfig {
  id: string;
  name: string;
  type: CardDefinition['type'];
  count: number;
  zone: 'main' | 'resource';
  ap?: number;
  hp?: number;
  keywords?: string[];
  text?: string;
}

export interface TokenDeckConfig {
  id: string;
  name: string;
  description: string;
  cards: TokenDeckCardConfig[];
}

export const COLORLESS_TOKEN_DECK: TokenDeckConfig = {
  id: 'token-colorless-bot',
  name: 'Colorless Unit Tokens',
  description: 'Simple colorless unit token deck for bot simulations.',
  cards: [
    {
      id: 'TOKEN-UNIT-001',
      name: 'Colorless Token Unit 1',
      type: 'Unit',
      count: 15,
      zone: 'main',
      ap: 2,
      hp: 1,
      keywords: [],
      text: 'Basic token unit.',
    },
    {
      id: 'TOKEN-UNIT-002',
      name: 'Colorless Token Unit 2',
      type: 'Unit',
      count: 10,
      zone: 'main',
      ap: 3,
      hp: 2,
      keywords: [],
      text: 'Basic token unit.',
    },
    {
      id: 'TOKEN-UNIT-003',
      name: 'Colorless Token Unit 3',
      type: 'Unit',
      count: 9,
      zone: 'main',
      ap: 4,
      hp: 3,
      keywords: [],
      text: 'Basic token unit.',
    },
    {
      id: 'TOKEN-RESOURCE-001',
      name: 'Colorless Token Resource',
      type: 'Resource',
      count: 10,
      zone: 'resource',
      text: 'Resource token used by the bot.',
    },
    {
      id: 'EX-RESOURCE-TOKEN',
      name: 'EX Resource',
      type: 'Resource',
      count: 1,
      zone: 'resource',
      text: '(At the start of the game, the second-turn player places 1 active EX Resource into their resource area.) (Rest an EX Resource then exile it from the game when paying a cost.)',
    },

  ],
};

export const toDeckDefinition = (config: TokenDeckConfig): DeckDefinition => ({
  id: config.id,
  name: config.name,
  description: config.description,
  cards: config.cards.map((card) => ({
    cardId: card.id,
    count: card.count,
    zone: card.zone === 'resource' ? 'resource' : 'main',
  })),
});
