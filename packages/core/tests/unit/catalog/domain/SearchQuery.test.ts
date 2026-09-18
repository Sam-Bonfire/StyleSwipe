import { describe, it, expect } from 'vitest';

import { SearchQuerySchema, QueryTokenSchema } from '../../../../src/catalog/domain/SearchQuery';

describe('SearchQuery Domain', () => {
  it('validates a valid search query', () => {
    const query = {
      rawQuery: 'black t-shirt',
      normalizedQuery: 'black tshirt',
      tokens: [
        { value: 'black', type: 'EXACT' as const },
        { value: 'tshirt', type: 'FUZZY' as const },
      ],
      sort: 'RELEVANCE' as const,
      cursor: { limit: 20 },
    };

    const parsed = SearchQuerySchema.safeParse(query);
    expect(parsed.success).toBe(true);
  });

  it('provides defaults for missing optional fields', () => {
    const query = {
      rawQuery: 'jeans',
      normalizedQuery: 'jeans',
    };

    const parsed = SearchQuerySchema.parse(query);
    expect(parsed.sort).toBe('RELEVANCE');
    expect(parsed.tokens).toEqual([]);
    expect(parsed.autocorrectSuggestions).toEqual([]);
    expect(parsed.cursor).toEqual({ limit: 20 });
  });

  it('rejects invalid sort option', () => {
    const query = {
      rawQuery: 'jeans',
      normalizedQuery: 'jeans',
      sort: 'INVALID_SORT',
    };

    const parsed = SearchQuerySchema.safeParse(query);
    expect(parsed.success).toBe(false);
  });

  it('validates query tokens', () => {
    const token = {
      value: 'nike',
      type: 'EXACT',
      field: 'brand',
    };

    const parsed = QueryTokenSchema.safeParse(token);
    expect(parsed.success).toBe(true);
  });

  it('rejects query token with empty value', () => {
    const token = {
      value: '',
      type: 'EXACT',
    };

    const parsed = QueryTokenSchema.safeParse(token);
    expect(parsed.success).toBe(false);
  });
});
