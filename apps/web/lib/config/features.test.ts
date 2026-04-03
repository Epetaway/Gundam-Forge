import { describe, expect, it } from 'vitest';
import { isFeatureEnabled } from '@/lib/config/features';

describe('feature flags', () => {
  it('returns false by default for disabled env flags', () => {
    expect(isFeatureEnabled('authEnabled')).toBe(false);
    expect(isFeatureEnabled('cloudDeckSyncEnabled')).toBe(false);
    expect(isFeatureEnabled('favoritesEnabled')).toBe(false);
  });
});
