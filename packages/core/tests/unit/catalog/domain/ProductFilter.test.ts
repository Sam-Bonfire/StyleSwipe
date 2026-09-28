import { describe, expect, it } from 'vitest';

import type { FilterState } from '../../../../src/catalog/domain/FilterState';

import { applyProductFilters, sortProducts } from '../../../../src/catalog/domain/FilterState';
import { describeStock } from '../../../../src/catalog/domain/Inventory';
import { distributionPercent, isValidReviewText } from '../../../../src/catalog/domain/Review';

const filter: FilterState = {
  brandIds: [],
  categoryIds: [],
  colors: [],
  sizes: [],
  fitTypes: [],
  merchantNames: [],
  inStockOnly: false,
  genders: [],
  onSale: false,
};

const tee = { gender: 'men', brand: 'BrandA', category: 'T-Shirts', price: 50, mrp: 60, onSale: false };
const dress = { gender: 'women', brand: 'BrandB', category: 'Dresses', price: 500, mrp: 500, onSale: false };

describe('applyProductFilters', () => {
  it('passes everything with empty filters', () => {
    expect(applyProductFilters([tee, dress], filter)).toHaveLength(2);
  });

  it('filters gender, brand, price, and onSale', () => {
    expect(applyProductFilters([tee, dress], { ...filter, genders: ['men'] })).toEqual([tee]);
    expect(applyProductFilters([tee, dress], { ...filter, brandIds: ['BrandB'] })).toEqual([dress]);
    expect(applyProductFilters([tee, dress], { ...filter, priceRange: { min: 100 } })).toEqual([dress]);
    expect(applyProductFilters([tee, dress], { ...filter, onSale: true })).toEqual([tee]);
  });
});

describe('sortProducts', () => {
  it('sorts by price both ways and preserves order otherwise', () => {
    expect(sortProducts([dress, tee], 'PRICE_ASC').map((p) => p.price)).toEqual([50, 500]);
    expect(sortProducts([dress, tee], 'PRICE_DESC').map((p) => p.price)).toEqual([500, 50]);
    expect(sortProducts([dress, tee], 'RELEVANCE')).toEqual([dress, tee]);
  });
});

describe('describeStock', () => {
  it('labels in-stock sizes and out-of-stock state', () => {
    expect(
      describeStock([
        { available: true, inventory: 4, label: 'M' },
        { available: false, inventory: 9, label: 'L' },
        { available: true, inventory: 0, label: 'S' },
      ]),
    ).toEqual({ labels: ['M'], label: 'In Stock (M)' });
    expect(describeStock([])).toEqual({ labels: [], label: 'Out of Stock' });
    expect(describeStock(undefined)).toEqual({ labels: [], label: 'Out of Stock' });
  });
});

describe('review helpers', () => {
  it('validates text length and distribution math', () => {
    expect(isValidReviewText('  ab  ')).toBe(false);
    expect(isValidReviewText(' great fit ')).toBe(true);
    expect(distributionPercent(1, 4)).toBe(25);
    expect(distributionPercent(0, 0)).toBe(0);
  });
});
