import { describe, it, expect } from 'vitest';

import { NotificationPreferencesSchema } from '../../../../src/notifications/domain/NotificationPreferences';

describe('NotificationPreferences', () => {
  it('validates default preferences', () => {
    const parsed = NotificationPreferencesSchema.parse({});
    expect(parsed.push).toBe(true);
    expect(parsed.email).toBe(true);
    expect(parsed.inApp).toBe(true);
    expect(parsed.priceDrops).toBe(true);
    expect(parsed.partnerSync).toBe(true);
    expect(parsed.dailyDrops).toBe(true);
    expect(parsed.marketing).toBe(false);
  });

  it('validates custom preferences', () => {
    const preferences = {
      push: false,
      marketing: true,
    };
    const parsed = NotificationPreferencesSchema.parse(preferences);
    expect(parsed.push).toBe(false);
    expect(parsed.marketing).toBe(true);
  });
});
