const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Enable symlinks and package exports
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 4. Force map subpaths that Metro struggles to resolve in monorepos
config.resolver.extraNodeModules = {
  'better-auth': path.resolve(workspaceRoot, 'node_modules/better-auth'),
  'better-auth/client': path.resolve(
    workspaceRoot,
    'node_modules/better-auth/dist/client/index.mjs',
  ),
  'better-auth/plugins': path.resolve(
    workspaceRoot,
    'node_modules/better-auth/dist/plugins/index.mjs',
  ),
  '@convex-api': path.resolve(workspaceRoot, 'convex/_generated/api'),
  '@convex-dataModel': path.resolve(workspaceRoot, 'convex/_generated/dataModel'),
};

module.exports = config;
