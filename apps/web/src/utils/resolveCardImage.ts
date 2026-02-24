import type { CardDefinition } from '@gundam-forge/shared';

/**
 * Convert known external card-image URLs to local paths when the file is
 * available in public/card_art/.  This avoids CORS / hot-link issues with
 * the official site while keeping the sync scripts' data intact.
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

function resolveAssetUrl(source: string): string {
  // Normalise known remote hosts to local paths first
  const normalised = toLocalPathIfPossible(source);

  // Return external URLs and data URIs as-is
  if (
    normalised.startsWith('http://') ||
    normalised.startsWith('https://') ||
    normalised.startsWith('data:') ||
    normalised.startsWith('blob:')
  ) {
    return normalised;
  }

  // For relative paths, prefix with the Vite base URL
  const baseUrl = import.meta.env.BASE_URL ?? '/';

  if (normalised.startsWith('/')) {
    return `${baseUrl}${normalised.slice(1)}`;
  }

  return `${baseUrl}${normalised}`;
}

export function resolveCardImage(card: CardDefinition): string | undefined {
  const source = card.imageUrl || card.placeholderArt;

  if (!source) {
    return undefined;
  }

  return resolveAssetUrl(source);
}

/** Format a card ID for display when the card is not in the catalog */
export function formatUnknownCardId(cardId: string): string {
  return `Unknown (${cardId})`;
}
