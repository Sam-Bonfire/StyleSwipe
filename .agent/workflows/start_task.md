---
description: Standard procedure for starting a new task as an agent
---

# Agent Start Task Workflow

1.  **Read the Constitution**
    - [ ] `view_file docs/AGENTS.md`
    - [ ] `view_file docs/Architecture.md`

2.  **Check Sync Status**
    - [ ] `view_file docs/manifests/current_stack.md`
    - [ ] Identify if there are dependencies you need to build on.

3.  **Initialize Work**
    - [ ] `rub_command "jj new -m 'TASK-ID: Description'"`
