---
description: Standard procedure for starting a new task as an agent
---

# Workflow: Start Task

1. **Bootstrap**
   - [ ] Read `.agent/PROTOCOL.md` and `docs/Architecture.md`.
   - [ ] Identify parameters: `type`, `title`, `ticketids`.
   - [ ] Execute: `bun task {{type}} {{title}}`.

2. **Develop & Backup**
   - [ ] Implement features in the assigned context.
   - [ ] Run `bun snap` at every stable milestone to ensure remote backups exist.

3. **Finalize**
   - [ ] Run `bun submit` to deliver the validated stack to Graphite.
