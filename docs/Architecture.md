# StyleSwipe Technical Architecture Specification

## 1. Vision & Core Strategy

StyleSwipe is a next-generation fashion discovery platform supporting two distinct shopping mentalities: an inspiration-heavy **Discover Mode** (Tinder-style) and a utility-heavy **Shop Mode** (Grid-based). The architecture is designed for **maximum solo-developer velocity** using AI-agent collaboration.

## 2. The High-Velocity Stack

We utilize an industrial-grade toolset to eliminate traditional Git bottlenecks and minimize manual overhead.

- **Runtime**: **Bun (v1.2+)** for high-performance execution.
- **Task Runner**: **Mise** for consistent environment and workflow execution.
- **Orchestration**: **TurboRepo** for intelligent caching and pipeline execution.
- **Auth**: **Better Auth** (with Convex & Organization plugins).
- **Core Libs**: **Effect TS** for functional error handling.
- **Primary VCS**: **Git** (via **Graphite CLI** for stacking).
- **Persistence**: **Convex** for a reactive document store and native vector search.
- **Frontend**: **Expo + Tamagui** for iOS and Android deployment via EAS.

## 3. Hexagonal Layering Rules (The Physical Enforcement)

In our monorepo, the **Hexagonal Architecture** isn't just a conceptual idea—it is physically enforced by the folder structure. By separating the "Brain" of the app from the "Tools" it uses, we ensure that the core fashion logic remains testable and portable.

Here is how the layers are distributed across our physical packages.

### 1. The Core: `packages/core` (The Center)

This is the heart of the hexagon. It contains the **Entities** (Domain) and **Business Rules**.

*   **Contents**: `StyleDNA` logic (in `src/*/domain/StyleDNA.ts`), `User` entities, and `VectorMath` utilities.
*   **The Rule**: This package is **"Pure TS."** It must not import from any other package in the monorepo. It cannot use `convex/*`, `react`, or `tamagui`.
*   **Why**: If we decide to replace the mobile app with a web app, or swap Convex for another database, this folder remains untouched. It represents the "Product" rather than the "Tech."

### 2. The Ports: `packages/core` (The Orchestrator)

This layer (residing in `src/*/application`) defines the **interfaces** (Ports) and **Use Cases** that the core needs to talk to the outside world.

*   **Contents**:
    *   **Interfaces**: `IProductRepository`, `IAuthService`, `IVectorStore`.
    *   **Use Cases**: `CalculateStyleMatch.ts`, `InitializeStyleProfile.ts`.
*   **The Rule**: It acts as the gatekeeper. It tells the app *what* needs to happen (e.g., "Save this swipe"), but it doesn't know *how* it happens (e.g., "via a Convex mutation").
*   **Dependency Path**: `Application -> Domain`.

### 3. The Adapters: `packages/infrastructure` & `apps/` (The Outside)

These are the implementations (Adapters) that plug into the ports defined above.

#### **`apps/consumer-app` (The Primary Input)**
*   **Role**: The UI Adapter (Mobile/Web).
*   **Rule**: It captures user gestures (Tamagui) and passes them to the **Application** layer.
*   **Dependencies**: `core`, `infrastructure`, `ui-kit`.

#### **`apps/admin-panel` (Operations)**
*   **Role**: Internal Dashboard (Vite).
*   **Rule**: Manages the system via Core Use Cases.
*   **Dependencies**: `core`, `infrastructure`, `ui-kit`.

#### **`apps/scraper-service` (Data Ingestion)**
*   **Role**: Autonomous Service.
*   **Rule**: Fetches external data and adapts it to Domain Entities.
*   **Dependencies**: `core`, `infrastructure`.

#### **`packages/infrastructure` (The Primary Persistence)**
*   **Role**: The Persistence Adapter.
*   **Contents**: `ConvexAdapter`, `AuthAdapter`.
*   **Rule**: This is where `IProductRepository` is actually implemented. It talks to the Convex cloud.
*   **Dependency Path**: `Infrastructure -> Core (Application/Domain)`.

## 4. Physical Enforcement in the Monorepo

To a developer exploring the code, the rules are visible in the `package.json` of each workspace:

| Package | Allowed `dependencies` | Prohibited `dependencies` |
| :--- | :--- | :--- |
| **`core`** | `none` (Standard library, Zod, Effect) | `convex`, `react`, `expo`, `tamagui`, `ui-kit` |
| **`infrastructure`** | `core`, `convex`, `better-auth` | `none` (This layer is the "glue") |
| **`ui-kit`** | `tamagui`, `react` | `core`, `infrastructure`, `convex` (Pure UI) |
| **`apps/consumer-app`** | `core`, `infrastructure`, `ui-kit` | Direct SQL or DB drivers |
| **`apps/admin-panel`** | `core`, `infrastructure`, `ui-kit` | Direct SQL or DB drivers |
| **`apps/scraper-service`** | `core`, `infrastructure` | `react`, `tamagui`, `ui-kit` (Headless) |

## 5. Summary of Rules for Developers

*   **Directional Flow**: Dependencies only move inward. You can import `Core` into `Mobile`, but you can never import `Mobile` into `Core`.
*   **Interface Dependency**: The `Application` layer should depend on **interfaces**, not **classes**.
*   **Testability**: You should be able to run unit tests on the entire `Core` package in milliseconds using `bun test` without mocking a database or starting an Expo server.

## 6. The "Single Command" Workflow

All development activity, whether by the human architect or AI agents, must use the following `mise` tasks to maintain VCS integrity and remote backups.

| Phase        | Command       | Logic                                                     |
| ------------ | ------------- | --------------------------------------------------------- |
| **Start**    | `mise run task`    | `gt branch create` (Stacked Branching).                   |
| **Snapshot** | `mise run snap`    | Structured Commit + Push (Remote Backup).                 |
| **Deliver**  | `mise run submit`  | `turbo lint/test` + `gt stack submit`.                    |
| **Release**  | `mise run release` | `bun version patch` + `git tag` + `git push`.             |
