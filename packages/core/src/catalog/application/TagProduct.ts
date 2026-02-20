import { Effect } from 'effect';

import { TaggingService, type TaggerResult } from '../domain/TaggingService';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class TaggingError extends Error {
    readonly _tag = 'TaggingError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'TaggingError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Tag Product
// -----------------------------------------------------------------------------

/**
 * Generates tags for a product based on its textual description.
 * Pure domain logic — no persistence dependency.
 */
export class TagProduct {
    private readonly taggingService = new TaggingService();

    execute(
        text: string,
        rawCategory?: string,
    ): Effect.Effect<TaggerResult, TaggingError> {
        return Effect.gen(this, function* (_) {
            if (!text || text.trim().length === 0) {
                return yield* _(
                    Effect.fail(new TaggingError('Product text is required for tagging')),
                );
            }

            return this.taggingService.generateTags(text, rawCategory);
        });
    }
}
