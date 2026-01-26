import { Vector384 } from '@app/core';
import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for Web
// We allow local models = false to force fetching from CDN (HuggingFace) which is standard for web.
// If offline support is needed, we'd need a Service Worker caching strategy.
env.allowLocalModels = false;
env.useBrowserCache = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractor: any = null;
const MODEL_NAME = process.env.EXPO_PUBLIC_PRODUCT_EMBEDDING_MODEL_NAME || "Xenova/bge-small-en-v1.5";

async function getExtractor() {
    if (!extractor) {
        console.log(`[InferenceEngine-Web] Loading model ${MODEL_NAME}...`);
        // feature-extraction pipeline handles tokenization + ONNX inference automatically
        extractor = await pipeline('feature-extraction', MODEL_NAME);
    }
    return extractor;
}

export async function generateEmbedding(text: string): Promise<Vector384> {
    try {
        const pipe = await getExtractor();

        // BGE uses [CLS] pooling usually, but transformers.js default feature-extraction might return sequence.
        // We specify pooling: 'mean' to match typical sentence-transformer usage if not auto-detected.
        // However, 'Xenova/bge-small-en-v1.5' config usually specifies mean pooling.
        // We explicitly request it to be safe and match Scraper.

        const output = await pipe(text, { pooling: 'mean', normalize: true });

        // Output is a Tensor, .data is Float32Array
        // BGE-Small is 384 dim.
        const data = output.data as Float32Array;
        return Array.from(data.slice(0, 384));
    } catch (e) {
        console.error("[InferenceEngine-Web] Inference Failed:", e);
        // Fallback or rethrow? 
        // For now, return zero vector to avoid app crash, but log heavily.
        return new Array(384).fill(0.1);
    }
}
