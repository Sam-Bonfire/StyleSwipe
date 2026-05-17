const { spawnSync } = require('child_process');
const isWin = process.platform === 'win32';
const task = process.argv[2];
const args = process.argv.slice(3);

if (isWin) {
  const result = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', `bin/${task}.ps1`, ...args], { stdio: 'inherit' });
  process.exit(result.status);
} else {
  const result = spawnSync('bash', [`bin/${task}.sh`, ...args], { stdio: 'inherit' });
  process.exit(result.status);
}
