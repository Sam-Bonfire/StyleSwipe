## 2026-08-13T19:25:25Z
<USER_REQUEST>
You are QA Test Writer for Milestone 3 (QA Verification & Unit Tests).
Your working directory is: c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\qa_test_writer_m3_1
Create your working directory if needed and keep all metadata files inside it.

Inputs:
- Implementation File: `packages/core/src/catalog/domain/Product.ts`
- Spec File: `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\orchestrator_2\SPEC.md`
- Original Request File: `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\ORIGINAL_REQUEST.md`

Task:
1. Write a comprehensive unit test suite in `packages/core/src/catalog/domain/__tests__/Product.test.ts`.
   - Test valid product payload parses successfully.
   - Test rejection of negative or zero price / originalMrp.
   - Test rejection of discountPercentage < 0 or > 100.
   - Test rejection of invalid gender enum strings.
   - Test rejection of invalid image URLs.
   - Test rejection of vector embedding array length != 384.
   - Test rejection of missing required fields.
2. Execute unit tests (`bun test` or test runner in `packages/core`) and run `mise run lint` (or `bun lint`).
3. Write your handoff report to `c:\Users\Sam\Consusson\Projects\StyleSwipe\.agents\qa_test_writer_m3_1\handoff.md` detailing test results and lint output.
4. Send a message to parent when finished.
</USER_REQUEST>
