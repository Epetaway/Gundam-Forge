export interface PlaymatZoneAnchor {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

/**
 * Official Gundam Card Game playmat zone layout.
 *
 * Layout follows the official game zones (Rule 4):
 * - Top row (opponent side): Opponent's battle area + shield area
 * - Bottom row (player side): Player's battle area + shield area
 * - Left side: Deck, Resource Deck, Trash
 * - Right side: Shield Area (shields + base)
 * - Center: Battle Areas
 *
 * This is a simplified single-player view (your side only):
 *
 *  ┌─────────┬───────────────────────────────────┬──────────┐
 *  │ Res Deck│         Battle Area               │ Shields  │
 *  │         │  [Unit] [Unit] [Unit]              │ [Shield] │
 *  │         │  [Unit] [Unit] [Unit]              │ [Base]   │
 *  ├─────────┤                                    ├──────────┤
 *  │  Deck   │                                    │  Trash   │
 *  │         │         Resource Area              │          │
 *  └─────────┴───────────────────────────────────┴──────────┘
 */
export const OFFICIAL_PLAYMAT_ZONE_TEMPLATE: PlaymatZoneAnchor[] = [
  // Left column
  { id: 'resource-deck', label: 'Res. Deck', xPercent: 1.5, yPercent: 3,   widthPercent: 11, heightPercent: 42 },
  { id: 'deck',          label: 'Deck',      xPercent: 1.5, yPercent: 53,  widthPercent: 11, heightPercent: 42 },

  // Center - Battle Area (top)
  { id: 'battle',        label: 'Battle Area', xPercent: 14.5, yPercent: 3, widthPercent: 56, heightPercent: 42 },

  // Center - Resource Area (bottom)
  { id: 'resource',      label: 'Resources',   xPercent: 14.5, yPercent: 53, widthPercent: 56, heightPercent: 42 },

  // Right column
  { id: 'shields',       label: 'Shields',   xPercent: 72.5, yPercent: 3,  widthPercent: 13, heightPercent: 56 },
  { id: 'base',          label: 'Base',      xPercent: 72.5, yPercent: 62, widthPercent: 13, heightPercent: 33 },
  { id: 'trash',         label: 'Trash',     xPercent: 87.5, yPercent: 3,  widthPercent: 11, heightPercent: 42 },
  { id: 'removal',       label: 'Removed',   xPercent: 87.5, yPercent: 53, widthPercent: 11, heightPercent: 42 },
];

/** Zone IDs used in the game */
export const ZONE_IDS = OFFICIAL_PLAYMAT_ZONE_TEMPLATE.map(z => z.id);
