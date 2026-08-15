## 2026-08-13T02:21:34Z
<USER_REQUEST>
You are teamwork_preview_worker working on StyleSwipe.
Your working directory is: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_task_gen_1

Your task:
1. Read the following reference files:
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\drift_and_competitor_analysis.md
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\docs\StyleSwipe_POC_PRD.txt
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\rules\coding-standards.md
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\rules\workflow.md
2. Generate a comprehensive candidate list of EXACTLY 250 unique, important, distinct, and highly actionable development tasks to complete the StyleSwipe project.
3. Organize the 250 tasks into 8 logical domain modules:
   - Module 1: Core Domain Entities & Zod Validation Schemas (`packages/core/src/domain`) [TASK-001 to TASK-030]
   - Module 2: Hexagonal Ports & Effect TS Use Cases (`packages/core/src/*/application`) [TASK-031 to TASK-070]
   - Module 3: Infrastructure Adapters, Convex Backend & Schema (`packages/infrastructure`, `convex/`) [TASK-071 to TASK-110]
   - Module 4: Swipe Engine, Gesture Physics & Vector Recommendation (`packages/core`, `apps/consumer-app`) [TASK-111 to TASK-140]
   - Module 5: Partner Profile Sync, Taste Blending & Affiliate Catalog [TASK-141 to TASK-165]
   - Module 6: UI Kit Design System & Atomic Components (`packages/ui-kit`) [TASK-166 to TASK-190]
   - Module 7: Consumer App Screens, Navigation & State (`apps/consumer-app`) [TASK-191 to TASK-220]
   - Module 8: Admin Operations Panel, Analytics, E2E Testing & CI/CD (`apps/admin-panel`, E2E, CI/CD) [TASK-221 to TASK-250]

4. Each task MUST include:
   - Task ID: TASK-001 through TASK-250
   - Title: Clear action-oriented title
   - Layer / Package: `packages/core`, `packages/infrastructure`, `packages/ui-kit`, `apps/consumer-app`, `apps/admin-panel`, or `convex`
   - Hexagonal Role: Domain Entity / Port Tag / Effect UseCase / Infrastructure Layer / React Hook / UI Component / Screen
   - Detailed Description: Specific technical steps, files to create/modify, methods to implement
   - Coding Standards Compliance: Explicit mention of Effect TS Tagged Error, Zod schema validation, Effect return types, Context.Tag ports, `any` prevention
   - Acceptance Criteria: Verifiable conditions for task completion.

5. Save the complete candidate task list to `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_task_gen_1\candidate_tasks.md`.
6. Also write c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_task_gen_1\progress.md.
7. Send a message back to parent (507c71ff-7af8-424d-bc25-dcd846df346f) when candidate_tasks.md is ready for grilling/review.
</USER_REQUEST>
