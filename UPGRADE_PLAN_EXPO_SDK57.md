# Expo SDK 52 → 57 Upgrade Plan

## Overview

| | Current (SDK 52) | Target (SDK 57) |
|---|---|---|
| **Expo SDK** | ~52.0.0 | ~57.0.0 |
| **React Native** | 0.76.9 | 0.86 |
| **React** | 18.3.1 | 19.2.3 |
| **React Native Web** | ~0.19.13 | ~0.21.0 |
| **Min Node.js** | 20.18.x | 22.13.x |
| **Min Xcode** | 16.0+ | 26.4+ |
| **Min iOS** | 15.1+ | 16.4+ |
| **Min Android compileSdk** | 35 | 36 |

**This is a 5-SDK-version jump.** Expo recommends upgrading incrementally, one SDK at a time. However, given the research below, the upgrade can be compressed into fewer steps if you address each SDK's breaking changes systematically.

---

## Breaking Changes Summary by SDK Version

### SDK 53 (RN 0.79, React 19)
- **React 19**: New JSX transform, `use()` hook, Suspense changes, ref as prop, etc.
- **New Architecture enabled by default** (opt-out still available)
- **`package.json` `exports` field enabled by default** in Metro — may cause dual-package issues
- **`expo-av` deprecated** → migrate to `expo-audio` / `expo-video`
- **`expo-background-fetch` deprecated** → migrate to `expo-background-task`
- **Edge-to-edge enabled by default** for new Android projects
- **AppDelegate moved from Objective-C to Swift** (affects config plugins)
- **`setImmediate` polyfill removed**
- **Android package name no longer auto-added as linking scheme**

### SDK 54 (RN 0.81, React 19.1)
- **Precompiled React Native for iOS** (faster builds, but incompatible with `use_frameworks!`)
- **Edge-to-edge mandatory** for Android 16 (API 36) — cannot be disabled
- **Reanimated v4** — requires New Architecture, introduces `react-native-worklets` dependency
- **`expo-file-system/next` became default** — old API moved to `expo-file-system/legacy`
- **JSC support removed from React Native core** (need `@react-native-community/javascriptcore` if needed)
- **Minimum Xcode bumped to 16.1**, Node.js to 20.19.4
- **Metro imports changed**: `metro/src/..` → `metro/private/..`

### SDK 55 (RN 0.83, React 19.2)
- **Legacy Architecture REMOVED** — New Architecture only
- **New Expo package versioning**: all packages match SDK version (e.g., `expo-camera@^55.0.0`)
- **`expo-router` forked from React Navigation** — direct `@react-navigation/*` imports no longer work
- **`edgeToEdgeEnabled` removed from app.json**
- **`notification` config field removed from app.json** (use `expo-notifications` config plugin)
- **Minimum Xcode 26**, Node.js 20.19.4
- **`experiments.reactCanary` flag removed** (React 19 is baseline)

### SDK 56 (RN 0.85, React 19.2.3)
- **Hermes v1 by default** (performance improvements, but may have quirks)
- **expo-router no longer depends on React Navigation** — codemod available
- **`expo-file-system` async `copy()`/`move()`** — now returns Promise
- **`expo/fetch` installed as `globalThis.fetch`** — may affect existing fetch usage
- **Minimum Xcode 26.4**, iOS 16.4, Node.js 20.19.4
- **TypeScript bumped to 6.0.3**
- **`@expo/vector-icons` no longer a dependency of `expo`** — must add explicitly if used
- **`useHermesV1` enabled by default** in `expo-build-properties`

### SDK 57 (RN 0.86, React 19.2.3)
- **"Easy upgrade"** — no breaking changes from SDK 56
- **Reanimated 4.3→4.5**, Gesture Handler 2.31→2.32
- **Minimum Node.js 22.13.x**
- **`expo prebuild` clears android/ios by default** (use `--no-clean` to preserve)

---

## Complete Package Inventory

### `apps/consumer-app/package.json`

