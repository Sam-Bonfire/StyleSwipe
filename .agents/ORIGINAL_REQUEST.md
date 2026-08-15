# Original User Request

## 2026-08-13T02:16:22Z

# Teamwork Project Prompt

Analyze StyleSwipe project for feature drift, research competitors, generate 250 tasks, review them, and compile into PRDs and a roadmap.

Working directory: c:/Users/Sam/Consusson/Projects/StyleSwipe
Integrity mode: development

## Requirements

### R1. Analyze Drift and Research Competitors
Compare the current state of the codebase against the original plan (`docs/StyleSwipe_POC_PRD.docx`, extracted as `docs/StyleSwipe_POC_PRD.txt`). Spawn research sub-agents to analyze competitors (e.g., Myntra, Ajio, Tinder for mechanics) to identify missing features and industry standards for a dual-mode (swipe + grid) fashion app. Document the findings.

### R2. Generate and Refine 250 Tasks
Generate a comprehensive list of exactly 250 unique, important, and distinct development tasks required to complete this project. Use a sub-agent to critically review ("grill") these tasks to ensure they are strictly necessary, properly scoped, and represent the best implementation approach according to the project's Hexagonal Architecture rules (e.g., `packages/core`, `apps/consumer-app`).

### R3. Compile PRDs and Roadmap
Use a sub-agent to compile the refined tasks into distinct Product Requirements Documents (PRDs) for major features (e.g., Partner Sync, Swipe Engine, Core Entities). Connect relevant tasks to form a cohesive, prioritized development roadmap.

## Acceptance Criteria

### Research & Drift Analysis
- [ ] A `drift_and_competitor_analysis.md` file exists detailing the gap between the current codebase, the original PRD, and competitor features.

### Task List
- [ ] A file `tasks.md` exists containing exactly 250 unique, actionable development tasks.
- [ ] Each task strictly adheres to the Hexagonal Architecture and Effect TS rules defined in the repository.

### PRDs and Roadmap
- [ ] A `roadmap.md` exists connecting the 250 tasks into a prioritized timeline.
- [ ] At least 4 distinct PRD files exist in a `generated_prds` folder detailing the requirements and mapping back to specific tasks.

## 2026-08-13T13:48:29Z

# Teamwork Project Prompt

Implement tasks from the StyleSwipe Notion roadmap one by one using a specialized multi-agent pipeline (PM, Coder, QA, Committer). The pipeline reads the next task, implements the code, performs QA validation, commits via `jj`, and opens a PR against the `dev` branch.

Working directory: c:/Users/Sam/Consusson/Projects/StyleSwipe
Integrity mode: development

## Requirements

### R1. Automatic Task Ingestion
The PM agent must query the StyleSwipe Notion database to automatically fetch the earliest scheduled task that is in the "Next Up" state. The PM will extract the requirements and translate them into a technical spec for the Coder.

### R2. Code Implementation (Coder)
The Coder agent will implement the changes specified by the PM. All changes must strictly adhere to the Hexagonal Architecture and Effect TS rules defined in the repository (e.g., no untyped errors, proper Effect pipelines).

### R3. QA Verification (Automated Tests)
The QA agent must write and run automated unit tests for the implemented changes. The QA agent is responsible for iterating with the Coder until the tests pass and linting checks (`mise run lint`) are green.

### R4. Version Control & PR Creation
Once QA approves the work, the Committer agent must:
1. Use Jujutsu (`jj`) to create a new branch.
2. Commit the approved files with a descriptive message formatted according to project rules.
3. Use the GitHub CLI (`gh pr create`) to open a Pull Request targeting the `dev` branch.

## Acceptance Criteria

### Workflow Completion
- [ ] A Notion task is read and its status is updated to reflect it is in progress.
- [ ] Source files are modified or created to fulfill the task requirements.
- [ ] Automated unit tests are written and pass successfully for the new logic.
- [ ] The codebase passes all linting (`mise run lint`) and type-checking rules.
- [ ] A new branch is visible via `jj status` containing the changes.
- [ ] A Pull Request targeting `dev` is successfully opened using the `gh` CLI.

