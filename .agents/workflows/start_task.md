---
description: Standard procedure for starting a new task as an agent
---

# Workflow: Start Task

1. **Bootstrap**
   - [ ] Read `.agents/rules/` and `docs/Architecture.md`.
   - [ ] Identify parameters: `type`, `title`, `ticketids`.
   - [ ] Execute: `mise run task {{type}} {{title}}`.

2. **Develop & Backup**
   - [ ] Implement features in the assigned context.
   - [ ] Run `mise run snap` at stable milestones (commit-only; push explicitly for remote backup).

3. **Finalize**
   - [ ] Run `mise run lint` and `mise run test`, then `mise run submit` to deliver the stack to Graphite.
