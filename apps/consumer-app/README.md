# @app/consumer-app (The UI Adapter)

## Vision
The primary interface for users. Supports **iOS**, **Android**, and **Web** via Expo.
**Role**: A "Dumb" UI Adapter.

## Architectural Rules
1.  **Logic Delegation**:
    *   **UI**: Renders data from Props.
    *   **Logic**: Calls `@app/core` Use Cases (e.g., `ExecuteSwipe`).
    *   **State**: Uses `@app/infrastructure` hooks (e.g., `useQuery(api.products.get)`).
2.  **No Business Match**: Never calculate StyleDNA or matches here. Pass inputs to Core.

## Development
```bash
# Run on all platforms
bun run start
```

## Stack
*   **Framework**: Expo (React Native).
*   **Styling**: Tamagui (`@app/ui-kit`).
*   **Backend**: Convex (`@app/infrastructure`).
