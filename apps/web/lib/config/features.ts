export const featureFlags = {
  authEnabled: process.env.NEXT_PUBLIC_FEATURE_AUTH === 'true',
  cloudDeckSyncEnabled: process.env.NEXT_PUBLIC_FEATURE_CLOUD_DECK_SYNC === 'true',
  favoritesEnabled: process.env.NEXT_PUBLIC_FEATURE_FAVORITES === 'true',
} as const;

export type FeatureKey = keyof typeof featureFlags;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return featureFlags[feature];
}
