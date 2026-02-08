---
trigger: always_on
description: "Core technology stack and toolchain rules"
globs: ["**/*"]
---

# Technology Stack

## Core Tools
- **Runtime**: Bun (v1.2+) - Used for package management and script execution.
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
1. **Package Manager**: ALWAYS use `bun` for installing packages (`bun add`, `bun install`).
2. **Task Runner**: USE `mise tasks` for all workflows. `bun` scripts should delegate to `mise`.
3. **Monorepo**: Respect `turbo.json` caching rules.