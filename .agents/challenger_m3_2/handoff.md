# Empirical Challenge & Verification Report: TASK-001 Product Entity & Validation Schema

**Verdict**: `REQUEST_CHANGES`

---

## 1. Observation

### 1.1 Test Execution Failure
- **Executed Command**: `bun test packages/core/src/catalog/domain/__tests__/Product.test.ts`
- **Exit Code**: `1`
- **Verbatim Error Output**:
  ```text
  bun test v1.3.14 (0d9b296a)

  packages\core\src\catalog\domain\__tests__\Product.test.ts:

  # Unhandled error between tests
  -------------------------------
  error: Cannot find package 'zod' from 'C:\Users\Sam\Consusson\Projects\StyleSwipe\packages\core\src\catalog\domain\Product.ts'
  -------------------------------

   0 pass
   1 fail
   1 error
  Ran 1 test across 1 file. [6.91s]
  ```

### 1.2 Package Dependencies Inspection
- **File**: `packages/core/package.json` (lines 20-23):
  ```json
  "dependencies": {
    "effect": "^3.22.0",
    "fast-check": "^3.0.0"
  }
  ```
  `zod` is absent from dependencies.

### 1.3 Target Implementation File Inspection
- **File**: `packages/core/src/catalog/domain/Product.ts` (lines 1-24):
  ```typescript
  import { z } from 'zod';

  export const ProductGenderSchema = z.enum(['men', 'women', 'unisex']);
  export type ProductGender = z.infer<typeof ProductGenderSchema>;

  export const ProductSchema = z.object({
    id: z.string().min(1, 'Product ID is required'),
    title: z.string().min(1, 'Product title is required'),
    brand: z.string().min(1, 'Brand is required'),
    price: z.number().positive('Price must be a positive number'),
    originalMrp: z.number().positive('Original MRP must be a positive number'),
    discountPercentage: z.number().min(0, 'Discount percentage must be between 0 and 100').max(100, 'Discount percentage must be between 0 and 100'),
    category: z.string().min(1, 'Category is required'),
    gender: ProductGenderSchema,
    sizes: z.array(z.string()).min(1, 'At least one size must be specified'),
    colors: z.array(z.string()).min(1, 'At least one color must be specified'),
    images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image URL is required'),
    embedding: z.array(z.number()).length(384, 'Embedding must be a 384-dimensional vector'),
    affiliateUrl: z.string().url('Affiliate URL must be valid'),
    inStock: z.boolean(),
  });

  export type Product = z.infer<typeof ProductSchema>;
  ```

### 1.4 Test Suite Import Inspection
- **File**: `packages/core/src/catalog/domain/__tests__/Product.test.ts` (line 1):
  ```typescript
  import { describe, expect, it } from 'vitest';
  ```
  While `bun test` runs with standard test runners, other test files in `packages/core` (e.g. `ManageCart.test.ts`, `CheckoutService.test.ts`, `Cart.test.ts`) import test primitives directly from `'bun:test'`.

---

## 2. Logic Chain

1. **Step 1 (Observation 1.3 & 1.2)**: `Product.ts` imports `zod` at runtime (`import { z } from 'zod'`). However, `packages/core/package.json` does not declare `zod` in its `dependencies`.
2. **Step 2 (Observation 1.1)**: Executing `bun test packages/core/src/catalog/domain/__tests__/Product.test.ts` fails catastrophically before running any assertions because Node/Bun module resolution cannot locate the `zod` package from `@app/core`.
3. **Step 3 (Adversarial Assessment & Spec Conformance)**:
   - The schema logic in `Product.ts` is well-formed and matches `SPEC.md` §4:
     - Discount boundary conditions: `min(0)` accepts `0`, `max(100)` accepts `100`; rejects `-0.01` and `100.01`.
     - Embedding dimension: `.length(384)` accepts exactly 384 floating point elements; rejects 383, 385, empty array `[]`, and non-number elements.
     - Prices: `positive()` rejects `0` and negative values.
     - Enums: accepts only `'men' | 'women' | 'unisex'`.
     - Collections: `sizes`, `colors`, `images` enforce `.min(1)`.
   - However, without `zod` installed in `packages/core`, no unit tests, integration tests, or consuming packages can compile or run.
4. **Step 4 (Test Runner Alignment)**: In `Product.test.ts`, importing from `'vitest'` instead of `'bun:test'` risks further runtime test harness resolution failures.

---

## 3. Caveats

- Domain schema definitions in `Product.ts` and test assertions in `Product.test.ts` are logically thorough and complete once `zod` is installed in `packages/core/package.json`.
- The Challenger is constrained to review-only mode and cannot modify `packages/core/package.json` or `Product.test.ts` directly.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

### Required Action Items for Coder / QA:
1. **Add `zod` Dependency**:
   - Add `"zod": "^3.23.8"` to `"dependencies"` in `packages/core/package.json`.
   - Run `bun install` at repository root.
2. **Update Test Runner Import**:
   - Change `import { describe, expect, it } from 'vitest';` to `import { describe, expect, it } from 'bun:test';` in `packages/core/src/catalog/domain/__tests__/Product.test.ts`.
3. **Re-run Test Suite**:
   - Execute `bun test packages/core/src/catalog/domain/__tests__/Product.test.ts` to confirm 100% green pass across all 18+ boundary test cases.

---

## 5. Verification Method

1. Inspect `packages/core/package.json` to verify `"zod"` is added to `dependencies`.
2. Inspect `packages/core/src/catalog/domain/__tests__/Product.test.ts` line 1 to verify import from `'bun:test'`.
3. Run the project test command:
   ```bash
   bun test packages/core/src/catalog/domain/__tests__/Product.test.ts
   ```
4. **Invalidation Condition**: Any non-zero exit code or failed test assertion indicates ongoing regression.
