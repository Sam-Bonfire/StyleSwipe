---
description: Standard procedure for starting a new task as an agent
---

# Agent Start Task Workflow


1.  **Load Agent Rules**

    - [ ] `view_file .agent/rules.md`

    - [ ] Review the mandates for `jj`, `bun`, and strict documentation compliance.


2.  **Read the Constitution**

    - [ ] `view_file docs/AGENTS.md`

    - [ ] `view_file docs/Architecture.md`


3.  **Check Sync Status**

    - [ ] `view_file docs/manifests/current_stack.md`

    - [ ] Identify if there are dependencies you need to build on.


3.  **Initialize Work**

    - [ ] `rub_command "jj new -m 'TASK-ID: Description'"`

