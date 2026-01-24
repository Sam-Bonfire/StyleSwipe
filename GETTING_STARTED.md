# StyleSwipe Setup Documentation

## 1. Quick Start
The architecture supports a lightweight preview mode using Bun Native, bypassing heavy NPM dependencies for rapid verification.

### Run Preview
```bash
bun run apps/web-preview/src/index.ts
```
> **Note**: This runs a zero-dependency HTTP server directly on the Bun runtime.

## 2. Directory Structure
*   **apps/**: Contains the applications.
    *   **consumer-app**: The main React Native/Expo app (Requires full install).
    *   **web-preview**: Lightweight verification app.
*   **packages/**: Shared libraries.
*   **docs/**: Documentation and manifests.

## 3. Collaborative Workflow (Agents)
1.  **Check Manifest**: Look at `docs/manifests/current_stack.md`.
2.  **Start Task**: `jj new trunk() -m "feat(ctx): desc"`.
3.  **Submit**: `gt create`.
4.  **Sync**: `jj rebase -d trunk()`.

## 4. Troubleshooting
If `bun install` fails due to tarball extraction errors or OS mismatches:
1.  Use the lightweight `web-preview` app to verify the runtime.
2.  Check `.devcontainer/devcontainer.json` for extension compatibility.
3.  Clean cache with `bun pm cache rm`.
