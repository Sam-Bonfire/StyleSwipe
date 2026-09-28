import { describe, expect, it } from 'vitest';

import { applyAffiliateRule } from '../../../../src/affiliate/domain/AffiliateRule';

const rules = [
  { merchantDomain: 'myntra.com', isEnabled: true, trackingParams: [{ key: 'utm_source', value: 'styleswipe' }] },
  { merchantDomain: 'ajio.com', isEnabled: false, trackingParams: [{ key: 'x', value: 'y' }] },
];

describe('applyAffiliateRule', () => {
  it('appends tracking params for a matching enabled rule', () => {
    expect(applyAffiliateRule('https://www.myntra.com/buy/123', rules)).toBe(
      'https://www.myntra.com/buy/123?utm_source=styleswipe',
    );
  });

  it('merges with existing query params and preserves fragments', () => {
    expect(applyAffiliateRule('https://myntra.com/a?color=red#details', rules)).toBe(
      'https://myntra.com/a?color=red&utm_source=styleswipe#details',
    );
  });

  it('replaces an existing param instead of duplicating', () => {
    expect(applyAffiliateRule('https://myntra.com/a?utm_source=old', rules)).toBe(
      'https://myntra.com/a?utm_source=styleswipe',
    );
  });

  it('returns the raw URL when no rule matches, rule disabled, or URL invalid', () => {
    expect(applyAffiliateRule('https://www.ajio.com/x', rules)).toBe('https://www.ajio.com/x');
    expect(applyAffiliateRule('https://unknown.com/x', rules)).toBe('https://unknown.com/x');
    expect(applyAffiliateRule('not a url', rules)).toBe('not a url');
  });
});
