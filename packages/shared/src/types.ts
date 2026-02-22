export type CardColor = 'Blue' | 'Green' | 'Red' | 'White' | 'Black' | 'Colorless';

export type CardType = 'Unit' | 'Pilot' | 'Command' | 'Base';

export interface CardPrice {
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  foil?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
  set: string;
  text?: string;
  power?: number;
  placeholderArt?: string;
  imageUrl?: string;
  price?: CardPrice;
}
