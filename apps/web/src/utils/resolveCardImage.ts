import type { CardDefinition } from '@gundam-forge/shared';

/**
 * Convert known gundam-gcg.com URLs to local /card_art/ paths.
 * The images are committed to git in public/card_art/ so they are served
 * from our own origin — no hotlinking required.
 */
function toLocalPathIfPossible(source: string): string {
  try {
    const url = new URL(source);
    if (url.hostname === 'www.gundam-gcg.com' || url.hostname === 'gundam-gcg.com') {
      const filename = url.pathname.split('/').pop();
      if (filename) {
        return `/card_art/${filename}`;
      }
    }
  } catch {
    // not a full URL – fall through
  }
  return source;
}

export function resolveCardImage(card: CardDefinition): string | undefined {
  const source = card.imageUrl || card.placeholderArt;
  if (!source) return undefined;

  // Convert gcg URLs to local paths (images committed to public/card_art/).
  const normalised = toLocalPathIfPossible(source);

  // External URLs (placehold.co, exburst.dev, etc.) are used as-is.
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
  // Value is '/Gundam-Forge' in production and '' in development
  // (set via next.config.mjs env block).
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

  if (normalised.startsWith('/')) {
    return `${basePath}${normalised}`;
  }

  return `${basePath}/${normalised}`;
}

/** Format a card ID for display when the card is not in the catalog */
export function formatUnknownCardId(cardId: string): string {
  return `Unknown (${cardId})`;
}
