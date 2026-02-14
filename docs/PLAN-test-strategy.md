# Test Strategy: Missing Tests Audit

## Problem

Only **6 test files** exist across the entire monorepo. Major packages and all apps have **zero** test coverage. A single refactor to shared code could silently break multiple packages without any safety net.

## Current Coverage

| Package / App | Test Files | Status |
|:---|:---:|:---|
| `packages/core` | 4 | `TaggingService`, `Cart`, `CheckoutService`, `StyleDNA` |
| `apps/scraper-service` | 2 | `MyntraScraper`, `ScraperWorker` |
| `packages/infrastructure` | 0 | ❌ **14 adapters untested** |
| `packages/logger` | 0 | ❌ |
| `packages/ui-kit` | 0 | ❌ |
| `apps/consumer-app` | 0 | ❌ |
| `apps/admin-panel` | 0 | ❌ |

---

## Phase 1: Core Domain Unit Tests (Priority: 🔴 Critical)

> Pure business logic with zero external deps. Fastest ROI. Should run in < 500ms total.

**Test Runner:** `bun test` (already configured)

### 1.1 `PriceEstimator` — [PriceEstimator.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/commerce/domain/PriceEstimator.ts)
| Test Case | Why |
|:---|:---|
| Subtotal below threshold → shipping = ₹100 | Core pricing logic |
| Subtotal ≥ ₹1000 → free shipping | Threshold boundary |
| Tax = 5% of subtotal | Tax calculation |
| Total = subtotal + shipping + tax - discount | Aggregation correctness |
| Empty cart → all zeros | Edge case |

### 1.2 `Order` / `OrderItem` — [Order.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/commerce/domain/Order.ts)
| Test Case | Why |
|:---|:---|
| `OrderItem.total` = price × quantity | Derived property |
| Order defaults to `PENDING` status | State initialization |
| Order `createdAt` defaults to `Date.now()` | Timestamp default |

### 1.3 `ManageCart` (Use Case) — [ManageCart.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/commerce/application/ManageCart.ts)
| Test Case | Why |
|:---|:---|
| `addToCart` creates new cart if none exists | Happy path |
| `addToCart` reuses existing cart | Idempotency |
| `removeFromCart` throws on missing cart | Error path |
| `updateQuantity` persists change | Mutation correctness |
| `clearCart` delegates to repo | Delegation |

> **Requires:** Mock `CartRepository` (simple interface with 3 methods)

### 1.4 `ProcessSwipe` (Effect) — [ProcessSwipe.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/discovery/application/ProcessSwipe.ts)
| Test Case | Why |
|:---|:---|
| Valid input → returns input | Happy path |
| Empty `userId` → `SwipeError` | Validation |
| Empty `productId` → `SwipeError` | Validation |

> **Requires:** `Effect.runPromise` / `Effect.runPromiseExit` for assertions

### 1.5 `SearchProducts` (Effect) — [SearchProducts.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/discovery/application/SearchProducts.ts)
| Test Case | Why |
|:---|:---|
| Query < 3 chars → empty results | Short circuit |
| Valid query → calls embedder then repo | Integration flow |
| Embedder failure → propagates `EmbeddingError` | Error propagation |
| `getSuggestions` with empty query → `[]` | Edge case |

> **Requires:** Mock `Embedder` and `ProductSearchRepository` ports

### 1.6 `InitializeStyleProfile` — [InitializeStyleProfile.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/identity/application/InitializeStyleProfile.ts)
| Test Case | Why |
|:---|:---|
| Maps `gender` answer correctly (lowercase) | String normalization |
| Missing gender → defaults to `'both'` | Default handling |
| Maps `vibe` to array | Data transformation |
| Missing vibe → empty array | Edge case |
| Returns empty `preferenceVector` | Contract |

### 1.7 `GetOnboardingQuestions` — [GetOnboardingQuestions.ts](file:///home/sam/projects/StyleSwipe/packages/core/src/identity/application/GetOnboardingQuestions.ts)
| Test Case | Why |
|:---|:---|
| Returns exactly 5 questions | Contract stability |
| Each question has `id`, `question`, `options` | Shape validation |
| Question IDs are unique | Data integrity |

