import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import { registerBuiltins } from './builtins.js';
import { readArg, resolveOut } from './cli.js';
import { loadCorpus, loadJudgments } from './corpus.js';
import { registry } from './registry.js';

/**
 * Dumps every text the harness would embed (docs x builders + queries x
 * builders) as {key, text} lines for EXTERNAL embedding (custom runtimes,
 * vendor APIs). Keys are sha1(text)[:16] — the exact scheme the
 * precomputed adapter looks up, so byte-identity is guaranteed.
 *
 * Usage:
 *   pnpm --filter @app/evals texts -- --corpus data/corpus.v1.jsonl --judgments data/judgments.v2.json --docs canonical,tagged --queries raw --out data/external/texts.jsonl
 */
const corpusPath = readArg(process.argv, '--corpus') || 'data/corpus.v1.jsonl';
const judgmentsPath = readArg(process.argv, '--judgments') || 'data/judgments.v2.json';
const docIds = (readArg(process.argv, '--docs') || 'canonical,tagged').split(',');
const queryIds = (readArg(process.argv, '--queries') || 'raw').split(',');
const out = readArg(process.argv, '--out') || 'data/external/texts.jsonl';

registerBuiltins();

const corpus = loadCorpus(corpusPath);
const { queries } = loadJudgments(judgmentsPath, 1);

const seen = new Map<string, string>();
const add = (text: string): void => {
  const key = createHash('sha1').update(text).digest('hex').slice(0, 16);
  if (!seen.has(key)) seen.set(key, text);
};
for (const docId of docIds) {
  const builder = registry.doc(docId);
  for (const p of corpus) add(builder.build(p));
}
for (const queryId of queryIds) {
  const builder = registry.query(queryId);
  for (const q of queries) add(builder.build(q));
}

const outPath = resolveOut(out);
const lines = [...seen.entries()].map(([key, text]) => JSON.stringify({ key, text }));
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} unique texts -> ${outPath}`);
