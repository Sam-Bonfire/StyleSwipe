import { z } from 'zod';

export const SortOptionSchema = z.enum([
  'RELEVANCE',
  'PRICE_ASC',
  'PRICE_DESC',
  'NEWEST',
  'POPULARITY',
  'DISCOUNT',
]);
export type SortOption = z.infer<typeof SortOptionSchema>;

export const QueryTokenSchema = z.object({
  value: z.string().min(1),
  type: z.enum(['EXACT', 'FUZZY', 'NEGATION']),
  field: z.string().optional(),
});
export type QueryToken = z.infer<typeof QueryTokenSchema>;

export const AutocorrectSuggestionSchema = z.object({
  originalTerm: z.string(),
  suggestedTerm: z.string(),
  confidenceScore: z.number().min(0).max(1),
});
export type AutocorrectSuggestion = z.infer<typeof AutocorrectSuggestionSchema>;

export const PaginationCursorSchema = z.object({
  lastId: z.string().optional(),
  lastScore: z.number().optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().max(100).default(20),
});
export type PaginationCursor = z.infer<typeof PaginationCursorSchema>;

export const SearchQuerySchema = z.object({
  rawQuery: z.string(),
  normalizedQuery: z.string(),
  tokens: z.array(QueryTokenSchema).default([]),
  autocorrectSuggestions: z.array(AutocorrectSuggestionSchema).default([]),
  sort: SortOptionSchema.default('RELEVANCE'),
  cursor: PaginationCursorSchema.default({ limit: 20 }),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
