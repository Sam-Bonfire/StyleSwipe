## 2026-08-13T13:52:00Z
You are Coder / Worker 1 for Milestone 2 (Code Implementation for TASK-001).
Your working directory is: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_m2_1
Create your working directory if needed and keep all metadata files inside it.

Inputs:
- Specification File: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\orchestrator_2\SPEC.md
- Original Request File: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md
- Coding Standards Rule: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\rules\coding-standards.md

Target File Boundaries (Exclusive Ownership):
- `packages/core/src/catalog/domain/Product.ts`
- `packages/core/src/catalog/domain/index.ts`

Task Instructions:
1. Read SPEC.md, ORIGINAL_REQUEST.md, and coding standards carefully.
2. Create `packages/core/src/catalog/domain/Product.ts` implementing `ProductGenderSchema`, `ProductGender`, `ProductSchema`, and `Product` type using Zod.
   - Enforce 384-length array for embedding.
   - Enforce URL format for image URLs and affiliateUrl.
   - Positive numbers for price and originalMrp.
   - Min 0, max 100 for discountPercentage.
   - Non-empty strings/arrays for required fields.
3. Check if `packages/core/src/catalog/domain/index.ts` exists. If so, export `Product.ts` from it.
4. Run build/typecheck commands (e.g. `bun run check` or `mise run lint` or `npx tsc --noEmit` within `packages/core`) to verify compilation.
5. Write your handoff report to `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\worker_m2_1\handoff.md` detailing changes made, files created/modified, and build verification output.
6. Send a message to parent when complete.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
