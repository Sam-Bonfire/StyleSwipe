import { spawnSync } from 'child_process';

function cleanArg(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('$usage_') || trimmed.includes('usage_type') || trimmed.includes('usage_title') || trimmed.includes('usage_description') || trimmed.includes('usage_ticket')) {
    return '';
  }
  return trimmed;
}

let type = cleanArg(process.env.usage_type) || cleanArg(process.argv[2]);
let title = cleanArg(process.env.usage_title) || cleanArg(process.argv[3]);
let description = cleanArg(process.env.usage_description) || cleanArg(process.argv[4]);
let ticket = cleanArg(process.env.usage_ticket) || cleanArg(process.argv[5]);

if (!type || !title) {
  console.error("❌ Error: Missing commit type or title.");
  console.log("Usage: mise run snap <type> <title> [-d description] [-t ticket]");
  process.exit(1);
}

let commitMsg = `${type}: ${title}`;

if (description && description.trim() !== "") {
  commitMsg += `\n\n${description}`;
}

if (ticket && ticket.trim() !== "") {
  commitMsg += `\n\nFor: ${ticket}`;
}

console.log("📸 Capturing progress snapshot...");

// Git add
spawnSync('git', ['add', '.'], { stdio: 'inherit' });

// Git commit
const commitResult = spawnSync('git', ['commit', '-m', commitMsg], { stdio: 'inherit' });

if (commitResult.status !== 0) {
  process.exit(commitResult.status ?? 1);
}

console.log("\n📸 Progress captured with structured message:\n");
console.log(commitMsg);
