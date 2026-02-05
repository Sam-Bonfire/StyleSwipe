/**
 * Embedder Adapter - Infrastructure implementation of Embedder port
 * Uses @xenova/transformers with BGE-Small-EN-v1.5 model
 * Following Hexagonal Architecture: implements core domain port
 */

import { pipeline } from '@xenova/transformers';

// Model configuration
const MODEL_NAME = process.env.PRODUCT_EMBEDDING_MODEL_NAME || 'Xenova/bge-small-en-v1.5';
const EMBEDDING_DIMENSIONS = 384;

// Type for the feature extraction pipeline
type FeatureExtractionPipeline = (
  text: string,
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

/**
 * Progress callback for model loading
 */
export interface EmbedderProgress {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  file?: string;
  loaded: number;
  total: number;
}

/**
 * Embedding generation error
 */
export class EmbedderAdapterError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'EmbedderAdapterError';
  }
}

/**
 * Singleton embedder implementation using Xenova Transformers
 * Implements the Embedder port contract (duck-typed to avoid Effect import conflicts)
 */
export class EmbedderAdapter {
  private static instance: EmbedderAdapter | null = null;
  private extractor: FeatureExtractionPipeline | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get singleton instance with optional progress callback
   */
  public static async getInstance(
    progressCallback?: (progress: EmbedderProgress) => void,
  ): Promise<EmbedderAdapter> {
    if (!EmbedderAdapter.instance) {
      EmbedderAdapter.instance = new EmbedderAdapter();
      await EmbedderAdapter.instance.init(progressCallback);
    }
    return EmbedderAdapter.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  public static reset(): void {
    EmbedderAdapter.instance = null;
  }

  private async init(progressCallback?: (progress: EmbedderProgress) => void): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      console.log(`[EmbedderAdapter] Loading model: ${MODEL_NAME}`);
      try {
        const extractor = await pipeline('feature-extraction', MODEL_NAME, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          progress_callback: progressCallback as any,
        });
        this.extractor = extractor as unknown as FeatureExtractionPipeline;
        console.log(`[EmbedderAdapter] Model loaded successfully.`);
      } catch (error) {
        console.error(`[EmbedderAdapter] Failed to load model:`, error);
        throw new EmbedderAdapterError(`Failed to load embedding model: ${MODEL_NAME}`, error);
      }
    })();

    return this.initPromise;
  }

  /**
   * Generate embedding vector for text
   * Uses mean pooling and L2 normalization as required by BGE-Small
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.extractor) {
      await this.init();
    }

    try {
      const output = await this.extractor!(text, {
        pooling: 'mean',
        normalize: true,
      });
      // Convert TypedArray to standard number array
      return Array.from(output.data);
    } catch (error) {
      throw new EmbedderAdapterError(`Failed to generate embedding`, error);
    }
  }

  /**
   * Get embedding dimensions (384 for BGE-Small)
   */
  getDimensions(): number {
    return EMBEDDING_DIMENSIONS;
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.extractor !== null;
  }
}

/**
 * Format product data for embedding generation
 * Combines title, brand, description, and attributes into embeddable text
 */
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
    // Include relevant attributes
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
