# StyleSwipe Monorepo

> **Vision**: A next-generation fashion discovery platform combining Tinder-style discovery with utility-focused shopping. Built for high-velocity solo development using AI Agents.

## Architecture: Hexagonal Monorepo

We strictly enforce a **Hexagonal Architecture** (Ports & Adapters) to separate the "Brain" (Core) from the "Tools" (Infrastructure/UI).

| Layer | Package | Role | Constraints |
| :--- | :--- | :--- | :--- |
| **Core** | `@app/core` | **The Brain**. Pure Business Logic & Entities. | ❌ NO external deps (Convex, React). <br> ✅ Std Lib, Zod, Effect. |
| **Ports** | `@app/core` | **The Gatekeeper**. Interfaces & Use Cases. | Defined in `core`, implemented in `infra`. |
| **Adapters** | `@app/infrastructure` | **Persistence**. Implements Core Interfaces. | ✅ Can import `convex`, `better-auth`. |
| **Adapters** | `@app/consumer-app` | **UI**. Captures gestures, calls Core Use Cases. | ❌ NO business logic. ✅ `tamagui`. |

## "Single Command" Workflow

We use **Mise** to standardize environments and **Graphite** for stacked changes.

### 1. Start
```bash
# Creates a new stacked branch (slugifies title)
mise run task feat "My New Feature"
```

### 2. Snapshot (Work in Progress)
```bash
# Structured commit without a PR (commit-only; push explicitly for backup)
# NEVER use `git commit` manually
mise run snap feat "Refactoring auth"
```

### 3. Deliver
```bash
# Verify first, then submit stack to GitHub (submit does not run lint/test)
mise run lint && mise run test && mise run submit
```

### 4. Release
```bash
# Version bump and tag
mise run release
```

## Agent Instructions

If you are an AI Agent working in this repo:
1.  **Read the Rules**: Check `.agents/rules/` before touching code.
2.  **Respect Boundaries**: Do not import `convex` into `core`. Do not put logic in `ui-kit`.
3.  **Use Tokens**: Never hardcode colors in `ui-kit`.
4.  **Test Core**: All logic in `@app/core` must have unit tests.

## Setup

1.  **Install Tools**: `mise install` (Installs pnpm, Node, Graphite).
2.  **Install Deps**: `pnpm install` (or `mise run init`).
3.  **Run Dev**: `mise run dev` (Starts Convex, Expo, and Admin).

## CI/CD Secrets

To run the Continuous Native Generation (CNG) pipeline, you must add the following secrets to your GitHub repository:
- `ANDROID_KEYSTORE_BASE64`: Base64 encoded release keystore
- `ANDROID_KEYSTORE_PASSWORD`: Password for the keystore
- `ANDROID_KEY_ALIAS`: Alias for the key
- `ANDROID_KEY_PASSWORD`: Password for the key
- `IOS_CERTIFICATE_BASE64`: Base64 encoded p12 certificate
- `IOS_CERTIFICATE_PASSWORD`: Password for the p12 certificate
- `IOS_PROVISIONING_PROFILE_BASE64`: Base64 encoded mobileprovision file
