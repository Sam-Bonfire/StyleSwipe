import { spawnSync } from 'child_process';

console.log("📤 Submitting current stack to GitHub using Graphite...");

const result = spawnSync('gt', ['submit', '--stack', '--no-edit', '--publish'], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("✅ PRs live on GitHub targeting 'dev'.");
