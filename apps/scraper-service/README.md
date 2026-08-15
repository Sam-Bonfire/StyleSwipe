# @app/scraper-service (Ingestion Adapter)

## Vision
Autonomous service for ingesting product data from external partners (Myntra, etc.).

## Workflow
1.  **Fetch**: Playwright automation to crawl pages.
2.  **Adapt**: Convert external HTML/JSON into **Core Entities** (`Product`).
3.  **Persist**: Save to Convex via `@app/infrastructure`.

## Constraints
*   **Headless**: No UI dependencies (`react`, `tamagui`).
*   **Standalone**: Runs as a separate worker process.

## Commands
```bash
# Run scraper
bun run start
```
