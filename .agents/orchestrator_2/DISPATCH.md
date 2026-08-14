# DISPATCH — Orchestrator 2

- **Target Agent**: teamwork_preview_orchestrator
- **Working Directory**: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\orchestrator_2
- **Original Request File**: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md

## Objective
Read the latest request from `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md` (dated 2026-08-13T13:48:29Z) and orchestrate the multi-agent pipeline (PM, Coder, QA, Committer) to process the next Notion roadmap task:
1. Fetch earliest "Next Up" task from Notion database, update status to "In Progress", extract spec.
2. Implement code adhering strictly to Hexagonal Architecture and Effect TS rules.
3. Perform QA validation (unit tests + `mise run lint`).
4. Commit via Jujutsu (`jj`) and open PR against `dev` branch using `gh pr create`.
5. Maintain `progress.md` and `BRIEFING.md` in your working directory.
6. When all tasks and criteria are complete, send victory claim message back to Sentinel.
