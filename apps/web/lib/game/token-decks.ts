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
  name: 'Colorless Bot Tokens',
  description: 'Simple colorless token deck for bot simulations.',
  cards: [
    {
      id: 'BOT-TOKEN-SOLDIER',
      name: 'Token Soldier',
      type: 'Unit',
      count: 18,
      zone: 'main',
      atk: 2,
      def: 2,
      keywords: [],
      text: 'Basic assault token.',
    },
    {
      id: 'BOT-TOKEN-BRUISER',
      name: 'Token Bruiser',
      type: 'Unit',
      count: 8,
      zone: 'main',
      atk: 3,
      def: 3,
      keywords: ['breach'],
      text: 'Breaks through defenses with breach.',
    },
    {
      id: 'BOT-TOKEN-GUARD',
      name: 'Token Guard',
      type: 'Unit',
      count: 8,
      zone: 'main',
      atk: 1,
      def: 4,
      keywords: [],
      text: 'Defensive blocker token.',
    },
    {
      id: 'BOT-TOKEN-RESOURCE',
      name: 'Token Resource',
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
