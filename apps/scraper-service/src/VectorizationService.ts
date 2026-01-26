
import { pipeline } from '@xenova/transformers';

// Configuration from env
const MODEL_NAME = process.env.PRODUCT_EMBEDDING_MODEL_NAME || "Xenova/bge-small-en-v1.5";

export interface EmbeddingResult {
    v1: number[];
    v2?: number[];
}

export class VectorizationService {
    private static instance: VectorizationService;
    private extractor: any;

    private constructor() { }

    public static async getInstance(): Promise<VectorizationService> {
        if (!VectorizationService.instance) {
            VectorizationService.instance = new VectorizationService();
            await VectorizationService.instance.init();
        }
        return VectorizationService.instance;
    }

    private async init() {
        console.log(`Loading model: ${MODEL_NAME}`);
        // "feature-extraction" task for embeddings
        this.extractor = await pipeline('feature-extraction', MODEL_NAME);
    }

    /**
     * Generates embedding for a given text input.
     * For products, we usually combine Title + Description + Attributes.
     */
    public async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.init();

        // output is a Tensor
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        // Convert Tensor to standard array
        return Array.from(output.data);
    }

    /**
     * Generates all required versions of embeddings.
     * Currently only v1 is active, but structure supports v2 shadow.
     */
    public async generateAllVersions(text: string): Promise<EmbeddingResult> {
        const v1 = await this.generateEmbedding(text);
        // If v2 model is defined and different, generation logic would go here.
        // For now, we only implement v1.
        return { v1 };
    }
}
