---
trigger: always_on
description: "Strict coding standards for Type Systems, Effect TS, and Code Quality"
globs: ["**/*.ts", "**/*.tsx"]
---

# Coding Standards

## 1. Type Safety (The "Strict Typing" Pact)
- **Applicability**: This rule applies EQUALLY to **Humans** and **AI Agents**.
- **Rule**: Maintain type safety at ALL costs.
- **Prohibited**: Do NOT default to `any`.
    - ❌ `data: any`
    - ❌ `as any` (Strictly forbidden unless no other option exists; must be commented).
    - **Enforcement**: The `no-explicit-any` ESLint rule is enabled in `infrastructure` and `core` packages.
- **Requirement**: Use robust, specific types.
    - **Validation**: MUST use **Zod** wherever runtime validation is applicable (Forms, Configs, API Responses, Env Vars) across **ALL** apps and packages (`core`, `infra`, `ui-kit`, `apps/*`).
    - **Definitions**: distinct Interfaces/Types for all Entities.

## 2. Functional Programming (Effect TS)
- **Library**: `Effect` (effect.website).
- **Scope**: ALL use cases in `packages/core/src/*/application/` MUST use Effect.
- **Rule**: Use the Effect library for:
    - Error Handling (avoid `try/catch`).
    - Dependency Injection.
    - Async flow control.

### 2a. Tagged Error Types (Mandatory)
Every domain context MUST define its own tagged error types:
```typescript
// ✅ CORRECT: Tagged error with _tag discriminant
export class CartNotFoundError {
  readonly _tag = 'CartNotFoundError' as const;
  constructor(readonly userId: string) {}
}

// ❌ WRONG: Generic Error or throw
throw new Error('Cart not found');
```

### 2b. Use Case Return Types (Mandatory)
Use cases MUST return `Effect.Effect<Success, ErrorType>`, never `Promise<T>`:
```typescript
// ✅ CORRECT: Typed error channel
removeFromCart(userId: string, productId: string): Effect.Effect<Cart, CartNotFoundError | RepositoryError>

// ❌ WRONG: Invisible errors
async removeFromCart(userId: string, productId: string): Promise<Cart>
```

### 2c. Wrapping Repository Calls
Repository ports currently use `Promise`. Wrap them with `Effect.tryPromise`:
```typescript
// ✅ CORRECT
const cart = yield* _(Effect.tryPromise({
  try: () => this.repo.findByUserId(userId),
  catch: (e) => new RepositoryError('findByUserId', e),
}));

// ❌ WRONG: Raw await in use case
const cart = await this.repo.findByUserId(userId);
```

### 2d. Running Effect at Boundaries
Apps (consumer-app, admin-panel) call use cases via `Effect.runPromise`:
```typescript
// ✅ At the UI boundary
await Effect.runPromise(manageCart.addToCart(userId, item));
```

### 2e. Anti-Patterns (PROHIBITED in core)
- ❌ `throw new Error(...)` — use `Effect.fail(new TaggedError(...))`
- ❌ `try/catch` — use `Effect.catchTag` or `Effect.catchAll`
- ❌ `async/await` with `Promise` — use `Effect.gen` with `yield*`
- ❌ Untyped errors — every failure MUST have a tagged error class

## 3. Definition of Done
- **Linting**: A task is **NOT COMPLETE** until all linting issues are resolved.
    - Run `mise run lint` (or `bun lint`) to verify.
- **Documentation**: Whenever major changes are made, associated documentation (architecture, READMEs) **MUST** be updated immediately.