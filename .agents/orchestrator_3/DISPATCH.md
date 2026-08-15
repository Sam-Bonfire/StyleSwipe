# Orchestrator Dispatch

## Mission
Implement tasks from the StyleSwipe Notion roadmap one by one using a specialized multi-agent pipeline (PM, Coder, QA, Committer).
1. Query Notion database for the earliest scheduled task in "Next Up" state.
2. Update its status in Notion to "In Progress".
3. Extract requirements and generate technical spec (SPEC.md).
4. Implement the required code strictly following Hexagonal Architecture and Effect TS rules (no `any`, tagged error classes, Effect pipelines, Zod validation).
5. Write and execute automated unit tests; ensure `mise run lint` passes with zero errors.
6. Use Jujutsu (`jj`) to create a new branch and commit approved files.
7. Use GitHub CLI (`gh pr create`) to open a Pull Request targeting the `dev` branch.
8. Report completion back to Sentinel.

## Key Constraints & Reference
- Original Request: `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md`
- Working Directory: `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\orchestrator_3`
- Notion MCP Server is available for Notion database queries and page updates.
- Strictly adhere to `coding-standards.md` (Effect TS, strict typing, Zod, ports & adapters) and `workflow.md`.
- Prior spec / context: check `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\orchestrator_2\SPEC.md` if relevant to resume from prior knowledge.
