import { spawnSync } from 'child_process';
import * as fs from 'fs';

function setGithubOutput(key: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile && fs.existsSync(outputFile)) {
    fs.appendFileSync(outputFile, `${key}=${value}\n`);
  }
}

function getArg(index: number, envKey: string): string | undefined {
  const arg = process.argv[index];
  if (arg && !arg.startsWith('$usage_')) {
    return arg;
  }
  return process.env[envKey] || arg;
}

const distDir = getArg(2, 'usage_dist_dir');
const projectName = getArg(3, 'usage_project_name');
const branch = getArg(4, 'usage_branch') || 'main';

if (!distDir || !projectName) {
  console.error('Usage: tsx bin/deploy-cloudflare.ts <dist_dir> <project_name> [branch]');
  process.exit(1);
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!apiToken || apiToken.trim() === '') {
  console.error(`❌ CLOUDFLARE_API_TOKEN is not set or is empty. Failing loudly: a green run must mean the deploy happened.`);
  console.error(`👉 Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in GitHub Secrets/Environment Secrets.`);
  setGithubOutput('deployed', 'false');
  process.exit(1);
}

console.log(`🚀 Deploying ${projectName} (${distDir}) to Cloudflare Pages (branch: ${branch})...`);

const args = [
  'dlx',
  'wrangler',
  'pages',
  'deploy',
  distDir,
  `--project-name=${projectName}`,
  `--branch=${branch}`,
];

const result = spawnSync('pnpm', args, {
  stdio: 'pipe',
  encoding: 'utf-8',
  env: {
    ...process.env,
    CLOUDFLARE_API_TOKEN: apiToken,
    ...(accountId ? { CLOUDFLARE_ACCOUNT_ID: accountId } : {}),
  },
  shell: true,
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  console.error(`❌ Cloudflare deployment failed with exit code ${result.status}`);
  setGithubOutput('deployed', 'false');
  process.exit(result.status ?? 1);
}

const stdout = result.stdout || '';
const aliasMatch = stdout.match(/Deployment alias URL:\s*(https:\/\/[^\s]+)/i);
const urlMatch = stdout.match(/Take a peek over at\s*(https:\/\/[^\s]+)/i);
const finalUrl = aliasMatch?.[1] || urlMatch?.[1] || `https://${branch}.${projectName}.pages.dev`;

setGithubOutput('deployed', 'true');
setGithubOutput('url', finalUrl);
console.log(`✅ Successfully deployed ${projectName} to Cloudflare Pages: ${finalUrl}`);
