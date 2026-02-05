import { describe, expect, it } from 'vitest';

import { TaggingService } from './TaggingService';

describe('TaggingService', () => {
  const service = new TaggingService();

  it('should categorize correctly', () => {
    expect(service.generateTags('Blue Denim Jeans').category).toBe('Bottom');
    expect(service.generateTags('Red Cotton T-Shirt').category).toBe('Top');
    expect(service.generateTags('Nike Air Sneakers').category).toBe('Shoes');
  });

  it('should extract attributes', () => {
    const result = service.generateTags('Casual Red Cotton Shirt');
    expect(result.attributes.color).toBe('red');
    expect(result.attributes.material).toBe('cotton');
    expect(result.vibes).toContain('casual');
  });

  it('should extract vibes', () => {
    const result = service.generateTags('Shiny Party Dress');
    expect(result.vibes).toContain('party');
  });

  it('should use raw category hint', () => {
    const result = service.generateTags('Unknown Item', 'Men Trousers');
    expect(result.category).toBe('Bottom');
  });

  it('should handle unmatchable input gracefully', () => {
    const result = service.generateTags('Random String 123');
    expect(result.category).toBe('Uncategorized');
    expect(result.vibes).toEqual([]);
    expect(result.attributes).toEqual({});
  });
});
