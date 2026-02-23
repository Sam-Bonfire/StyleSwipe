---
trigger: always_on
description: 'Directory structure and organization rules'
globs: ['**/*']
---

# Project Structure

## Map

- **`/apps`**: Deployable applications.
  - `consumer-app`: Mobile/Web client (Expo).
  - `admin-panel`: Internal dashboard (Vite).
  - `scraper-service`: Data ingestion service (Bun).
- **`/packages`**: Shared libraries.
  - `core`: Domain logic (Pure TS).
  - `infrastructure`: Adapters (Convex, Auth).
  - `ui-kit`: Shared UI (Tamagui).
- **`/tests`**: Centralized test suite (Sibling to `src`).
  - `unit`: Pure logic tests.
  - `e2e`: End-to-end user flows.
  - `integration`: Adapter/API tests.
- **`/convex`**: Backend functions and schema.
- **`/bin`**: Workflow scripts (`snapshot.sh`, `task-start.sh`).
- **`/.agent`**: AI Context and Rules.

## Rules

- **No Drift**: Do not create new top-level directories without architectural approval.
- **Bin**: Logic for workflows lives in `/bin`, not in `package.json` scripts (which should call `/bin` or `mise`).