**Estimated files:** 7 new test files  
**Location:** `packages/core/tests/unit/`

---

## Phase 2: Infrastructure Integration Tests (Priority: 🟡 High)

> Tests that adapters correctly implement their port interfaces. Uses mocked Convex client.

**Test Runner:** `vitest` (already in devDeps)

### What to Test

| Adapter | File | Key Tests |
|:---|:---|:---|
| `ConvexCartRepository` | `commerce/ConvexCartRepository.ts` | CRUD operations, user isolation |
| `AuthAdapter` | `auth/AuthAdapter.ts` | Sign-in URL construction, token handling |
| `EmbedderAdapter` | `embedder/EmbedderAdapter.ts` | Vector generation, error wrapping |
| `QueueAdapter` | `queue/QueueAdapter.ts` | Enqueue/dequeue, retry logic |

### Strategy
- Mock the Convex client (`ConvexHttpClient`) at the boundary
- Test that adapters translate domain objects ↔ Convex documents correctly
- Test error handling (network failures, missing data)

**Estimated files:** 4 new test files  
**Location:** `packages/infrastructure/tests/integration/`

---

## Phase 3: Scraper Service Tests (Priority: 🟡 High)

> Expand existing test coverage for untested modules.

### What to Test

| Module | Key Tests |
|:---|:---|
| `BaseScraper` | Abstract scraping contract, retry logic |
| `VectorizationService` | Vector generation, dimension validation |
| `server.ts` (API routes) | HTTP endpoint responses (Hurl tests exist) |
| `workers/` | Job processing, error recovery |

**Estimated files:** 3 new test files  
**Location:** `apps/scraper-service/tests/unit/`

---

## Phase 4: Logger Package (Priority: 🟢 Medium)

> Ensure logging abstraction is reliable.

| Test Case | Why |
|:---|:---|
| Log levels filter correctly | Configuration |
| Batch flush triggers at threshold | Performance contract |
| Device context is populated | Data completeness |

**Estimated files:** 1 new test file  
**Location:** `packages/logger/tests/unit/`

---

## Phase 5: UI Component Tests (Priority: 🟢 Medium — Future)

> Rendered component tests for `packages/ui-kit`. Deferred because:
> 1. Requires `@testing-library/react-native` setup
> 2. UI is still evolving rapidly
> 3. Visual regression is better caught by E2E

### When to Add
- After UI stabilizes (post-MVP)
- Focus on interactive components: `Button`, `ToastProvider`, `SwipeCardStack`

---

## Phase 6: E2E Tests (Priority: 🔵 Future)

> Full user journey tests. Deferred until deployment pipeline is stable.

| Flow | App |
|:---|:---|
| Onboarding → Swipe → Add to Cart → Checkout | `consumer-app` |
| Login → View Products → Manage Jobs | `admin-panel` |
| Trigger Scrape → Verify Products in DB | `scraper-service` |

---

## Verification Plan

### Automated
```bash
# Run all tests across the monorepo
turbo run test

# Run specific package tests
bun test --cwd packages/core
bun test --cwd packages/infrastructure
bun test --cwd apps/scraper-service
```

### Success Criteria
- [ ] All Phase 1 tests pass with `bun test`
- [ ] All Phase 2 tests pass with `vitest`
- [ ] No regressions in existing 6 test files
- [ ] `turbo run test` exits 0 across all packages
- [ ] CI pipeline runs tests before Docker build

---

## Summary

| Phase | New Files | Estimated Tests | Priority |
|:---|:---:|:---:|:---|
| 1. Core Unit | 7 | ~35 | 🔴 Critical |
| 2. Infra Integration | 4 | ~20 | 🟡 High |
| 3. Scraper Expansion | 3 | ~12 | 🟡 High |
| 4. Logger | 1 | ~5 | 🟢 Medium |
| 5. UI Components | — | — | 🟢 Future |
| 6. E2E | — | — | 🔵 Future |
| **Total** | **15** | **~72** | |

> [!IMPORTANT]
> **Recommended starting point:** Phase 1 (Core Unit Tests). These test pure business logic with zero setup overhead and will catch the most damaging regressions.
