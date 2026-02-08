# @app/ui-kit (The Design System)

## Vision
Shared, consistent UI primitives for Web and Mobile. Built with **Tamagui**.

## The "Token-Only" Rule
**Constraint**: Developers and Agents must **NEVER** use hardcoded hex values or pixels.
*   ❌ `color: "#CD0268"` / `padding: 20`
*   ✅ `color: "$primary"` / `padding: "$3"`

## Components
*   **Location**: `src/components/`
*   **Theme**: `src/theme.ts` (Validates tokens).

## Dependencies
*   **Allowed**: `tamagui`, `react`.
*   **Prohibited**: `convex`, `@app/core` (Keep UI dumb).
