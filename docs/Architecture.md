# StyleSwipe Technical Architecture Specification

## 1. Vision & Core Strategy

StyleSwipe is a next-generation fashion discovery platform supporting two distinct shopping mentalities: an inspiration-heavy **Discover Mode** (Tinder-style) and a utility-heavy **Shop Mode** (Grid-based). The architecture is designed for **maximum solo-developer velocity** using AI-agent collaboration.

## 2. The High-Velocity Stack

We utilize an industrial-grade toolset to eliminate traditional Git bottlenecks and minimize manual overhead.

- **Runtime**: **Bun (v1.2+)** for high-performance execution and workspace management.
- **Orchestration**: **TurboRepo** for intelligent caching and pipeline execution.
- **Primary VCS**: **Jujutsu (jj)** for change-based versioning, anonymous branching, and instant snapshots.
- **PR Stacking**: **Graphite CLI** for orchestrating dependent PR chains without waiting for merges.
- **Persistence**: **Convex** for a reactive document store and native vector search.
- **Frontend**: **Expo + Tamagui** for iOS and Android deployment via EAS.

## 3. Hexagonal Layering Rules (DDD)

To ensure long-term maintainability, the system strictly enforces the following boundaries:

### A. Domain Layer (Core)

- **Content**: Pure entities (Product, User, StyleDNA) and Ports (Interfaces).
- **Strict Rule**: **ZERO** external dependencies. No Convex, no Expo, no third-party libraries.
- **Location**: `packages/core`.

### B. Application Layer (Use Cases)

- **Content**: Orchestration logic (e.g., `ExecutePartnerSync`).
- **Strict Rule**: Implements business logic by coordinating Domain entities.

### C. Infrastructure Layer (Adapters)

- **Content**: Implementation of Ports (ConvexAdapter, AuthAdapter, PlaywrightAdapter).
- **Strict Rule**: Technology-specific code lives only here.

## 4. The "Single Command" Workflow

All development activity, whether by the human architect or AI agents, must use the following helper scripts to maintain VCS integrity and remote backups.

| Phase        | Command       | Logic                                                     |
| ------------ | ------------- | --------------------------------------------------------- |
| **Start**    | `bun task`    | `jj new` + `jj branch set` + `jj git push`.               |
| **Snapshot** | `bun snap`    | Formats Rigorous Message + `jj describe` + `jj git push`. |
| **Deliver**  | `bun submit`  | `turbo lint/test` + `jj git export` + `gt stack submit`.  |
| **Release**  | `bun release` | `bun version patch` + `git tag` + `jj git push`.          |

## 5. Directory Structure

```text
/apps
  /consumer-app      # Expo Mobile Client
  /admin-panel       # Vite + React Operations Dashboard
  /scraper-service   # Standalone Bun Scraper Tool
/packages
  /core              # Pure Business Logic (Catalog, Discovery, Identity, Commerce)
  /infrastructure    # Technology Adapters (Convex, Auth, Sentry)
  /ui-kit            # Tamagui & Shared Components
/bin                 # Authorized Workflow Scripts
/convex              # Global Schema and Backend Functions
/.agent              # Agent SOPs and Protocols

```

## 6. The "Blacklist": What We Won't Do

To avoid architectural drift and unnecessary complexity, the following are strictly prohibited:

- **No Standard Git CLI**: Avoid `git commit` or `git checkout`. These bypass `jj` state management and break the snapshot logic.
- **No Manual Versioning**: Do not edit `package.json` version numbers manually. Always use `bun release`.
- **No Mega-PRs**: Features must be broken into a stack of small, logical PRs using Graphite.
- **No Infrastructure Leakage**: Never import database-specific logic (Convex) into the `packages/core` layer.
- **No Fancy UI Dependency**: We use Graphite CLI (`gt`) exclusively for stacking; we do not rely on the Graphite Web UI for the developer loop.

## 7. Collaboration & Parallel Locking

- **Remote Backups**: Every `bun snap` triggers a push to the remote. This ensures hardware failure never results in data loss.
- **Stacking Protocol**: If Task B depends on Task A, Task B must be rebased onto Task A’s branch using `jj rebase`.
- **Resource Locking**: Agents must signal in `docs/manifests/current_stack.md` before making breaking changes to `ui-kit`, the Convex schema or any other shared resources.
