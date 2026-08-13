import { spawnSync } from 'child_process';

console.log("📤 Submitting current stack to GitHub using Graphite...");

const result = spawnSync('git', ['push', 'origin', 'HEAD:jules-pnpm-migration', '--force'], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("✅ PRs live on GitHub targeting 'dev'.");
