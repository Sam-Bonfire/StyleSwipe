---
description: "Strict Hexagonal Layering Rules and Dependency Enforcement"
globs: ["packages/**/*", "apps/**/*"]
---

# Architecture Rules

StyleSwipe enforces a strict **Hexagonal Architecture**. We separate the "Brain" of the app from the "Tools" it uses.

## 1. The Core: `packages/core` (The Center)
This is the heart of the hexagon.
- **Contents**: 
  - **Entities**: `StyleDNA` logic (in `src/*/domain`), `User` entities, `VectorMath`.
  - **Business Rules**: Pure logic.
- **Strict Rule**: **"Pure TS"**.
  - ❌ **NO** external dependencies: `convex`, `react`, `expo`, `tamagui`.
  - ✅ **Allowed**: Standard Library, Zod, Effect.
- **Why**: Represents the "Product" rather than the "Tech". Must be testable in isolation (millisec unit tests).

## 2. The Ports: `packages/core` (The Orchestrator)
Located in `src/*/application` within `packages/core`.
- **Contents**:
  - **Interfaces (Ports)**: `IProductRepository`, `IAuthService`.
  - **Use Cases**: `CalculateStyleMatch`, `ProcessUserSwipe`.
- **Strict Rule**:
  - Acts as the gatekeeper.
  - Tells the app *what* to happen, not *how*.
  - **Dependency**: `Application -> Domain`.

## 3. The Adapters: `packages/infrastructure` & `apps/` (The Outside)
These are the implementations that plug into the ports.

### `apps/consumer-app` & `apps/admin-panel` (UI Adapters)
- **Role**: Captures user gestures.
- **Strict Rule**: Import `Core` (Application layer). **NEVER** contain raw business math.

### `apps/scraper-service` (Ingestion Adapter)
- **Role**: Converting external data to Domain Entities.

### `packages/infrastructure` (Persistence Adapter)
- **Role**: Implements Interfaces (e.g., `ConvexProductRepository`).
- **Strict Rule**: The **ONLY** layer allowed to import `convex` libraries.
- **Dependency**: `Infrastructure -> Core`.

## 4. Physical Enforcement

| Package | Allowed `dependencies` | Prohibited `dependencies` |
| :--- | :--- | :--- |
| **`core`** | `none` (Std, Zod, Effect) | `convex`, `react`, `expo`, `tamagui`, `ui-kit` |
| **`infrastructure`** | `core`, `convex`, `better-auth` | `none` |
| **`ui-kit`** | `tamagui`, `react` | `core`, `infrastructure`, `convex` |
| **`apps/consumer-app`** | `core`, `infra`, `ui-kit` | Direct SQL or DB drivers |
| **`apps/admin-panel`** | `core`, `infra`, `ui-kit` | Direct SQL or DB drivers |
| **`apps/scraper`** | `core`, `infra` | `ui-kit`, `react` |
