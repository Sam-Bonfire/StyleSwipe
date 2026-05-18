import { execSync } from 'child_process';

try {
  // Verify git is installed and we are inside a git work tree
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
  console.log('✅ Git hooks configured successfully!');
} catch (e) {
  // Graceful warning for environments without git (like Docker builds)
  console.log('⚠️ Git not found or not in a work tree. Skipping hooks setup.');
}