#### Dependencies — Version Mapping

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `expo` | ~52.0.0 | ~57.0.0 | |
| `react` | 18.3.1 | 19.2.3 | **BREAKING**: React 19 upgrade |
| `react-dom` | 18.3.1 | 19.2.3 | |
| `react-native` | 0.76.9 | 0.86 | **BREAKING**: 10 minor versions |
| `react-native-web` | ~0.19.13 | ~0.21.0 | |
| `@expo/metro-runtime` | ~4.0.0 | ~5.0.0 | |
| `expo-router` | ~4.0.22 | ~7.0.0 | **BREAKING**: Forked from react-navigation |
| `expo-asset` | ~11.0.5 | ~57.0.0 | New versioning since SDK 55 |
| `expo-background-fetch` | ~13.0.6 | ⚠️ REMOVE | Deprecated since SDK 53, use `expo-background-task` |
| `expo-battery` | ~9.0.2 | ~57.0.0 | |
| `expo-clipboard` | ~7.0.1 | ~57.0.0 | |
| `expo-constants` | ~17.0.8 | ~57.0.0 | |
| `expo-document-picker` | ^14.0.8 | ~57.0.0 | |
| `expo-file-system` | ~18.0.12 | ~57.0.0 | **BREAKING**: API changes (async copy/move) |
| `expo-linking` | ~7.0.5 | ~57.0.0 | |
| `expo-sharing` | ^57.0.3 | ~57.0.0 | Already at SDK 57 versioning |
| `expo-sqlite` | ~15.1.4 | ~57.0.0 | |
| `expo-status-bar` | ~2.0.0 | ~57.0.0 | Deprecations: backgroundColor, translucent |
| `expo-task-manager` | ~12.0.6 | ~57.0.0 | |
| `react-native-gesture-handler` | ~2.20.2 | ~2.32.0 | |
| `react-native-reanimated` | ~3.16.1 | ~4.5.0 | **BREAKING**: v3→v4, requires react-native-worklets |
| `react-native-safe-area-context` | 4.12.0 | ~5.0.0 | |
| `react-native-screens` | ~4.4.0 | ~4.23.0+ | |
| `react-native-svg` | ^15.15.5 | ^15.15.5+ | Check latest |
| `react-native-qrcode-svg` | ^6.3.21 | ^6.3.21+ | Check React 19 compat |
| `onnxruntime-react-native` | ^1.23.2 | ⚠️ CHECK | **RISK**: May not support RN 0.86 |
| `@xenova/transformers` | ^2.17.2 | ^2.17.2+ | Pure JS, should be fine |
| `@convex-dev/better-auth` | ^0.12.5 | ^0.12.5+ | Check React 19 compat |

#### DevDependencies — Version Mapping

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `@babel/core` | ^7.25.0 | ^7.25.0+ | Check babel-preset-expo version |
| `@types/react` | ~18.3.12 | ~19.2.0 | **BREAKING**: React 19 types |
| `babel-plugin-transform-import-meta` | ^2.3.3 | ⚠️ REMOVE | Built-in since SDK 54 |
| `@tamagui/metro-plugin` | ^1.100.0 | ^2.4.0 | **BREAKING**: Major version upgrade |
| `tamagui` | ^1.100.0 | ^2.4.0 | **BREAKING**: Major version upgrade |

### `apps/admin-panel/package.json`

#### Dependencies — Version Mapping

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `expo` | ~52.0.0 | ~57.0.0 | |
| `react` | 18.3.1 | 19.2.3 | **BREAKING** |
| `react-dom` | 18.3.1 | 19.2.3 | |
| `react-native` | 0.76.9 | 0.86 | **BREAKING** |
| `react-native-web` | ~0.19.13 | ~0.21.0 | |
| `@expo/metro-runtime` | ~4.0.0 | ~5.0.0 | |
| `expo-router` | ~4.0.22 | ~7.0.0 | **BREAKING** |
| `expo-asset` | ~11.0.5 | ~57.0.0 | |
| `expo-constants` | ~17.0.8 | ~57.0.0 | |
| `expo-linking` | ~7.0.5 | ~57.0.0 | |
| `expo-status-bar` | ~2.0.0 | ~57.0.0 | |
| `react-native-gesture-handler` | ~2.20.2 | ~2.32.0 | |
| `react-native-reanimated` | ~3.16.1 | ~4.5.0 | **BREAKING** |
| `react-native-safe-area-context` | 4.12.0 | ~5.0.0 | |
| `react-native-screens` | ~4.4.0 | ~4.23.0+ | |

