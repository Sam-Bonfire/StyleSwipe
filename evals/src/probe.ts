/**
 * Vets a HuggingFace model id before it earns a matrix slot: loads it,
 * embeds one probe text, prints dims + latency. Exits non-zero on failure
 * so bad ids never poison a sweep halfway through (cf. bge-micro-v2).
 *
 * Usage:
 *   pnpm --filter @app/evals probe -- --model onnx-community/embeddinggemma-300m-ONNX --dims 768
 */
import { readArg } from './cli.js';
import { transformersModel } from './models/transformers.js';

const hfName = readArg(process.argv, '--model');
const dims = Number(readArg(process.argv, '--dims') || '0');
const text =
  readArg(process.argv, '--text') || 'black slim-fit casual cotton shirt for daily wear';

if (!hfName || !dims) {
  console.error('Usage: probe -- --model <hf-id> --dims <N> [--text ...]');
  process.exit(1);
}

const started = performance.now();
const vectors = await transformersModel('probe', hfName, dims, 0).embed([text]);
const ms = performance.now() - started;
const vector = vectors[0] as number[];
console.log(`ok: ${hfName} dims=${vector.length} first3=[${vector.slice(0, 3).map((v) => v.toFixed(4)).join(', ')}] load+embed=${ms.toFixed(0)}ms`);
