import type { CardDefinition, DeckDefinition } from './game-engine';

export interface TokenDeckCardConfig {
  id: string;
  name: string;
  type: CardDefinition['type'];
  count: number;
  zone: 'main' | 'resource';
  atk?: number;
  def?: number;
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
      atk: 2,
      def: 1,
      keywords: [],
      text: 'Basic token unit.',
    },
    {
      id: 'TOKEN-UNIT-002',
      name: 'Colorless Token Unit 2',
      type: 'Unit',
      count: 10,
      zone: 'main',
      atk: 3,
      def: 2,
      keywords: [],
      text: 'Basic token unit.',
    },
    {
      id: 'TOKEN-UNIT-003',
      name: 'Colorless Token Unit 3',
      type: 'Unit',
      count: 9,
      zone: 'main',
      atk: 4,
      def: 3,
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