#### DevDependencies — Version Mapping

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `@babel/core` | ^7.25.0 | ^7.25.0+ | |
| `@types/react` | ~18.3.12 | ~19.2.0 | **BREAKING** |
| `babel-plugin-transform-import-meta` | ^2.3.3 | ⚠️ REMOVE | Built-in since SDK 54 |
| `@tamagui/metro-plugin` | ^1.100.0 | ^2.4.0 | **BREAKING** |
| `tamagui` | ^1.100.0 | ^2.4.0 | **BREAKING** |

### `packages/logger/package.json`

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `expo-battery` | ~9.0.2 | ~57.0.0 | |
| `expo-device` | ~7.0.2 | ~57.0.0 | |
| `expo-network` | ~7.0.5 | ~57.0.0 | |
| `expo-application` | ~6.0.2 | ~57.0.0 | |
| `expo-constants` | ~17.0.4 | ~57.0.0 | |

### `packages/ui-kit/package.json`

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `@expo-google-fonts/manrope` | ^0.4.2 | ^0.4.2+ | Check compat |
| `@tamagui/core` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `@tamagui/linear-gradient` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `@tamagui/lucide-icons` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `@tamagui/shorthands` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `@tamagui/themes` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `expo-font` | ^14.0.11 | ~57.0.0 | |
| `tamagui` | ^1.0.0 | ^2.4.0 | **BREAKING** |
| `react` (peer) | 18.3.1 | 19.2.3 | |
| `react-native` (peer) | >=0.72.0 | >=0.86.0 | |
| `react-native-reanimated` (peer) | >=3.0.0 | >=4.0.0 | |

### `packages/infrastructure/package.json`

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `react` (peer) | 18.3.1 | 19.2.3 | |

### Root `package.json`

#### Overrides to UPDATE

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `@react-navigation/native` | 7.1.28 | ⚠️ REMOVE | SDK 56+ expo-router no longer uses react-navigation |
| `@react-navigation/core` | 7.14.0 | ⚠️ REMOVE | Same as above |

#### Resolutions to UPDATE

| Package | Current | SDK 57 Target | Notes |
|---|---|---|---|
| `react` | 18.3.1 | 19.2.3 | |
| `react-dom` | 18.3.1 | 19.2.3 | |
| `@react-navigation/native` | 7.1.28 | ⚠️ REMOVE | |
| `@react-navigation/core` | 7.14.0 | ⚠️ REMOVE | |

---

## Tamagui Compatibility Assessment

**Current**: `tamagui@^1.100.0` + `@tamagui/metro-plugin@^1.100.0`
**Latest**: `tamagui@2.4.6` (released July 2026)

**Status**: ⚠️ **MAJOR UPGRADE REQUIRED**

Tamagui v1.x is not compatible with React 19 or the latest Expo SDK. You must upgrade to Tamagui v2.x:

- Tamagui v2 supports React 19, React Native 0.86, and Expo SDK 57
- The API has breaking changes between v1 and v2
- The `@tamagui/metro-plugin` has been updated in v2
- Check Tamagui v2 migration guide before upgrading
- All `@tamagui/*` packages must be updated together

