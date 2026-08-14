# Handoff Report — Notion Task Ingestion & Architectural Mapping (Explorer M1_3)

## 1. Observation
- **Original Prompt Request**: `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md` lines 36-71 details Requirement R1 (Automatic Task Ingestion):
  - PM agent queries StyleSwipe Notion database for earliest scheduled task in "Next Up" state.
  - PM updates task status to "In Progress" and extracts technical spec.
- **Codebase Structure Analyzed**:
  - `packages/core`: Standardized Hexagonal Architecture core domain logic & ports.
    - Ports definition: `packages/core/shared/application/ports.ts` uses `Context.Tag` and returns `Effect.Effect<T, Error>` for all ports (e.g. `ProductRepository`, `UserRepository`, `AuthService`, `ScraperRepository`).
    - Tagged error definition: `packages/core/shared/domain/errors.ts` uses tagged error classes (`RepositoryError`, `AuthError`) with `readonly _tag` discriminant.
    - Use-cases in `src/*/application/` return `Effect.Effect`.
  - `packages/infrastructure`:
    - Repository adapters in `src/convex/repositories/` and `src/auth/` implement core ports wrapping external calls in `Effect.tryPromise` and export Layer constructors (e.g., `createProductRepositoryLayer`).
    - React hooks exported via `src/hooks/index.ts` (e.g., `useDiscovery`, `useCart`, `useProducts`, `admin/useScraperJobs`) bridge application boundaries via `Effect.runPromise`.
  - `apps/consumer-app`: React Native / Expo application with tab routing (`app/(app)/(tabs)`) calling infrastructure hooks.
  - `apps/admin-panel`: Expo / Web dashboard for monitoring platform stats, products, jobs, and organizations.
  - `packages/ui-kit`: Shared UI components (`components/SwipeCardStack.tsx`, `FashionCard.tsx`, `Button.tsx`, `Toast.tsx`) adhering to Tamagui and design system guidelines.
- **Rules Compliance**:
  - `.agents/rules/coding-standards.md`: Mandates strict typing (no `any`), tagged errors (`readonly _tag`), `Effect.Effect` return types for all core use-cases and ports, and `Layer` abstractions for infrastructure.

---

## 2. Logic Chain
1. **From Requirement R1 to Hexagonal Architecture**:
   - The Notion task ingestion requirement is a domain & infrastructure integration capability.
   - Per project coding standards, Notion API interactions must NOT be directly called inside application code or domain logic. Instead, Notion interactions must be modeled as a Port in `packages/core` and implemented as an Adapter in `packages/infrastructure`.
2. **Entity & Port Design**:
   - In `packages/core/src/tasks/domain/NotionTask.ts`, define `NotionTask` entity (`id`, `title`, `status`, `priority`, `area`, `requirements`, `specDetails`, `createdAt`, `updatedAt`).
   - In `packages/core/shared/application/ports.ts` (or `packages/core/src/tasks/application/NotionTaskRepository.ts`), define `NotionTaskRepository` port using `Context.Tag`.
   - Define tagged error classes `NotionTaskIngestionError` and `SpecExtractionError` in `packages/core/shared/domain/errors.ts` (or `src/tasks/domain/errors.ts`).
3. **Use-Case Execution Flow**:
   - `IngestEarliestNextUpTask`: Queries `NotionTaskRepository.findNextUpTask()`, executes `NotionTaskRepository.updateTaskStatus(taskId, 'In Progress')`, and produces `NotionTask`.
   - `GenerateTechnicalSpec`: Converts `NotionTask` into structured `TechnicalSpec` mapping target layer (`packages/core`, `packages/infrastructure`, `apps/consumer-app`, `apps/admin-panel`, `packages/ui-kit`).
4. **Infrastructure Adapter Design**:
   - In `packages/infrastructure/src/notion/NotionTaskRepositoryAdapter.ts`, implement `NotionTaskRepository` using Notion API client / MCP calls wrapped with `Effect.tryPromise`.
   - Map Notion database page properties (title, select, rich_text, status) to `NotionTask` entity.
5. **App / Pipeline Boundary**:
   - Call `Effect.runPromise(ingestEarliestNextUpTask.execute())` from the PM automation script / Admin panel boundary.

---

## 3. Caveats
- **Notion Workspace API Connection**: Real-time Notion API querying depends on workspace API token configuration or Notion MCP endpoint availability. If Notion MCP tools are executed via sidecar or CLI script, the adapter will delegate to `NotionTaskRepositoryAdapter`.
- **Scope Assumption**: This handoff report provides the architectural mapping and technical spec formulation. Code implementation is designated for Milestone 2.

---

## 4. Conclusion
The Notion task requirement maps cleanly onto StyleSwipe's Hexagonal Architecture:
- **Port**: `NotionTaskRepository` in `packages/core`.
- **Entity**: `NotionTask` and `TechnicalSpec` in `packages/core`.
- **Use Cases**: `IngestEarliestNextUpTask`, `GenerateTechnicalSpec`, `UpdateTaskStatus` in `packages/core`.
- **Adapter**: `NotionTaskRepositoryAdapter` in `packages/infrastructure` wrapping Notion API calls with `Effect.tryPromise`.
- **Hooks & App Boundary**: `useNotionTasks` hook in `packages/infrastructure/src/hooks/` and CLI/Admin presentation layer.

---

## 5. Verification Method
1. **Verification Command**:
   - Run `mise run lint` (or `bun lint`) across the workspace to ensure zero lint or type errors.
2. **Files to Inspect**:
   - `packages/core/shared/application/ports.ts`
   - `packages/core/shared/domain/errors.ts`
   - `packages/infrastructure/src/convex/repositories/ProductRepository.ts` (reference adapter pattern)
3. **Invalidation Conditions**:
   - Any raw `Promise` returns in core ports.
   - Any untyped `any` or untagged `throw new Error()` in core/infrastructure logic.
