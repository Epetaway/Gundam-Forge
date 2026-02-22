export type CardColor = 'Blue' | 'Green' | 'Red' | 'White' | 'Black' | 'Colorless';

export type CardType = 'Unit' | 'Pilot' | 'Command' | 'Base';

export interface CardDefinition {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
  set: string;
  text?: string;
  placeholderArt?: string;
}
