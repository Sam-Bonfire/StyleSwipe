---
trigger: always_on
---

# Workflow Rules

We use a "Single Command" workflow powered by **Mise** to maintain velocity and data safety.

## 1. Starting Work
- **Command**: `mise run task <type> <title>`
- **Rule**: NEVER create branches manually with `git checkout -b`.
- **Effect**: Stacks a new branch using Graphite (`gt`).

## 2. Saving Progress
- **Command**: `mise run snap <type> <title> [-d desc] [-t ticket]`
- **Rule**: NEVER use `git commit` directly for work-in-progress.
- **Effect**: Formats a structured commit message (commit-only; push explicitly when ready for backup).

## 3. Submitting
- **Command**: `mise run submit`
- **Rule**: Use this instead of manual PR creation.
- **Effect**: Submits the Graphite stack (`gt submit`). Run `mise run lint` / `mise run test` separately first; submit does not verify.

## 4. Releasing
- **Command**: `mise run release`
- **Rule**: Only this command handles version bumping and tagging.