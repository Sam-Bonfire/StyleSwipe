import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("🚀 Initiating Production Release...");

function runCmd(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`❌ Error running: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

// 1. Sync branches
console.log("🔄 Syncing dev and main branches...");
runCmd('git', ['checkout', 'main']);
runCmd('git', ['pull', 'origin', 'main']);
runCmd('git', ['checkout', 'dev']);
runCmd('git', ['pull', 'origin', 'dev']);

// 2. Merge dev into main
console.log("🔀 Merging dev into main...");
runCmd('git', ['checkout', 'main']);
runCmd('git', ['merge', 'dev', '--no-ff', '-m', 'chore: release integrated changes from dev']);

// 3. Increment patch version in package.json
console.log("🔢 Incrementing version in package.json...");
const pkgPath = path.resolve('package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const parts = pkg.version.split('.');
parts[2] = (parseInt(parts[2], 10) + 1).toString();
const newVersion = parts.join('.');
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`🔢 Incremented version to v${newVersion}`);

// 4. Commit and push main
console.log("📤 Committing version update and pushing to main...");
runCmd('git', ['add', 'package.json']);
runCmd('git', ['commit', '-m', `release: v${newVersion}`]);
runCmd('git', ['push', 'origin', 'main']);

// 5. Tag and push tag
console.log(`🏷️ Tagging release v${newVersion}...`);
runCmd('git', ['tag', `v${newVersion}`]);
runCmd('git', ['push', 'origin', `v${newVersion}`]);

// 6. Back to dev
console.log("🔙 Switching back to dev branch...");
runCmd('git', ['checkout', 'dev']);

console.log(`\n✅ Successfully released v${newVersion} to main.`);
