import type { CardDefinition } from '@gundam-forge/shared';

/**
 * Resolve the display URL for a card image.
 *
 * Why not local paths or gundam-gcg.com?
 *  - public/card_art/ is gitignored and not deployed to GitHub Pages.
 *  - gundam-gcg.com blocks cross-origin image requests (hotlinking).
 *
 * Instead we use the community CDN (exburst.dev), which is the project's
 * configured CARD_ART_BASE_URL and allows cross-origin loads. Any external
 * URL already stored in card data that isn't from gundam-gcg.com is used
 * as-is (future-proofing for other CDNs).
 */
export function resolveCardImage(card: CardDefinition): string | undefined {
  const imageUrl = card.imageUrl;

  // Use non-gcg external URLs directly (e.g. an exburst.dev link already in data).
  if (
    imageUrl &&
    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) &&
    !imageUrl.includes('gundam-gcg.com')
  ) {
    return imageUrl;
  }

  // For gundam-gcg.com URLs (hotlink-blocked) and local /card_art/ paths
  // (not deployed), derive the image URL from the community CDN using the
  // card's canonical ID.
  return `https://exburst.dev/gundam/cards/sd/${card.id}.webp`;
}

/** Format a card ID for display when the card is not in the catalog */
export function formatUnknownCardId(cardId: string): string {
  return `Unknown (${cardId})`;
}
