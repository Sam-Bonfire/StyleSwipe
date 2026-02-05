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
  try {
    const { session, tokenizer } = await getOrLoadResources();

    const model_inputs = await tokenizer(text, {
      padding: true,
      truncation: true,
      maxLength: 128,
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

    const lastHiddenState = results.last_hidden_state;
    const data = lastHiddenState.data as Float32Array;

    return Array.from(data.slice(0, 384));
  } catch (e) {
    console.error('Inference Failed:', e);
    return new Array(384).fill(0.1);
  }
}
