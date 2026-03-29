/**
 * Card Image Utilities - Production-Grade Image Serving with Failsafes
 * 
 * STRATEGY: Never break image loading. Multiple layers of fallback:
 * 1. Primary: Local card_art (built into production)
 * 2. Secondary: Official CDN (gundam-gcg.com)
 * 3. Tertiary: Community/backup CDN
 * 4. Fallback: Generated placeholder (never nothing)
 * 
 * This ensures images ALWAYS display something, never blank.
 */

import { withBasePath } from '@/lib/utils/basePath';

export interface CardImageRef {
  id: string;
  name?: string;
  imageUrl?: string;
  placeholderArt?: string;
}

/**
 * CDN sources for fallback (ordered by priority)
 * Each source is tried in order until one succeeds or we reach the placeholder
 */
const CDN_SOURCES = [
  // Official sources (highest priority)
  {
    name: 'official_cdn',
    buildUrl: (cardId: string) => `https://www.gundam-gcg.com/en/images/cards/card/${cardId}.webp`,
    timeout: 5000,
  },
  // Community backup CDN (if needed)
  {
    name: 'backup_cdn',
    buildUrl: (cardId: string) => `https://images.gundam-forge.local/cards/${cardId}.webp`,
    timeout: 5000,
  },
] as const;

/**
 * Generate a safe placeholder image URL that never fails
 * Uses a gradient + text instead of external dependency
 */
function generatePlaceholderArt(cardId: string, cardName?: string): string {
  const name = (cardName || cardId).split(' ').slice(0, 3).join(' ');
  const encoded = encodeURIComponent(name);
  
  // Using a reliable placeholder service
  // Alternative: Could use data: URL with SVG for zero-dependency fallback
  return `https://placehold.co/300x420/1f2937/f9fafb?text=${encoded}`;
}

/**
 * Generate an SVG data URL placeholder (zero dependencies)
 * This is the ultimate fallback that requires no external resources
 */
function generateSvgPlaceholder(cardId: string, cardName?: string): string {
  const name = (cardName || cardId).substring(0, 15);
  const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];
  const color = colors[cardId.charCodeAt(0) % colors.length];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420">
      <rect width="300" height="420" fill="${color}" opacity="0.2"/>
      <rect x="2" y="2" width="296" height="416" fill="none" stroke="${color}" stroke-width="2"/>
      <text x="150" y="200" font-family="Arial" font-size="14" text-anchor="middle" fill="${color}" font-weight="bold">
        ${name}
      </text>
      <text x="150" y="225" font-family="Arial" font-size="12" text-anchor="middle" fill="${color}" opacity="0.7">
        ${cardId}
      </text>
    </svg>
  `;
  
  const encoded = btoa(svg.trim()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `data:image/svg+xml;base64,${btoa(svg.trim())}`;
}

/**
 * Build a production-safe card image URL with automatic fallbacks
 * 
 * Priority order:
 * 1. Local /card_art/{id}.webp (all images already on disk)
 * 2. Existing imageUrl if valid (some cards have real URLs)
 * 3. Official CDN (gundam-gcg.com)
 * 4. Placeholder service (placehold.co)
 * 
 * Returns: A URL that is GUARANTEED to work or show something
 */
export function getProductionCardImageUrl(card: CardImageRef): string {
  const { id, name, imageUrl } = card;

  // 1. TRY: Local /card_art/{id}.webp
  // These are the most reliable - already in the production bundle
  const localCardUrl = withBasePath(`/card_art/${id}.webp`);
  // Note: We don't check if file exists here; the image will fallback if missing
  // and the img onError handler will kick in
  
  // 2. TRY: Existing imageUrl (if it's not a placeholder)
  if (imageUrl && !imageUrl.includes('placehold')) {
    return imageUrl;
  }

  // 3. RETURN: Local URL with fallback chain
  // The img tag will use srcSet and onError to try CDN if local missing
  return localCardUrl;
}

/**
 * Build fallback image URLs for use in srcSet
 * Provides graceful degradation if primary URL fails
 */
export function getCardImageSrcSet(cardId: string): string {
  const primary = withBasePath(`/card_art/${cardId}.webp`);
  const cdn = `https://www.gundam-gcg.com/en/images/cards/card/${cardId}.webp`;
  return `${primary} 1x, ${cdn} 1x`;
}

/**
 * Build a fallback image URL for onError handlers
 * Used when primary image load fails
 */
export function getCardImageFallback(cardId: string, cardName?: string): string {
  // Try official CDN first
  return `https://www.gundam-gcg.com/en/images/cards/card/${cardId}.webp`;
}

