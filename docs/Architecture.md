# StyleSwipe Technical Architecture Specification

## 1. Vision & Strategy
StyleSwipe is a next-generation fashion discovery platform. The architecture must support two distinct shopping mentalities: an inspiration-heavy Discover Mode (Tinder-style) and a utility-heavy Shop Mode (Grid-based).

## 2. Monorepo & Tooling (The Stack)
* **Runtime**: Bun (Version 1.1+) for performance and workspace management.
* **Orchestration**: TurboRepo for intelligent caching and pipeline task execution.
* **Version Control**: Jujutsu (jj) for stacked diffs and parallel agent workflows.
* **Persistence**: Convex for a reactive document store and native vector search.
* **Cross-Platform**: Expo + Tamagui for iOS and Android deployment via EAS.

## 3. Bounded Contexts (DDD)
The system is divided into logical boundaries to ensure ubiquitous language and isolation:

* [cite_start]**Identity Context**: Manages the mandatory style profiling, Partner Sync sessions, and user style DNA[cite: 28, 106, 151].
* [cite_start]**Catalog Context**: Owns product metadata, price ingestion from scrapers, and category management[cite: 36].
* [cite_start]**Discovery Context**: Contains the swipe engine, vector-based recommendations, and preference weightings[cite: 29, 33].
* [cite_start]**Commerce Context**: Orchestrates the cart, checkout flow, and order history[cite: 43, 99].

## 4. Hexagonal Layering Rules
### Domain Layer
* Contains pure entities (Product, User, SwipeCard, StyleProfile).
* Defines Ports (Interfaces) for repositories and external services.
* Zero external dependencies.

### Application Layer
* Contains Use Cases (e.g., IngestScrapedProduct, ExecutePartnerSync, ProcessSwipe).
* Orchestrates domain entities to achieve a business goal.

### Infrastructure Layer (Adapters)
* **ConvexAdapter**: Implements the persistence ports.
* **PlaywrightAdapter**: Implements the scraper ports for Myntra/Ajio.
* **AuthAdapter**: Implements the Better Auth integration.

## 5. Directory Structure
/apps
  /consumer-app      # Expo Mobile Client
  /admin-panel       # Vite + React Operations Dashboard
  /scraper-service   # Standalone Bun Scraper Tool
/packages
  /core              # Business Logic (Catalog, Discovery, Identity, Commerce)
  /infrastructure    # Technology Adapters (Convex, Auth, Sentry)
  /ui-kit            # Tamagui  & Shared Components
/convex              # Global Schema and Backend Functions
/docs                # PRD, Architecture, and Agent Manifests

## 6. Version Control & Development Environment
* **Primary VCS**: Jujutsu (jj). Every agent task must start with `jj new` to create a fresh change in the stack.
* **Review Workflow**: Graphite. Completed tasks are submitted as stacked PRs via `gt create`.
* **Standardized Environment**: VS Code Dev Containers. This ensures the Bun version, Playwright dependencies, and Convex CLI are identical for the human architect and the AI agents.

## 7. Agent Collaboration & Git Protocol
* **Trunk-Based Stacking**: All features are built as incremental "stacks" on the `main` branch.
* **Jujutsu (jj) Snapshots**: Every agent must create a new change using `jj new -m "[Context]: Task Description"` to isolate its work.
* **Graphite (gt) Stacking**: Agents must use `gt create` to submit their change as a reviewable PR that depends on the previous PR in the stack.
* **Dependency Awareness**: If Agent B builds on Agent A's work, it must `jj rebase` its change on top of Agent A's latest commit to maintain the "Single Source of Truth."
* **Artifact Sharing**: Agents must check the `docs/manifests/` folder for current PR IDs and shared types before starting a task.


## 8. Converged Path & Shared Component Governance
* [cite_start]**Shared Logic**: Converged paths (e.g., ProductDetailScreen, CartScreen) must reside in a 'shared' directory within the respective app folder[cite: 148, 198, 208].
* [cite_start]**Feature Flags for Overlaps**: If two agents are modifying the same shared screen, they must use Feature Flags to isolate their changes during development[cite: 195].
* **Atomic Locking**: Agents must signal in the 'current_stack.md' manifest when they are performing breaking changes to core ports or the shared UI-kit.

## 9. Design System Governance (@app/ui-kit)
* **Framework**: Tamagui (for optimized cross-platform performance).
* **Styling Strategy**: Utility-first with a defined Token System (Colors, Spacing, Radius, Z-Index).
* **Component Policy**: Atomic design. Every component must be generic and themeable.
* **Visual Direction**: Modern Indian e-commerce aesthetic (Clean, Vibrant, Mobile-First).