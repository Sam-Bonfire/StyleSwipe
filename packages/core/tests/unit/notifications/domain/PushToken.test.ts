import { describe, it, expect } from 'vitest';

import { PushTokenSchema } from '../../../../src/notifications/domain/PushToken';

describe('PushToken', () => {
  it('validates a correct push token', () => {
    const token = {
      userId: 'u1',
      token: 't1',
      platform: 'IOS',
      service: 'APNS',
      lastSeenAt: Date.now(),
    };
    expect(() => PushTokenSchema.parse(token)).not.toThrow();
  });

  it('rejects invalid platform', () => {
    const token = {
      userId: 'u1',
      token: 't1',
      platform: 'INVALID_PLATFORM',
      service: 'APNS',
      lastSeenAt: Date.now(),
    };
    expect(() => PushTokenSchema.parse(token)).toThrow();
  });

  it('rejects invalid service', () => {
    const token = {
      userId: 'u1',
      token: 't1',
      platform: 'IOS',
      service: 'INVALID_SERVICE',
      lastSeenAt: Date.now(),
    };
    expect(() => PushTokenSchema.parse(token)).toThrow();
  });
});
