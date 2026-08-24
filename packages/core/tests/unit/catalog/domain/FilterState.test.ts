import { describe, it, expect } from 'vitest';

import { FilterStateSchema, PriceRangeSchema, BooleanFilterExpressionSchema, BooleanFilterExpression } from '../../../../src/catalog/domain/FilterState';

describe('FilterState Domain', () => {
  it('validates a valid filter state', () => {
    const filter = {
      brandIds: ['brand1', 'brand2'],
      priceRange: { min: 10, max: 100 },
      inStockOnly: true,
    };

    const parsed = FilterStateSchema.safeParse(filter);
    expect(parsed.success).toBe(true);
  });

  it('provides defaults for missing optional fields', () => {
    const filter = {};

    const parsed = FilterStateSchema.parse(filter);
    expect(parsed.brandIds).toEqual([]);
    expect(parsed.inStockOnly).toBe(false);
  });

  it('validates price range where min <= max', () => {
    const priceRange = { min: 10, max: 50 };
    const parsed = PriceRangeSchema.safeParse(priceRange);
    expect(parsed.success).toBe(true);
  });

  it('rejects price range where min > max', () => {
    const priceRange = { min: 50, max: 10 };
    const parsed = PriceRangeSchema.safeParse(priceRange);
    expect(parsed.success).toBe(false);
  });

  it('allows price range with only min or only max', () => {
    const minOnly = { min: 10 };
    const maxOnly = { max: 100 };

    expect(PriceRangeSchema.safeParse(minOnly).success).toBe(true);
    expect(PriceRangeSchema.safeParse(maxOnly).success).toBe(true);
  });

  it('rejects negative price values', () => {
    const priceRange = { min: -10, max: 50 };
    const parsed = PriceRangeSchema.safeParse(priceRange);
    expect(parsed.success).toBe(false);
  });

  it('validates a complex boolean filter expression tree', () => {
    const expr: BooleanFilterExpression = {
      type: 'AND',
      expressions: [
        { type: 'TERM', field: 'brand', value: 'nike' },
        {
          type: 'OR',
          expressions: [
            { type: 'TERM', field: 'color', value: 'black' },
            { type: 'TERM', field: 'color', value: 'white' },
          ],
        },
        {
          type: 'NOT',
          expression: { type: 'TERM', field: 'outOfStock', value: true },
        },
      ],
    };

    const parsed = BooleanFilterExpressionSchema.safeParse(expr);
    expect(parsed.success).toBe(true);
  });
});
