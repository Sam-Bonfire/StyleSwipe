import { pipeline, env } from '@xenova/transformers';

// Configuration: Ensure model is cached and not redownloaded
env.allowLocalModels = false; // We want to fetch from remote if not in cache
env.useBrowserCache = true;  // Enable caching in the browser

const MODEL_NAME = "Xenova/bge-small-en-v1.5";

export class VectorizationService {
    private static instance: VectorizationService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private extractor: any;

    private constructor() { }

    public static async getInstance(progressCallback?: (progress: any) => void): Promise<VectorizationService> {
        if (!VectorizationService.instance) {
            VectorizationService.instance = new VectorizationService();
            await VectorizationService.instance.init(progressCallback);
        }
        return VectorizationService.instance;
    }

    private async init(progressCallback?: (progress: any) => void) {
        console.log(`[StyleSwipe] Loading/Caching model: ${MODEL_NAME}`);
        try {
            // "feature-extraction" task for embeddings
            this.extractor = await pipeline('feature-extraction', MODEL_NAME, {
                progress_callback: progressCallback
            });
            console.log(`[StyleSwipe] Model loaded successfully.`);
        } catch (error) {
            console.error(`[StyleSwipe] Failed to load model:`, error);
            throw error;
        }
    }

    /**
     * Generates embedding for a given text input.
     * Uses mean pooling and normalization as required by the BGE-Small model.
     */
    public async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.init();

        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        // Convert Tensor's TypedArray to standard number array
        return Array.from(output.data);
    }
}
