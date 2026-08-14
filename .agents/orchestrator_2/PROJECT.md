# Project: StyleSwipe Notion Task Automation Pipeline

## Architecture
- Hexagonal Architecture + Effect TS (`packages/core`, `packages/infrastructure`, `apps/consumer-app`, `apps/admin-panel`)
- Database: Notion API for task tracking
- VCS: Jujutsu (`jj`), GitHub CLI (`gh`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Task Ingestion & Spec Extraction | Query Notion database for earliest 'Next Up' task, update to 'In Progress', output spec.md | M1 | ORIGINAL_REQUEST.md |
| 2 | Code Implementation | Implement required domain logic & infrastructure adapters using Effect TS and Hexagonal Arch | M2 | ORIGINAL_REQUEST.md |
| 3 | QA & Linting | Unit tests passing, zero lint/type errors (`mise run lint`) | M3 | ORIGINAL_REQUEST.md |
| 4 | Version Control & PR | Commit with `jj`, push branch, create PR against `dev` with `gh pr create` | M4 | ORIGINAL_REQUEST.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Ingest Task & Spec | Query Notion, update status, write SPEC.md | none | DONE |
| 2 | Implementation | Implement spec in codebase | M1 | DONE |
| 3 | QA Verification | Write/run tests, run linting | M2 | IN_PROGRESS |
| 4 | Commit & PR | Jujutsu commit, gh pr create | M3 | PLANNED |

## Interface Contracts
- `SPEC.md`: Output by M1, consumed by M2
- Codebase changes: Produced by M2, verified by M3
- Git/JJ branch & PR: Created by M4
