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

// 3. Force map deduplicated modules across monorepo
const DEDUPLICATED_MODULES = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  'tamagui',
  '@tamagui/core',
  '@tamagui/web',
  'convex',
  'effect',
  'better-auth',
];

const deduplicatedPaths = {};
for (const mod of DEDUPLICATED_MODULES) {
  try {
    deduplicatedPaths[mod] = path.dirname(require.resolve(`${mod}/package.json`, { paths: [projectRoot, workspaceRoot] }));
  } catch {
    // If not found, do not set dummy path that breaks module resolution
  }
}

config.resolver.extraNodeModules = deduplicatedPaths;

// Add workspace aliases
config.resolver.extraNodeModules['@app/core'] = path.resolve(workspaceRoot, 'packages/core/src');
config.resolver.extraNodeModules['@app/infrastructure'] = path.resolve(workspaceRoot, 'packages/infrastructure/src');
config.resolver.extraNodeModules['@app/ui-kit'] = path.resolve(workspaceRoot, 'packages/ui-kit');
config.resolver.extraNodeModules['@app/logger'] = path.resolve(workspaceRoot, 'packages/logger/src');
config.resolver.extraNodeModules['@app/convex'] = path.resolve(workspaceRoot, 'packages/convex/convex');

config.resolver.disableHierarchicalLookup = false;

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (deduplicatedPaths[moduleName]) {
    return context.resolveRequest(context, deduplicatedPaths[moduleName], platform);
  }

  if (moduleName.startsWith('@tamagui/')) {
    const pkgName = moduleName.split('/').slice(0, 2).join('/');
    if (deduplicatedPaths[pkgName]) {
      const subpath = moduleName.substring(pkgName.length);
      const target = deduplicatedPaths[pkgName] + subpath;
      return context.resolveRequest(context, target, platform);
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 4. Preserve class/function names to prevent "Module implementation must be a class" errors on web production builds
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

const { withTamagui } = require('@tamagui/metro-plugin');

module.exports = withTamagui(config, {
  components: ['tamagui', '@app/ui-kit'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui.css',
});
