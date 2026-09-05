---
trigger: always_on
description: "Core technology stack and toolchain rules"
globs: ["**/*"]
---

# Technology Stack

## Core Tools
- **Runtime**: Node LTS - Used for script execution.
- **Package Manager**: pnpm (v9.12.3, pinned via `packageManager`) - Used for installs and workspace scripts.
- **Build System**: TurboRepo - Handles orchestration and caching.
- **VCS**: Git (via Graphite CLI `gt` for queuing/stacking).

## Frontend
- **Framework**: Expo (React Native).
- **Styling**: Tamagui (Shared UI Kit).

## Authentication
- **Library**: Better Auth.
- **Plugins**: 
    - `better-auth/convex`: DB adapter.
    - `better-auth/organization`: Permissions & Roles.

## Core Libraries
- **Functional**: Effect TS (Standard for error handling and flow).

## Backend & Data
- **Database**: Convex - Realtime document store.
- **Search**: Convex Native Vector Search.

## Rules
1. **Package Manager**: ALWAYS use `pnpm` for installing packages (`pnpm add`, `pnpm install`). Never use bun/npm.
2. **Task Runner**: USE `mise` tasks for all workflows. `package.json` scripts delegate to `mise` or `turbo`.
3. **Monorepo**: Respect `turbo.json` caching rules.