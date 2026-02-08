# @app/infrastructure (The Adapters)

## Vision
This package serves as the **Persistence Adapter** for StyleSwipe. Its sole job is to implement the **Port Interfaces** defined in `@app/core` using concrete technologies (Convex, Better Auth).

## Responsibilities
1.  **Implement Repositories**: e.g., `ConvexProductRepository` implements `IProductRepository`.
2.  **Database Config**: Defines the `convex/schema.ts`.
3.  **Auth Integration**: Configures Better Auth with Convex.

## Dependencies
*   ✅ Imports `@app/core` (to implement interfaces).
*   ✅ Imports `convex`, `better-auth`.
*   ❌ **NEVER** import UI logic (`tamagui`, `react-native`).

## Deployment
Deployed automatically to Convex Cloud via `npx convex deploy`.
