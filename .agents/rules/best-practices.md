---
trigger: always_on
description: "High-value rules for UI consistency, testing, and environment safety"
globs: ["**/*"]
---

# Best Practices

## 1. The "Token-Only" Rule (UI/UX)
- **Context**: `packages/ui-kit` defines a strict theme system (`theme.ts`).
- **Rule**: **NEVER** use hardcoded values (e.g., `#CD0268`, `15px`). **ALWAYS** use tokens.
    - ❌ `color: "#CD0268"`
    - ✅ `color: "$primary"`
- **Why**: Ensures consistent branding and easy theming updates.

## 2. The "Centralized Testing" Rule
- **Context**: Tests must be discoverable and organized by type.
- **Rule**: All tests must reside in a top-level `tests/` directory within their package/app. **NEVER** co-locate `.test.ts` files with `src/`.
    - `packages/core/tests/unit/`
    - `apps/consumer-app/tests/e2e/`
- **Why**: Keeps strict separation between source and validation logic.

## 3. The "Type-Safe Env" Rule
- **Context**: Environment variables are critical for configuration.
- **Rule**: Access environment variables **ONLY** through a validated config object (using Zod), never directly via `process.env` in application code.
- **Why**: Fails fast at startup with clear errors instead of crashing randomly in production.

## 4. The "Agent Context" Rule
- **Context**: Agents work across multiple workspaces with different constraints.
- **Rule**: Before modifying any package, an agent **MUST** read that package's `README.md` or `package.json` to understand local constraints (dependencies, scripts, etc.).