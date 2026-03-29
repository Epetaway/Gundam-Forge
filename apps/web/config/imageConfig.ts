/**
 * Image Configuration
 * 
 * Centralized configuration for card image serving, fallbacks, and optimization
 */

const IS_DEV = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const IMAGE_CONFIG = {
  // Local image serving
  LOCAL: {
    basePath: '/card_art',
    supportedFormats: ['webp', 'png', 'jpg', 'jpeg'] as const,
    preferredFormat: 'webp',
    cacheMaxAge: 31536000, // 1 year (immutable)
  },

  // Card dimensions
  CARD_DIMENSIONS: {
    width: 300,
    height: 420,
    aspectRatio: 300 / 420,
  },

  // CDN fallback configuration
  CDN_FALLBACKS: [
    {
      name: 'official',
      baseUrl: 'https://www.gundam-gcg.com/en/images/cards/card',
      format: 'webp',
      timeout: 5000,
      retry: true,
      description: 'Official Gundam TCG card images',
    },
    {
      name: 'backup',
      baseUrl: 'https://cdn.gundam-forge.local/cards',
      format: 'webp',
      timeout: 5000,
      retry: false,
      description: 'Backup CDN (if configured)',
    },
  ] as const,

  // Image loading behavior
  LOADING: {
    default: 'lazy' as const,
    priority: false,
    quality: 85,
    sizes: '(max-width: 640px) 150px, 300px',
  },

  // Error handling
  ERRORS: {
    maxRetries: 2,
    fallbackOnError: true,
    showPlaceholder: true,
    logErrors: IS_DEV,
  },

  // Performance optimization
  PERFORMANCE: {
    preloadTopCards: 20,
    lazyLoadThreshold: '50px',
    imageGridBatchSize: 50,
  },

  // Feature flags
  FEATURES: {
    enableWebP: true,
    enableSvgFallback: true,
    enableCdnFallback: true,
    enableImageOptimization: true,
  },

  // URLs - dynamically built
  buildLocalUrl: (cardId: string, format: string = 'webp'): string =>
    `${IMAGE_CONFIG.LOCAL.basePath}/${cardId}.${format}`,

  buildCdnUrl: (cdnIndex: number, cardId: string): string => {
    const cdn = IMAGE_CONFIG.CDN_FALLBACKS[cdnIndex];
    return `${cdn.baseUrl}/${cardId}.${cdn.format}`;
  },

  buildPlaceholderUrl: (cardId: string, cardName?: string): string =>
    `https://placehold.co/300x420?text=${encodeURIComponent(cardName || cardId)}`,

  buildSvgFallbackUrl: (cardId: string): string =>
    `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 420'%3E%3Crect fill='%23667eea' width='300' height='420'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='20' font-weight='bold'%3E${cardId}%3C/text%3E%3C/svg%3E`,
} as const;

// Export type for configuration
export type ImageConfig = typeof IMAGE_CONFIG;

// Validation helper
export function validateImageConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!IMAGE_CONFIG.LOCAL.basePath) {
    errors.push('LOCAL.basePath is required');
  }

  if (IMAGE_CONFIG.CARD_DIMENSIONS.width <= 0 || IMAGE_CONFIG.CARD_DIMENSIONS.height <= 0) {
    errors.push('CARD_DIMENSIONS must be positive');
  }

  if (IMAGE_CONFIG.ERRORS.maxRetries < 0) {
    errors.push('ERRORS.maxRetries must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default IMAGE_CONFIG;
