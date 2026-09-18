import { Embedder, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';

const MODEL_NAME = process.env.PRODUCT_EMBEDDING_MODEL_NAME || 'Xenova/bge-small-en-v1.5';
const EMBEDDING_DIMENSIONS = 384;

type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

export interface EmbedderProgress {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  file?: string;
  loaded: number;
  total: number;
}

// Module-level state replaces the OOP Singleton
let extractor: FeatureExtractionPipeline | null = null;
let initPromise: Promise<void> | null = null;
let activeProgressCallback: ((progress: EmbedderProgress) => void) | undefined;

export const setEmbedderProgressCallback = (cb: (progress: EmbedderProgress) => void) => {
    activeProgressCallback = cb;
};

const initEmbedder = async (): Promise<void> => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      console.log(`[EmbedderLayer] Loading model: ${MODEL_NAME}`);
      try {
        const { pipeline } = await import('@xenova/transformers');
        const pipelineExtractor = await pipeline('feature-extraction', MODEL_NAME, {
          progress_callback: activeProgressCallback,
        });
        extractor = pipelineExtractor as unknown as FeatureExtractionPipeline;
        console.log(`[EmbedderLayer] Model loaded successfully.`);
      } catch (error) {
        console.error(`[EmbedderLayer] Failed to load model:`, error);
        throw new Error(`Failed to load embedding model: ${MODEL_NAME}`);
      }
    })();
    return initPromise;
};

/**
 * Effect Layer implementing the Embedder Port.
 */
export const EmbedderLive = Layer.succeed(
  Embedder,
  {
    generateEmbedding: (text: string) => Effect.tryPromise({
      try: async () => {
        if (!extractor) {
            await initEmbedder();
        }
        const output = await extractor!(text, {
            pooling: 'mean',
            normalize: true,
        });
        return Array.from(output.data);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),
    getDimensions: () => Effect.succeed(EMBEDDING_DIMENSIONS)
  }
);

export function formatProductForEmbedding(product: {
  title?: string;
  brand?: string;
  description?: string;
  attributes?: Record<string, unknown>;
}): string {
  const parts: string[] = [];
  if (product.title) parts.push(product.title);
  if (product.brand) parts.push(product.brand);
  if (product.description) parts.push(product.description);

  if (product.attributes) {
    const relevantKeys = ['material', 'fabric', 'color', 'fit', 'occasion', 'pattern'];
    for (const key of relevantKeys) {
      const value = product.attributes[key];
      if (value && typeof value === 'string') {
        parts.push(value);
      }
    }
  }

  return parts.join(' ').trim();
}
