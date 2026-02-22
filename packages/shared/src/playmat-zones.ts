export interface PlaymatZoneAnchor {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

export const OFFICIAL_PLAYMAT_ZONE_TEMPLATE: PlaymatZoneAnchor[] = [
  { id: 'deck', label: 'Deck', xPercent: 4, yPercent: 64, widthPercent: 12, heightPercent: 28 },
  { id: 'discard', label: 'Discard', xPercent: 18, yPercent: 64, widthPercent: 12, heightPercent: 28 },
  { id: 'resource', label: 'Resource', xPercent: 34, yPercent: 64, widthPercent: 12, heightPercent: 28 },
  { id: 'battle-left', label: 'Battle Left', xPercent: 52, yPercent: 20, widthPercent: 14, heightPercent: 30 },
  { id: 'battle-right', label: 'Battle Right', xPercent: 70, yPercent: 20, widthPercent: 14, heightPercent: 30 }
];
