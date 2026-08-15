# @app/admin-panel (The Operations Adapter)

## Vision
Internal dashboard for Merchandising and System Operations.
**Role**: A Web-only UI Adapter.

## Architectural Rules
1.  **Logic Delegation**: Calls `@app/core` Use Cases.
2.  **No Direct DB Access**: Must go through generic Core Interfaces or Infra Adapters.

## Development
```bash
# Run web client
bun run dev
```

## Stack
*   **Framework**: Vite + React.
*   **Styling**: Tamagui (`@app/ui-kit`).
