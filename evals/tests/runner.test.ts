import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { registerBuiltins } from '../src/builtins.js';
import { registry } from '../src/registry.js';
import { runExperiment } from '../src/runner.js';

describe('runner smoke (fake embedder, fixture data)', () => {
  it('scores every config cell and writes results', async () => {
    registry.clear();
    registerBuiltins();
    const outDir = mkdtempSync(path.join(os.tmpdir(), 'evals-smoke-'));
    const summaries = await runExperiment({
      corpus: 'data/corpus.fixture.jsonl',
      judgments: 'data/judgments.fixture.json',
      models: ['fake-hash-64'],
      docs: ['title-only', 'canonical'],
      queries: ['raw'],
      dims: [64],
      topK: [3],
      seeds: [1, 2],
      minRelevantsPerQuery: 3,
      outDir,
    });
    // docs(2) x queries(1) x dims(1) x seeds(2)
    expect(summaries).toHaveLength(4);
    for (const summary of summaries) {
      expect(summary.queryCount).toBe(4);
      expect(summary.avg.recallAtK[3]).toBeGreaterThanOrEqual(0);
    }
    expect(existsSync(path.join(outDir, 'summary.json'))).toBe(true);
    expect(existsSync(path.join(outDir, 'leaderboard.md'))).toBe(true);
    expect(existsSync(path.join(outDir, 'config.json'))).toBe(true);
    const leaderboard = readFileSync(path.join(outDir, 'leaderboard.md'), 'utf8');
    expect(leaderboard).toContain('fake-hash-64');
  });
});
