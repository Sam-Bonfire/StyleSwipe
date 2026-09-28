import { describe, expect, it } from 'vitest';

import { discountPercentage } from '../../../../src/commerce/domain/Discount';
import { canCancelOrder, canReturnOrder, CANCEL_WINDOW_MS, RETURN_WINDOW_MS } from '../../../../src/commerce/domain/Order';

const HOUR = 60 * 60 * 1000;

describe('canCancelOrder', () => {
  it('allows cancel within 24h for pending orders', () => {
    expect(canCancelOrder({ status: 'PENDING', createdAt: Date.now() - HOUR })).toBe(true);
  });

  it('blocks cancel after the window', () => {
    expect(canCancelOrder({ status: 'CONFIRMED', createdAt: 0 }, CANCEL_WINDOW_MS + 1)).toBe(false);
  });

  it('blocks cancel for terminal/shipped statuses (case-insensitive)', () => {
    for (const status of ['shipped', 'Delivered', 'CANCELLED', 'returned']) {
      expect(canCancelOrder({ status, createdAt: Date.now() })).toBe(false);
    }
  });
});

describe('canReturnOrder', () => {
  it('allows return within 7d of delivery', () => {
    const deliveredAt = Date.now() - 2 * 24 * HOUR;
    expect(
      canReturnOrder({ status: 'DELIVERED', createdAt: 0, statusHistory: [{ status: 'delivered', timestamp: deliveredAt }] }, deliveredAt + RETURN_WINDOW_MS - 1),
    ).toBe(true);
  });

  it('blocks return for non-delivered orders and expired windows', () => {
    expect(canReturnOrder({ status: 'PROCESSING', createdAt: Date.now() })).toBe(false);
    expect(canReturnOrder({ status: 'DELIVERED', createdAt: 0 }, RETURN_WINDOW_MS + 1)).toBe(false);
  });
});

describe('discountPercentage', () => {
  it('computes whole-number percent off', () => {
    expect(discountPercentage(366, 2099)).toBe(83);
    expect(discountPercentage(100, 100)).toBe(0);
  });

  it('returns 0 for missing or invalid MRP', () => {
    expect(discountPercentage(100, 0)).toBe(0);
    expect(discountPercentage(100, NaN)).toBe(0);
  });
});
