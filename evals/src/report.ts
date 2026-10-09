import { writeFileSync } from 'node:fs';
import path from 'node:path';

import type { ConfigSummary, ExperimentConfig } from './types.js';

/** All experiment file output lives here — the runner returns data, this module writes it. */
export function writeRunFiles(
  outRoot: string,
  config: ExperimentConfig,
  summaries: ConfigSummary[],
  baselineRecall: number,
): void {
  writeFileSync(path.join(outRoot, 'config.json'), JSON.stringify(config, null, 2));
  writeFileSync(
    path.join(outRoot, 'summary.json'),
    JSON.stringify({ baselineRecallAtMaxK: baselineRecall, summaries }, null, 2),
  );
  writeFileSync(
    path.join(outRoot, 'leaderboard.md'),
    renderLeaderboard(summaries, baselineRecall, Math.max(...config.topK)),
  );
}

export function renderLeaderboard(
  summaries: ConfigSummary[],
  baseline: number,
  k: number,
): string {
  const rows = [...summaries].sort(
    (a, b) => (b.avg.ndcgAtK[k] as number) - (a.avg.ndcgAtK[k] as number),
  );
  const negCount = summaries[0]?.negatives.count ?? 0;
  const lines = [
    `# Leaderboard (K=${k}, generic-baseline recall=${baseline.toFixed(3)}, ${negCount} negatives)`,
    '',
    '| rank | config | recall | nDCG [95% CI] | attr-hit | coverage | diversity | abst@0.3 | q-ms |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  rows.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.key} | ${(s.avg.recallAtK[k] as number).toFixed(3)} | ${(s.avg.ndcgAtK[k] as number).toFixed(3)} [${s.ndcgCI.lo.toFixed(3)}, ${s.ndcgCI.hi.toFixed(3)}] | ${(s.avg.attrHitAtK[k] as number).toFixed(3)} | ${(s.avg.coverageAtK[k] as number).toFixed(3)} | ${(s.avg.diversityAtK[k] as number).toFixed(3)} | ${(s.negatives.abstainRate[0.3] as number).toFixed(2)} | ${s.cost.searchMsP50.toFixed(2)} |`,
    );
  });
  return lines.join('\n') + '\n';
}
