import { describe, it, expect } from 'vitest';

import { SwipeEventSchema } from '../SwipeEvent';

describe('SwipeEvent Models', () => {
  describe('SwipeEventSchema', () => {
    it('should parse valid swipe event', () => {
      const validEvent = {
        userId: 'u1',
        productId: 'p1',
        direction: 'like',
        dwellTimeMs: 1500,
        timestamp: Date.now(),
        clientContext: {
          sourceDeck: 'homepage',
          sessionId: 'session1',
        },
        coordinates: {
          x: 150.5,
          y: 200.2,
        },
      };

      const result = SwipeEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should parse valid swipe event with minimal data', () => {
      const validEvent = {
        userId: 'u1',
        productId: 'p1',
        direction: 'skip',
        dwellTimeMs: 0,
        timestamp: new Date().toISOString(),
      };

      const result = SwipeEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should reject negative dwell time', () => {
      const invalidEvent = {
        userId: 'u1',
        productId: 'p1',
        direction: 'like',
        dwellTimeMs: -500,
        timestamp: Date.now(),
      };

      const result = SwipeEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid direction', () => {
      const invalidEvent = {
        userId: 'u1',
        productId: 'p1',
        direction: 'maybe', // Invalid direction
        dwellTimeMs: 1000,
        timestamp: Date.now(),
      };

      const result = SwipeEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });
});
