import { Vector384 } from '@app/core';
import { AutoTokenizer, PreTrainedTokenizer } from '@xenova/transformers';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

import { ModelManager } from '../infrastructure/ModelManager';

let session: InferenceSession | null = null;
let tokenizer: PreTrainedTokenizer | null = null;

async function getOrLoadResources(): Promise<{
  session: InferenceSession;
  tokenizer: PreTrainedTokenizer;
}> {
  if (session && tokenizer) return { session, tokenizer };

  if (!(await ModelManager.isModelAvailable())) {
    throw new Error('Model not downloaded yet');
  }

  const modelPath = ModelManager.getModelPath();

  if (!session) {
    console.log(`[InferenceEngine] Loading model from ${modelPath}`);
    session = await InferenceSession.create(modelPath);
  }

  if (!tokenizer) {
    console.log(`[InferenceEngine] Loading tokenizer...`);
    tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-small-en-v1.5');
  }

  return { session, tokenizer };
}

export async function generateEmbedding(text: string): Promise<Vector384> {
  const { session, tokenizer } = await getOrLoadResources();

  const model_inputs = await tokenizer(text, {
    padding: true,
    truncation: true,
    maxLength: 512,
    return_tensors: 'np',
  });

  const inputIds = new Tensor(
    'int64',
    BigInt64Array.from(model_inputs.input_ids.data),
    model_inputs.input_ids.dims,
  );
  const attentionMask = new Tensor(
    'int64',
    BigInt64Array.from(model_inputs.attention_mask.data),
    model_inputs.attention_mask.dims,
  );
  const tokenTypeIds = new Tensor(
    'int64',
    BigInt64Array.from(model_inputs.token_type_ids.data),
    model_inputs.token_type_ids.dims,
  );

  const feeds = {
    input_ids: inputIds,
    attention_mask: attentionMask,
    token_type_ids: tokenTypeIds,
  };

  const results = await session.run(feeds);

  // Mean pooling weighted by attention mask + L2 normalize,
  // matching pipeline('feature-extraction', { pooling: 'mean', normalize: true }).
  const hidden = results.last_hidden_state;
  const data = hidden.data as Float32Array;
  const dims = hidden.dims as number[];
  const seqLen = dims[1] as number;
  const hiddenSize = dims[2] as number;
  const mask = model_inputs.attention_mask.data as Int32Array | Float32Array | number[];

  const pooled = new Array(hiddenSize).fill(0);
  let maskSum = 0;
  for (let t = 0; t < seqLen; t++) {
    const m = Number(mask[t]) || 0;
    maskSum += m;
    if (m === 0) continue;
    for (let h = 0; h < hiddenSize; h++) {
      pooled[h] += (data[t * hiddenSize + h] as number) * m;
    }
  }
  const denom = maskSum || 1;
  for (let h = 0; h < hiddenSize; h++) {
    pooled[h] /= denom;
  }
  const norm = Math.sqrt(pooled.reduce((s, v) => s + v * v, 0)) || 1;
  return pooled.map((v) => v / norm);
}
