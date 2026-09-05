---
trigger: always_on
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
const cart =
  yield *
  _(
    Effect.tryPromise({
      try: () => this.repo.findByUserId(userId),
      catch: (e) => new RepositoryError('findByUserId', e),
    }),
  );

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

### 2f. Port Definitions (core/shared/application/ports.ts)

Ports MUST use `Context.Tag` and return `Effect.Effect`:

```typescript
// ✅ CORRECT: Port with Effect returns and Context.Tag
export class ProductRepository extends Context.Tag('ProductRepository')<
  ProductRepository,
  {
    readonly findById: (id: string) => Effect.Effect<Product | null, RepositoryError>;
    readonly create: (product: Omit<Product, 'id'>) => Effect.Effect<Product, RepositoryError>;
  }
>() {}

// ❌ WRONG: Promise-based port
export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
}
```

### 2g. Infrastructure Adapters (packages/infrastructure)

Adapters MUST wrap external calls with `Effect.tryPromise` and create `Layer`s:

```typescript
// ✅ CORRECT: Layer-based adapter
export const ProductRepositoryLive = Layer.succeed(
  ProductRepository,
  {
    findById: (id: string) => Effect.tryPromise({
      try: () => client.query(api.products.getById, { id }),
      catch: (e) => new RepositoryError(String(e), e),
    }),
  }
);

// ❌ WRONG: Class-based adapter returning Promise
export class ConvexProductRepository {
  async findById(id: string): Promise<Product | null> { ... }
}
```

### 2h. App Boundaries (apps/\*, infrastructure hooks)

Apps and hooks call core use cases via `Effect.runPromise` or `Effect.runSync`:

```typescript
// ✅ CORRECT in hooks or React components
const result = await Effect.runPromise(useCase.execute(args));

// ✅ CORRECT for pure synchronous Effects
const profile = Effect.runSync(initializeStyleProfile(answers));

// ❌ WRONG: Importing core and calling as plain function
const profile = initializeStyleProfile(answers);
```

### 2i. Queue & Infrastructure Types

All queue-consuming code MUST use `QueueService<T>` (not the old `Queue<T>`):

```typescript
// ✅ CORRECT: QueueService with Effect methods
queue: QueueService<ScrapedProduct>;
await Effect.runPromise(queue.pushBatch(items));

// ❌ WRONG: Old Queue interface with Promise
queue: Queue<ScrapedProduct>;
await queue.pushBatch(items);
```

## 3. Definition of Done

- **Linting**: A task is **NOT COMPLETE** until all linting issues are resolved.
   - Run `mise run lint` to verify.
- **Documentation**: Whenever major changes are made, associated documentation (architecture, READMEs) **MUST** be updated immediately.
