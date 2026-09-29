import { describe, expect, it, beforeEach } from 'vitest';

import { RatingStars } from '../../../components/RatingStars';
import { getByText, renderThemed } from '../../utils';

type IconCall = { name: string; props: Record<string, unknown> };

function iconCalls(): IconCall[] {
  return ((globalThis as Record<string, unknown>).__iconCalls as IconCall[]) ?? [];
}

function starCalls() {
  const calls = iconCalls();
  return {
    full: calls.filter((c) => c.name === 'Star' && (c.props as { color?: string }).color === '$warning'),
    empty: calls.filter((c) => c.name === 'Star' && (c.props as { color?: string }).color !== '$warning'),
    half: calls.filter((c) => c.name === 'StarHalf'),
  };
}

describe('RatingStars', () => {
  beforeEach(() => {
    ((globalThis as Record<string, unknown>).__iconCalls as unknown[])?.splice(0);
  });

  it('renders full, half, and empty stars for fractional ratings', () => {
    renderThemed(<RatingStars rating={3.7} />);
    const { full, empty, half } = starCalls();
    expect(full).toHaveLength(3);
    expect(half).toHaveLength(1);
    expect(empty).toHaveLength(1);
  });

  it('renders no half star below the .5 threshold', () => {
    renderThemed(<RatingStars rating={2.3} />);
    const { full, empty, half } = starCalls();
    expect(full).toHaveLength(2);
    expect(half).toHaveLength(0);
    expect(empty).toHaveLength(3);
  });

  it('shows the review count when provided and hides it otherwise', () => {
    const withCount = renderThemed(<RatingStars rating={4} reviewCount={21} />);
    getByText(withCount.root, '(21)');
    const withoutCount = renderThemed(<RatingStars rating={4} showCount={false} reviewCount={21} />);
    expect(() => getByText(withoutCount.root, '(21)')).toThrow();
  });
});
