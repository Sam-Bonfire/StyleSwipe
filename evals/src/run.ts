/**
 * CLI: pnpm --filter @app/evals eval -- --config configs/eval.config.ts [--out results/<name>]
 *
 * DB-free: reads a pinned JSONL corpus + judgments, embeds via registered
 * adapters (cached in .cache/), ranks with brute-force cosine, writes
 * config.json + summary.json + leaderboard.md into the out dir.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ExperimentConfig } from './types.js';

import { registerBuiltins } from './builtins.js';
import { readArg } from './cli.js';
import { runExperiment } from './runner.js';

const configPath = readArg(process.argv, '--config') || 'configs/eval.config.ts';
const outName =
  readArg(process.argv, '--out') || `run-${new Date().toISOString().replace(/[:.]/g, '-')}`;

registerBuiltins();

const loaded = (await import(pathToFileURL(path.resolve(configPath)).href)) as {
  default: ExperimentConfig;
};
const config: ExperimentConfig = {
  ...loaded.default,
  corpus: path.resolve(loaded.default.corpus),
  judgments: path.resolve(loaded.default.judgments),
  outDir: path.resolve(outName),
};

const summaries = await runExperiment(config);
console.log(`Done: ${summaries.length} configs -> ${config.outDir}`);
