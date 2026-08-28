import { spawnSync } from 'child_process';

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
  console.warn(`⚠️ WARNING: CLOUDFLARE_API_TOKEN is not set or is empty.`);
  console.warn(`⚠️ Skipping Cloudflare Pages deployment for "${projectName}".`);
  console.warn(`👉 To enable Cloudflare Pages deployments, please set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in GitHub Secrets/Environment Secrets.`);
  process.exit(0);
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
  stdio: 'inherit',
  env: {
    ...process.env,
    CLOUDFLARE_API_TOKEN: apiToken,
    ...(accountId ? { CLOUDFLARE_ACCOUNT_ID: accountId } : {}),
  },
  shell: true,
});

if (result.status !== 0) {
  console.error(`❌ Cloudflare deployment failed with exit code ${result.status}`);
  process.exit(result.status ?? 1);
}

console.log(`✅ Successfully deployed ${projectName} to Cloudflare Pages!`);
