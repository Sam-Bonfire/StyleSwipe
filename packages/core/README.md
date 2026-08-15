# @app/core (The Brain)

## Vision
This package is the **Hexagonal Center** of StyleSwipe. It contains all **Domain Entities**, **Business Logic**, and **Port Interfaces**.

**It represents the "Product", independent of any technology.**

## Strict Constraints (The "Zero Dependency" Rule)
*   **Allowed**: `zod`, `effect`, `fast-check`, native TS.
*   **FORBIDDEN**: 
    *   ❌ `convex` (No database coupling)
    *   ❌ `react` / `react-native` (No UI coupling)
    *   ❌ `expo` (No framework coupling)

## Structure
*   `src/*/domain`: Pure Entities (e.g., `StyleDNA`, `User`).
*   `src/*/application`: Use Cases (e.g., `CalculateStyleMatch`) and Port Interfaces (`IProductRepository`).

## Testing Strategy
*   **Must** have unit tests for all logic.
*   **Run**: `bun test --filter @app/core`.
*   **Goal**: 100% Logic Coverage, running in milliseconds.