**Risk**: HIGH — Tamagui is used extensively in the UI kit. Review the [Tamagui v2 changelog](https://github.com/tamagui/tamagui/releases) and [migration guide](https://tamagui.dev/docs/guides/upgrading) for breaking changes.

---

## Risk Assessment

### 🔴 HIGH RISK

| Change | Impact | Mitigation |
|---|---|---|
| **React 18→19** | New JSX transform, ref changes, `use()` hook, Suspense behavior changes, breaking changes in peer deps | Run `npx expo install --fix` to resolve peer dep conflicts; test all components thoroughly |
| **Reanimated v3→v4** | Requires New Architecture, introduces `react-native-worklets`, API changes | Follow Reanimated 3.x→4.x migration guide; many animation APIs changed |
| **Tamagui v1→v2** | Major version with API changes; used extensively in UI kit | Review Tamagui v2 migration guide; test all UI components |
| **expo-router v4→v7** | Forked from React Navigation; no longer depends on `@react-navigation/*` | Run the SDK 56 codemod: `npx expo-codemod sdk-56-expo-router-react-navigation-replace [src]` |
| **Legacy Architecture removed (SDK 55)** | All libraries must support New Architecture | Verify all native modules support New Architecture |
| **onnxruntime-react-native** | May not be compatible with RN 0.86 | Check package compatibility; may need to find alternative or pin version |

### 🟡 MEDIUM RISK

| Change | Impact | Mitigation |
|---|---|---|
| **metro.config.js changes** | On-demand filesystem, native Node.js watcher, package exports | Update metro config; remove `unstable_enablePackageExports` (now default) |
| **expo-file-system API changes** | async `copy()`/`move()`, legacy API removed | Update imports; use `copySync()`/`moveSync()` for sync behavior |
| **expo/fetch as globalThis.fetch** | May affect existing fetch usage | Test all API calls; can opt out with `EXPO_PUBLIC_USE_RN_FETCH=1` |
| **New package versioning (SDK 55+)** | All expo packages match SDK version | Run `npx expo install --fix` to resolve |
| **TypeScript 6.0.3** | May have breaking type changes | Run typecheck after upgrade |
| **Node.js 22.13.x minimum** | Must upgrade Node.js | Upgrade Node.js before starting |
| **Xcode 26.4 minimum** | Must upgrade Xcode for iOS builds | Upgrade Xcode before starting |

### 🟢 LOW RISK

| Change | Impact | Mitigation |
|---|---|---|
| **SDK 57 (RN 0.86)** | No breaking changes from SDK 56 | Straightforward upgrade after SDK 56 |
| **Edge-to-edge mandatory** | Android UI changes | Already enabled in SDK 53; now mandatory |
| **expo-status-bar deprecations** | `backgroundColor`, `translucent` are no-ops | Remove deprecated props |
| **babel-plugin-transform-import-meta** | No longer needed | Remove from devDependencies |

---

## Recommended Order of Operations

### Phase 0: Preparation (Before Starting)

1. **Upgrade Node.js** to 22.13.x or later
2. **Upgrade Xcode** to 26.4+ (for iOS builds)
3. **Create a new Git branch** for the upgrade
4. **Document current working state** — run typecheck, lint, and any tests
5. **Research Tamagui v2 migration** — read the changelog thoroughly
6. **Research Reanimated v4 migration** — read the 3.x→4.x migration guide
7. **Check onnxruntime-react-native** compatibility with RN 0.86

### Phase 1: SDK 52 → 53 (React 18→19, RN 0.76→0.79)

1. Update `expo` to `~53.0.0`
2. Run `npx expo install --fix` to update all expo packages
3. Update `react` to `19.0.0`, `react-dom` to `19.0.0`
4. Update `react-native` to `0.79`
5. Update `@types/react` to `~19.0.0`
6. Remove `expo-background-fetch` → add `expo-background-task`
7. Update `react-native-reanimated` to SDK 53 compatible version
8. Update `react-native-gesture-handler` to SDK 53 compatible version
9. Update `react-native-screens` to SDK 53 compatible version
10. Update `react-native-safe-area-context` to SDK 53 compatible version
11. Update `react-native-web` to `~0.20.0`
12. Update `@expo/metro-runtime` to SDK 53 compatible version
13. Remove `babel-plugin-transform-import-meta` from devDependencies
14. Update `@babel/core` if needed
15. Update root `resolutions` for `react` and `react-dom`
16. **Fix React 19 breaking changes** in app code
17. **Test thoroughly** — New Architecture is now default

### Phase 2: SDK 53 → 54 (RN 0.79→0.81, Reanimated v4)

1. Update `expo` to `~54.0.0`
2. Run `npx expo install --fix`
3. Update `react` to `19.1.0`, `react-native` to `0.81`
4. **Upgrade Reanimated to v4** — follow migration guide
5. Update `expo-file-system` imports if using `expo-file-system/next`
6. Update `metro.config.js` — remove `unstable_enablePackageExports` (now default)
7. Update Node.js minimum to 20.19.4
8. **Test thoroughly** — edge-to-edge is now mandatory

### Phase 3: SDK 54 → 55 (RN 0.81→0.83, Legacy Arch Removed)

1. Update `expo` to `~55.0.0`
2. Run `npx expo install --fix` — this will update ALL expo packages to ~55.0.0
3. Update `react` to `19.2.0`, `react-native` to `0.83`
4. **Verify all native modules support New Architecture** (Legacy is gone)
5. Remove `newArchEnabled` from app.json if present
6. Remove `experiments.reactCanary` from app.json if present
7. Remove `edgeToEdgeEnabled` from app.json if present
8. Remove `notification` field from app.json if present (use config plugin)
9. Update `expo-router` — SDK 55 version is now separate from react-navigation
10. Update `react-native-screens` to ~4.23.0+
11. **Test thoroughly** — Legacy Architecture is no longer available

### Phase 4: SDK 55 → 56 (RN 0.83→0.85, expo-router fork)

1. Update `expo` to `~56.0.0`
2. Run `npx expo install --fix`
3. Update `react` to `19.2.3`, `react-native` to `0.85`
4. **Run the expo-router codemod**:
   ```bash
   npx expo-codemod sdk-56-expo-router-react-navigation-replace [src]
   ```
5. **Remove `@react-navigation/*` overrides and resolutions** from root package.json
6. **Remove `@react-navigation/*` from metro.config.js extraNodeModules** (consumer-app)
7. Update `expo-file-system` — `copy()` and `move()` are now async
8. Update `expo/fetch` usage if any (now `globalThis.fetch`)
9. Update TypeScript to `~6.0.3`
10. Update minimum iOS to 16.4, Xcode to 26.4
11. **Test thoroughly** — Hermes v1 is now default

### Phase 5: SDK 56 → 57 (RN 0.85→0.86, "Easy Upgrade")

1. Update `expo` to `~57.0.0`
2. Run `npx expo install --fix`
3. Update `react-native` to `0.86`
4. Update `react-native-reanimated` to ~4.5.0
5. Update `react-native-gesture-handler` to ~2.32.0
6. Update Node.js minimum to 22.13.x
7. **Test** — this should be straightforward

### Phase 6: Tamagui Upgrade (Can be done in parallel or after)

1. **Upgrade Tamagui to v2.x** across all packages:
   - `tamagui`: ^1.100.0 → ^2.4.0
   - `@tamagui/metro-plugin`: ^1.100.0 → ^2.4.0
   - `@tamagui/core`: ^1.0.0 → ^2.4.0
   - `@tamagui/linear-gradient`: ^1.0.0 → ^2.4.0
   - `@tamagui/lucide-icons`: ^1.0.0 → ^2.4.0
   - `@tamagui/shorthands`: ^1.0.0 → ^2.4.0
   - `@tamagui/themes`: ^1.0.0 → ^2.4.0
2. Follow Tamagui v2 migration guide
3. Update metro.config.js if Tamagui plugin API changed
4. **Test all UI components thoroughly**

---

## Configuration File Changes

### `apps/consumer-app/metro.config.js`
- Remove `unstable_enablePackageExports = true` (default since SDK 53)
- Consider removing `unstable_enableSymlinks = true` (check if still needed)
- Update `extraNodeModules` — remove `@react-navigation/*` entries (added for SDK 56+)
- Update NATIVE_ONLY_MODULES list if any packages were renamed/removed
- Verify `@tamagui/metro-plugin` still works with Tamagui v2

### `apps/admin-panel/metro.config.js`
- Remove `unstable_enablePackageExports = true` (default since SDK 53)
- Consider removing `unstable_enableSymlinks = true` (check if still needed)
- Verify `@tamagui/metro-plugin` still works with Tamagui v2

### `apps/consumer-app/babel.config.js`
- Remove `transform-import-meta` plugin (built-in since SDK 54)
- Keep `react-native-reanimated/plugin` (still required)

### `apps/admin-panel/babel.config.js`
- Remove `transform-import-meta` plugin (built-in since SDK 54)

### Root `package.json`
- Remove `@react-navigation/native` from `overrides`
- Remove `@react-navigation/core` from `overrides`
- Remove `@react-navigation/native` from `resolutions`
- Remove `@react-navigation/core` from `resolutions`
- Update `react` resolution to `19.2.3`
- Update `react-dom` resolution to `19.2.3`

### `apps/consumer-app/app.config.ts`
- No breaking changes needed — config is clean

### `apps/admin-panel/app.json`
- No breaking changes needed — config is clean

---

## Workspace Packages That Need Updating

### `packages/logger/package.json`
Update all expo-* dependencies to SDK 57 versions:
- `expo-battery`: ~9.0.2 → ~57.0.0
- `expo-device`: ~7.0.2 → ~57.0.0
- `expo-network`: ~7.0.5 → ~57.0.0
- `expo-application`: ~6.0.2 → ~57.0.0
- `expo-constants`: ~17.0.4 → ~57.0.0

### `packages/ui-kit/package.json`
Update Tamagui packages and peer dependencies:
- All `@tamagui/*` packages: ^1.0.0 → ^2.4.0
- `tamagui`: ^1.0.0 → ^2.4.0
- `expo-font`: ^14.0.11 → ~57.0.0
- Peer dep `react`: 18.3.1 → 19.2.3
- Peer dep `react-native`: >=0.72.0 → >=0.86.0
- Peer dep `react-native-reanimated`: >=3.0.0 → >=4.0.0

### `packages/infrastructure/package.json`
- Peer dep `react`: 18.3.1 → 19.2.3

---

## Quick-Start Command (After All Research)

Once ready to execute, the recommended approach is:

```bash
# Ensure Node.js 22.13.x+ is installed
node --version

# Step 1: Update expo core
cd apps/consumer-app
npx expo install expo@^57.0.0 --fix

# Step 2: Fix all dependencies
npx expo install --fix

# Step 3: Check for issues
npx expo-doctor@latest

# Step 4: Repeat for admin-panel
cd ../admin-panel
npx expo install expo@^57.0.0 --fix
npx expo install --fix
npx expo-doctor@latest

# Step 5: Update workspace packages
# (manual updates to packages/logger, packages/ui-kit, packages/infrastructure)

# Step 6: Update root package.json overrides/resolutions

# Step 7: Update metro configs, babel configs

# Step 8: Run typecheck
bun run typecheck

# Step 9: Test both apps
bun run dev
```

**Note**: The `npx expo install --fix` command will resolve most version conflicts automatically, but you MUST still manually address the breaking changes listed above (Reanimated v4, Tamagui v2, expo-router migration, etc.).

---

## Key Risks to Investigate Before Starting

1. **`onnxruntime-react-native`** — Does it support RN 0.86? Check [npm](https://www.npmjs.com/package/onnxruntime-react-native) or [GitHub](https://github.com/nickvdyck/onnxruntime-react-native/issues)
2. **`@convex-dev/better-auth`** — Does it support React 19? Check with Convex team
3. **`react-native-qrcode-svg`** — Does it support RN 0.86 and New Architecture?
4. **Tamagui v2 migration** — Review all breaking changes in the Tamagui v2 changelog
5. **`@xenova/transformers`** — The `transform-import-meta` plugin was needed for this; verify it works without the plugin in SDK 54+
6. **Custom metro.config.js** — The monorepo-specific config may need adjustments for SDK 55+'s on-demand filesystem and new resolver behavior

---

*Generated on 2026-07-21. Based on Expo SDK release notes through SDK 57.*
