import { describe, expect, it } from 'vitest';

import { config, tokens } from '../../theme';

describe('theme tokens', () => {
  it('exposes a tamagui config', () => {
    expect(config).toBeDefined();
  });

  it('defines brand colors (no hardcoded colors outside tokens)', () => {
    const color = tokens.color as Record<string, { val: string }>;
    expect(color['primary']?.val).toBe('#CD0268');
    expect(color['secondary']?.val).toBe('#34889E');
    expect(color['neutral900']?.val).toBe('#212739');
  });
});
