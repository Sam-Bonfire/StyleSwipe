import { describe, it, expect } from 'vitest';

import { AffiliateLinkSchema, OutboundClickEventSchema } from '../../../../src/affiliate/domain/AffiliateRedirect';

describe('AffiliateRedirect Domain Models', () => {
  describe('AffiliateLinkSchema', () => {
    it('should validate a valid affiliate link with HTTPS URLs', () => {
      const link = {
        productId: 'prod_1',
        merchantName: 'Zara',
        rawProductUrl: 'https://zara.com/product/123',
        affiliateNetwork: 'IMPACT',
        trackingParams: { utm_source: 'styleswipe' },
        resolvedUrl: 'https://impact.com/redirect?url=https%3A%2F%2Fzara.com%2Fproduct%2F123',
      };

      const result = AffiliateLinkSchema.safeParse(link);
      expect(result.success).toBe(true);
    });

    it('should fail if rawProductUrl is not HTTPS', () => {
      const link = {
        productId: 'prod_1',
        merchantName: 'Zara',
        rawProductUrl: 'http://zara.com/product/123', // http not https
        affiliateNetwork: 'IMPACT',
        trackingParams: {},
        resolvedUrl: 'https://impact.com/redirect',
      };

      const result = AffiliateLinkSchema.safeParse(link);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('URL must use HTTPS protocol');
      }
    });

    it('should fail if rawProductUrl is javascript:', () => {
      const link = {
        productId: 'prod_1',
        merchantName: 'Zara',
        rawProductUrl: 'javascript:alert(1)',
        affiliateNetwork: 'IMPACT',
        trackingParams: {},
        resolvedUrl: 'https://impact.com/redirect',
      };

      const result = AffiliateLinkSchema.safeParse(link);
      expect(result.success).toBe(false);
    });

    it('should fail if resolvedUrl is not HTTPS', () => {
      const link = {
        productId: 'prod_1',
        merchantName: 'Zara',
        rawProductUrl: 'https://zara.com/product/123',
        affiliateNetwork: 'IMPACT',
        trackingParams: {},
        resolvedUrl: 'http://impact.com/redirect', // http not https
      };

      const result = AffiliateLinkSchema.safeParse(link);
      expect(result.success).toBe(false);
    });
  });

  describe('OutboundClickEventSchema', () => {
    it('should validate a valid click event', () => {
      const event = {
        clickId: 'click_123',
        userId: 'user_1',
        productId: 'prod_1',
        merchantId: 'merch_1',
        destinationUrl: 'https://example.com/redirect',
        timestamp: Date.now(),
        deviceContext: { platform: 'ios', appVersion: '1.0.0' },
        utmSource: 'feed',
      };

      const result = OutboundClickEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate without a userId (guest)', () => {
      const event = {
        clickId: 'click_123',
        productId: 'prod_1',
        merchantId: 'merch_1',
        destinationUrl: 'https://example.com/redirect',
        timestamp: Date.now(),
        deviceContext: { platform: 'web', appVersion: 'web' },
      };

      const result = OutboundClickEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should fail if destinationUrl is not HTTPS', () => {
      const event = {
        clickId: 'click_123',
        productId: 'prod_1',
        merchantId: 'merch_1',
        destinationUrl: 'http://example.com/redirect', // http
        timestamp: Date.now(),
        deviceContext: { platform: 'web', appVersion: 'web' },
      };

      const result = OutboundClickEventSchema.safeParse(event);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('URL must use HTTPS protocol');
      }
    });
  });
});
