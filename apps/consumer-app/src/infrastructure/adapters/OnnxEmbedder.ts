import { RepositoryError } from '@app/core';
import { Effect } from 'effect';

import { generateEmbedding } from '../InferenceEngine';

export class OnnxEmbedder {
  generateEmbedding(text: string): Effect.Effect<number[], RepositoryError> {
    return Effect.tryPromise({
      try: () => generateEmbedding(text),
      catch: (error) => new RepositoryError('generateEmbedding', error),
    });
  }

  getDimensions(): Effect.Effect<number, never> {
    return Effect.succeed(384);
  }
}
