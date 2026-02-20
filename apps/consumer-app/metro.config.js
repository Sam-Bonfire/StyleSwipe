 
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
const sharedModules = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'convex',
  'tamagui',
  'effect',
  'better-auth',
];

config.resolver.extraNodeModules = sharedModules.reduce((acc, name) => {
  acc[name] = path.resolve(workspaceRoot, 'node_modules', name);
  return acc;
}, {});

// Add workspace aliases
config.resolver.extraNodeModules['@app/core'] = path.resolve(workspaceRoot, 'packages/core/src');
config.resolver.extraNodeModules['@app/convex'] = path.resolve(workspaceRoot, 'packages/convex/convex');

config.resolver.disableHierarchicalLookup = false; // Restore standard lookup, rely on nodeModulesPaths and extraNodeModules

const { withTamagui } = require('@tamagui/metro-plugin');

module.exports = withTamagui(config, {
  components: ['tamagui', '@app/ui-kit'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui.css',
});