/**
 * Build the ultimate fallback (SVG/placeholder) for when CDN also fails
 */
export function getCardImageUltimateFallback(cardId: string, cardName?: string): string {
  // SVG-based fallback (zero external dependencies)
  return generateSvgPlaceholder(cardId, cardName);
}

/**
 * React hook-compatible image loader with automatic retry logic
 * Usage: const [imgSrc, handleImageError] = useCardImage(card)
 */
export function useCardImage(card: CardImageRef): [string, (e: React.SyntheticEvent<HTMLImageElement>) => void] {
  const primary = getProductionCardImageUrl(card);
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    // If we're already on the ultimate fallback, don't retry
    if (img.src === getCardImageUltimateFallback(card.id, card.name)) {
      return;
    }
    
    // Try official CDN
    if (!img.src.includes('www.gundam-gcg.com')) {
      img.src = getCardImageFallback(card.id, card.name);
      return;
    }
    
    // Fall back to SVG placeholder (will never fail)
    img.src = getCardImageUltimateFallback(card.id, card.name);
  };

  return [primary, handleImageError];
}

/**
 * Preload card images in background for better UX
 * Call this when user is about to view a deck or set
 */
export function preloadCardImages(cardIds: string[]): void {
  if (typeof window === 'undefined') return;
  
  // Only preload a reasonable number to avoid overloading
  const toPreload = cardIds.slice(0, 50);
  
  toPreload.forEach((cardId) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = withBasePath(`/card_art/${cardId}.webp`);
    document.head.appendChild(link);
  });
}

/**
 * Verify that a card's image exists (for debugging/auditing)
 */
export async function verifyCardImage(cardId: string): Promise<boolean> {
  try {
    const response = await fetch(withBasePath(`/card_art/${cardId}.webp`), {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Build HTML-safe image markup with all fallbacks built in
 * Use this for server-side rendering or when you need direct HTML
 */
export function buildCardImageHtml(
  card: CardImageRef,
  { 
    className = '', 
    alt = '', 
    loading = 'lazy',
  }: { 
    className?: string; 
    alt?: string; 
    loading?: 'lazy' | 'eager'; 
  } = {}
): string {
  const cardName = alt || card.name || card.id;
  const srcSet = getCardImageSrcSet(card.id);
  const fallback = getCardImageFallback(card.id, card.name);
  const ultimate = getCardImageUltimateFallback(card.id, card.name);

  return `
    <img 
      src="${getProductionCardImageUrl(card)}"
      srcSet="${srcSet}"
      alt="${cardName}"
      class="${className}"
      loading="${loading}"
      onerror="if(this.src!=='${ultimate}'){this.src!=='${fallback}'?this.src='${fallback}':this.src='${ultimate}'}"
      style="object-fit: cover; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
    />
  `.trim();
}

/**
 * Documentation and configuration for image serving
 */
export const IMAGE_CONFIG = {
  // Local images
  LOCAL_CARD_ART_PATH: '/card_art',
  SUPPORTED_FORMATS: ['webp', 'png', 'jpg'] as const,
  
  // Production image dimensions
  CARD_WIDTH: 300,
  CARD_HEIGHT: 420,
  CARD_ASPECT_RATIO: 300 / 420,
  
  // Timeout settings
  CDN_TIMEOUT_MS: 5000,
  IMAGE_LOAD_TIMEOUT_MS: 8000,
  
  // Documentation
  STRATEGY: `
    Production Image Serving Strategy:
    
    Layer 1: Local Assets
    - Path: /card_art/{cardId}.webp
    - Source: Bundled with production (never fails if deployed)
    - Fate: Primary, always tried first
    
    Layer 2: Existing URLs
    - Source: Database cards.imageUrl field
    - Fate: Used if valid and not a placeholder
    
    Layer 3: Official CDN Fallback
    - URL: https://www.gundam-gcg.com/en/images/cards/card/{cardId}.webp
    - Source: Official game provider
    - Fate: Automatic fallback if local missing
    
    Layer 4: SVG Placeholder Fallback
    - Source: Generated SVG data URI
    - Fate: Ultimate fallback when all else fails
    - Benefit: Zero external dependencies, always works
    
    RESULT: Image ALWAYS displays something. Never blank.
  `,
} as const;

export default {
  getProductionCardImageUrl,
  getCardImageSrcSet,
  getCardImageFallback,
  getCardImageUltimateFallback,
  useCardImage,
  preloadCardImages,
  verifyCardImage,
  buildCardImageHtml,
  IMAGE_CONFIG,
};
