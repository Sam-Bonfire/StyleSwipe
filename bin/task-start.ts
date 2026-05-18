import { spawnSync, execSync } from 'child_process';
import readline from 'readline';

function cleanArg(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('$usage_') || trimmed.includes('usage_type') || trimmed.includes('usage_title')) {
    return '';
  }
  return trimmed;
}

let type = cleanArg(process.env.usage_type) || cleanArg(process.argv[2]);
let title = cleanArg(process.env.usage_title) || cleanArg(process.argv[3]);

if (!type || !title) {
  console.error("❌ Error: Missing task type or title.");
  console.log("Usage: mise run task <type> <title>");
  process.exit(1);
}

// Slugify the title
const slugifiedTitle = title
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const branchName = `${type}/${slugifiedTitle}`;

// Get current branch
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

if (currentBranch === 'main') {
  console.warn("⚠️ Warning: You are branching off 'main'. Usually, you should branch off 'dev'.");
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Continue anyway? (y/N): ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y') {
      createBranch();
    } else {
      console.log("❌ Task aborted.");
      process.exit(1);
    }
  });
} else {
  createBranch();
}

function createBranch() {
  const result = spawnSync('gt', ['branch', 'create', branchName], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log(`\n✅ Stacked new branch: ${branchName}`);
}
