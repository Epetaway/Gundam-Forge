/**
 * Feature Flags for Gundam Forge MVP and Optional Enhancements
 *
 * This file manages feature flags that control optional enhancements and experimental features.
 * All flags default to false unless explicitly enabled via environment variables.
 *
 * PART 6 Optional Features:
 * - FEATURE_COPY_CARD_ID: Copy button to clipboard in card detail header
 * - FEATURE_PRICE_HISTORY: Display price history panel in card details
 * - FEATURE_TRENDING: Show trending badge and deck popularity
 * - FEATURE_PLAYTEST_ACTIONS: Context-aware actions when viewing cards in playtest mode
 * - FEATURE_COMPARE_CARDS: Side-by-side card comparison tool
 */

/**
 * Checks if a feature flag is enabled
 * Environment variable format: VITE_FEATURE_<FLAG_NAME>=true|false
 *
 * @param featureName The name of the feature (e.g., "COPY_CARD_ID")
 * @param defaultValue Default value if env var not set (defaults to false)
 * @returns true if feature is enabled, false otherwise
 */
export function isFeatureEnabled(featureName: string, defaultValue = false): boolean {
  try {
    // Client-side: Check for VITE_ prefixed environment variable
    const envKey = `VITE_FEATURE_${featureName}`;
    const envValue = (import.meta as any).env[envKey];

    if (envValue !== undefined) {
      return envValue === 'true' || envValue === true;
    }

    return defaultValue;
  } catch (error) {
    // Fallback if import.meta is not available (shouldn't happen in Vite/Next.js)
    return defaultValue;
  }
}

/**
 * Feature flag definitions
 * Each feature maps to its environment variable suffix and default state
 */
export const FEATURE_FLAGS = {
  COPY_CARD_ID: 'COPY_CARD_ID',
  PRICE_HISTORY: 'PRICE_HISTORY',
  TRENDING: 'TRENDING',
  PLAYTEST_ACTIONS: 'PLAYTEST_ACTIONS',
  COMPARE_CARDS: 'COMPARE_CARDS',
} as const;

/**
 * Type-safe feature flag getter
 */
export const features = {
  /**
   * Copy Card ID: Adds a copy icon button in the card detail modal header
   * Allows quick copying of card IDs to clipboard
   */
  copyCopyCardId: () => isFeatureEnabled(FEATURE_FLAGS.COPY_CARD_ID),

  /**
   * Price History: Display price history panel and market trends
   * Shows price trends across different card markets/vendors
   */
  priceHistory: () => isFeatureEnabled(FEATURE_FLAGS.PRICE_HISTORY),

  /**
   * Trending: Show trending badge and deck popularity metrics
   * Displays which decks are trending and this card's appearance rate
   */
  trending: () => isFeatureEnabled(FEATURE_FLAGS.TRENDING),

  /**
   * Playtest Actions: Context-aware actions when card viewed in playtest context
   * Shows which zones/actions this card can perform during playtest
   */
  playtestActions: () => isFeatureEnabled(FEATURE_FLAGS.PLAYTEST_ACTIONS),

  /**
   * Compare Cards: Side-by-side comparison tool for analysis
   * Allows comparing stats and mechanics with other cards
   */
  compareCards: () => isFeatureEnabled(FEATURE_FLAGS.COMPARE_CARDS),
} as const;

/**
 * Get all currently enabled features (for debugging)
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .map(([key, value]) => (isFeatureEnabled(value) ? key : null))
    .filter((f): f is string => f !== null);
}

/**
 * Debugging helper: Log all feature flag states
 * Only logs in development environment
 */
export function logFeatureFlags(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const enabled = getEnabledFeatures();
    console.log('[Feature Flags]', {
      enabled: enabled.length > 0 ? enabled : 'None',
      allFlags: Object.keys(FEATURE_FLAGS),
    });
  }
}
