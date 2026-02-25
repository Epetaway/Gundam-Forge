import type { CardDefinition } from '@gundam-forge/shared';

/**
 * Resolve the display URL for a card image.
 *
 * Images are downloaded at CI build time by `npm run fetch-assets` and stored
 * in public/card_art/, which Next.js includes in the static export.  At
 * runtime all card art is served from the same GitHub Pages origin — no
 * cross-origin hotlinking required.
 *
 * Raw <img> tags (CardGrid, CardTile, CardPreviewPanel) do NOT receive Next.js
 * basePath injection automatically, so we prepend NEXT_PUBLIC_BASE_PATH here.
 * The Next.js <Image> component (CardsClient) handles basePath on its own.
 *
 * Fallback chain:
 *   1. Local path from cards.json (/card_art/…) → prefix with basePath
 *   2. Any non-gcg external URL stored in cards.json → use directly
 *   3. placeholderArt (placehold.co) → use directly
 */
export function resolveCardImage(card: CardDefinition): string | undefined {
  const imageUrl = card.imageUrl;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

  // Prefer local paths — images were downloaded to public/card_art/ by
  // `npm run fetch-assets` and are served from our own origin.
  if (imageUrl?.startsWith('/')) {
    return `${basePath}${imageUrl}`;
  }

  // Non-gcg external URLs (rare — future CDN entries in cards.json) work
  // in the browser without hotlink issues.
  // gundam-gcg.com is excluded: it blocks cross-origin browser requests.
  if (
    imageUrl &&
    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) &&
    !imageUrl.includes('gundam-gcg.com')
  ) {
    return imageUrl;
  }

  // gcg URLs or no imageUrl at all — use the placeholder so the card slot
  // shows the card name rather than a broken image icon.
  if (card.placeholderArt) {
    return card.placeholderArt;
  }

  // Last resort: derive expected local path (may 404 if asset wasn't fetched).
  return `${basePath}/card_art/${card.id}.webp`;
}

/** Format a card ID for display when the card is not in the catalog */
export function formatUnknownCardId(cardId: string): string {
  return `Unknown (${cardId})`;
}
