## 2026-08-13T02:30:11Z
<USER_REQUEST>
You are teamwork_preview_critic working on StyleSwipe.
Your working directory is: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\critic_task_review_1

Your task:
1. Read the candidate task list at:
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_task_gen_1\candidate_tasks.md
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\drift_and_competitor_analysis.md
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\rules\coding-standards.md
   - c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\rules\workflow.md

2. Critically review ("grill") all candidate tasks to ensure:
   - Exactly 250 unique, distinct, non-overlapping development tasks exist (TASK-001 to TASK-250). No duplicates, no vague placeholders, no missing numbers.
   - Hexagonal Architecture compliance: Domain Entities & Zod Schemas in `packages/core/src/domain`, Ports & Effect TS Use Cases in `packages/core/src/*/application`, Infrastructure Adapters & Convex persistence in `packages/infrastructure` & `convex/`, UI Components in `packages/ui-kit`, Screens in `apps/consumer-app`, Admin in `apps/admin-panel`.
   - Effect TS Rules compliance: Tagged Error types (`_tag`), Use cases returning `Effect.Effect<Success, TaggedError>`, repository ports as `Context.Tag`, `Effect.tryPromise` adapter wrapping, `Effect.runPromise` at boundaries, `QueueService<T>` for queues.
   - Strict Type Safety & Zod Validation: Zod schemas for all runtime validations, zero `any` / `as any` type escapes.
   - Detailed task structure: Task ID, Title, Target Package/Layer, Hexagonal Role, Detailed Technical Description, Coding Standards Compliance, and Acceptance Criteria.

3. Refine, format, and publish the final 250 tasks into `c:\Users\Sam\Consusson\Projects\StyleSwipe\tasks.md` at project root.
4. Also write c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\critic_task_review_1\progress.md and handoff.md.
5. Send a message back to parent (507c71ff-7af8-424d-bc25-dcd846df346f) summarizing your grilling findings, task distribution, and confirming that `c:\Users\Sam\Consusson\Projects\StyleSwipe\tasks.md` has been saved.
</USER_REQUEST>
