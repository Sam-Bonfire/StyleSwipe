import { describe, it, expect } from 'vitest';

import { NotificationSchema, serializeNotificationPayload, deserializeNotificationPayload } from '../../../../src/notifications/domain/Notification';

describe('Notification', () => {
  it('validates a correct notification', () => {
    const notification = {
      id: '1',
      userId: 'u1',
      type: 'PRICE_DROP',
      title: 'Price Drop!',
      body: 'Item is now cheaper',
      data: { productId: 'p1' },
      createdAt: Date.now(),
    };
    expect(() => NotificationSchema.parse(notification)).not.toThrow();
  });

  it('rejects invalid type', () => {
    const notification = {
      id: '1',
      userId: 'u1',
      type: 'INVALID_TYPE',
      title: 'Price Drop!',
      body: 'Item is now cheaper',
      createdAt: Date.now(),
    };
    expect(() => NotificationSchema.parse(notification)).toThrow();
  });

  it('validates default isRead', () => {
    const notification = {
      id: '1',
      userId: 'u1',
      type: 'PRICE_DROP',
      title: 'Price Drop!',
      body: 'Item is now cheaper',
      createdAt: Date.now(),
    };
    const parsed = NotificationSchema.parse(notification);
    expect(parsed.isRead).toBe(false);
  });

  it('serializes and deserializes payloads correctly', () => {
    const notification = NotificationSchema.parse({
      id: '1',
      userId: 'u1',
      type: 'PRICE_DROP',
      title: 'Price Drop!',
      body: 'Item is now cheaper',
      data: { productId: 'p1' },
      createdAt: Date.now(),
    });

    const serialized = serializeNotificationPayload(notification);
    expect(typeof serialized).toBe('string');

    const deserialized = deserializeNotificationPayload(serialized);
    expect(deserialized).toEqual(notification);
  });
});
