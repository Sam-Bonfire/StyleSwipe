 
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
// package exports is now default in SDK 53+

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

// 5. Stub native-only modules on web and deduplicate @react-navigation.
// Native modules have .node bindings that Metro cannot resolve for web/SSR.
// @react-navigation deduplication is handled by deleting nested copies and
// using extraNodeModules above to force resolution to root node_modules.
const NATIVE_ONLY_MODULES = [
  'onnxruntime-node',
  'onnxruntime-react-native',
  'sharp',
  'expo-battery',
  'expo-task-manager',
];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub native-only modules on web
  if (platform === 'web' && NATIVE_ONLY_MODULES.some((m) => moduleName === m || moduleName.startsWith(m + '/'))) {
    return { type: 'empty' };
  }

  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 6. Preserve class/function names to prevent "Module implementation must be a class" errors on web production builds
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
  disableExtraction: process.env.NODE_ENV === 'development',
});
