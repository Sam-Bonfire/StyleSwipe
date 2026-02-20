import { Effect } from 'effect';

import { TaggingService, type TaggerResult } from '../domain/TaggingService';

export class TaggingError extends Error {
    readonly _tag = 'TaggingError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'TaggingError';
    }
}

const taggingService = new TaggingService();

export const execute = (
    text: string,
    rawCategory?: string,
): Effect.Effect<TaggerResult, TaggingError> =>
    Effect.gen(function* (_) {
        if (!text || text.trim().length === 0) {
            return yield* _(
                Effect.fail(new TaggingError('Product text is required for tagging')),
            );
        }

        return taggingService.generateTags(text, rawCategory);
    });
