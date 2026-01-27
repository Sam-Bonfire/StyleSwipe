import { Effect } from "effect";
import { Embedder, EmbeddingError, Vector384 } from "@app/core";
import { generateEmbedding } from "../InferenceEngine";

export class OnnxEmbedder implements Embedder {
    generate(text: string): Effect.Effect<Vector384, EmbeddingError> {
        return Effect.tryPromise({
            try: () => generateEmbedding(text),
            catch: (error) => new EmbeddingError(String(error))
        });
    }
}
