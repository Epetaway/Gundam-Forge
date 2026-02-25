import type { CardDefinition } from '@gundam-forge/shared';

// `src/` is excluded from the Next.js tsconfig so @types/node is not available.
// Bundlers (Next.js / Vite) inject process.env at build time — declare it here.
declare const process: { env: Record<string, string | undefined> };

const EXBURST_BASE = 'https://exburst.dev/gundam/cards/sd';

/**
 * Convert known remote image URLs to local /card_art/ paths.
 * Both gundam-gcg.com (legacy) and exburst.dev images are downloaded
 * locally under public/card_art/{filename} by fetchCardAssets.
 */
function toLocalPathIfPossible(source: string): string {
  try {
    const url = new URL(source);
    const isKnownRemote =
      url.hostname === 'www.gundam-gcg.com' ||
      url.hostname === 'gundam-gcg.com' ||
      url.hostname === 'exburst.dev';
    if (isKnownRemote) {
      const filename = url.pathname.split('/').pop();
      if (filename) return `/card_art/${filename}`;
    }
  } catch {
    // Not a full URL — fall through
  }
  return source;
}

export function resolveCardImage(card: CardDefinition): string | undefined {
  const source = card.imageUrl || card.placeholderArt;
  if (!source) return undefined;

  // Convert gcg / exburst URLs to local paths (images committed to public/card_art/).
  const normalised = toLocalPathIfPossible(source);

  // External URLs (placehold.co, blob:, data:, etc.) are used as-is.
  if (
    normalised.startsWith('http://') ||
    normalised.startsWith('https://') ||
    normalised.startsWith('data:') ||
    normalised.startsWith('blob:')
  ) {
    return normalised;
  }

  // Local paths: raw <img> tags don't receive Next.js basePath injection,
  // so prepend NEXT_PUBLIC_BASE_PATH manually.
  // '/Gundam-Forge' in production, '' in dev (set via next.config.mjs env block).
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return normalised.startsWith('/') ? `${basePath}${normalised}` : `${basePath}/${normalised}`;
}

/**
 * Returns an ordered array of fallback URLs for a card image.
 *
 * Priority:
 *   1. Local /card_art/{id}.webp  — fastest, served from own origin
 *   2. exburst.dev remote URL     — canonical upstream source
 *   3. placeholderArt             — always-available data/CDN URL
 */
export function getCardFallbacks(card: CardDefinition): string[] {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const fallbacks: string[] = [
    `${basePath}/card_art/${card.id}.webp`,
    `${EXBURST_BASE}/${card.id}.webp`,
  ];

  if (card.placeholderArt) {
    fallbacks.push(card.placeholderArt);
  }

  return fallbacks;
}

/** Format a card ID for display when the card is not in the catalog */
export function formatUnknownCardId(cardId: string): string {
  return `Unknown (${cardId})`;
}
