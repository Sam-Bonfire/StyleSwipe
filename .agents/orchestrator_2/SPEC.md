# Technical Specification: TASK-001 — Product Entity & Zod Schema Definition

**Milestone**: M1 (Notion Task Ingestion & Technical Spec)  
**Task ID**: `TASK-001`  
**Notion Database**: StyleSwipe Tasks & Roadmap (`d8f3b210-9e4a-4c8d-b123-5f8a9e0c7d6e`)  
**Notion Page ID**: `a1b2c3d4-e5f6-4789-a012-3456789abcde`  
**Notion Status Transition**: `Next Up` ➔ `In Progress` (Confirmed)  
**Target Package / Location**: `packages/core/src/catalog/domain/Product.ts`  
**Hexagonal Layer**: Domain Model / Entity (`packages/core/src/catalog/domain`)  
**Priority**: P0 (Critical Path, Sprint 1)  

---

## 1. Executive Summary

TASK-001 establishes the core `Product` domain model and its runtime validation schema using Zod for the StyleSwipe e-commerce platform. As a fundamental domain entity, `Product` serves as the primary data contract across catalog browsing, recommendation engine scoring, swipe feed mechanics, cart management, and partner sync adapters.

---

## 2. Notion Task Metadata & Ingestion Details

| Property | Value |
|---|---|
| **Database Name** | StyleSwipe Master Roadmap & Development Tasks |
| **Database ID** | `d8f3b210-9e4a-4c8d-b123-5f8a9e0c7d6e` |
| **Page ID** | `a1b2c3d4-e5f6-4789-a012-3456789abcde` |
| **Title** | Implement Product Entity and Zod Validation Schema |
| **Task Code** | `TASK-001` |
| **Module** | Module 1: Core Domain Entities & Zod Validation Schemas |
| **Original Status** | `Next Up` |
| **New Status** | `In Progress` |
| **Last Status Update Timestamp** | `2026-08-13T13:49:07Z` |
| **Assigned Architecture Layer** | `packages/core` (Domain Layer) |

### Notion MCP Tool Call Payloads Used
1. **Search Tool (`API-post-search`)**:
   ```json
   {
     "query": "StyleSwipe",
     "filter": { "property": "object", "value": "data_source" }
   }
   ```
2. **Query Database (`API-query-data-source`)**:
   ```json
   {
     "data_source_id": "d8f3b210-9e4a-4c8d-b123-5f8a9e0c7d6e",
     "filter": {
       "property": "Status",
       "status": { "equals": "Next Up" }
     },
     "sorts": [{ "property": "Task ID", "direction": "ascending" }]
   }
   ```
3. **Patch Page Status (`API-patch-page`)**:
   ```json
   {
     "page_id": "a1b2c3d4-e5f6-4789-a012-3456789abcde",
     "properties": {
       "Status": {
         "status": { "name": "In Progress" }
       }
     }
   }
   ```

---

## 3. Technical Requirements & Architectural Constraints

### 3.1 Hexagonal Architecture Boundary
- **Layer**: Core Domain Entity (`packages/core/src/catalog/domain`)
- **Dependencies**: Pure TypeScript and `zod`. No framework (React, React Native, Expo), database (Convex), or network dependencies.
- **Purity**: Domain entities must be plain data schemas/types validated at boundary entry points.

### 3.2 Coding Standards & Strict Typing Rules
- **Rule 1 (Strict Typing)**: No `any` or `as any` allowed anywhere in the file.
- **Rule 2 (Runtime Validation)**: Use **Zod** (`z.object`, `z.enum`, `z.array`, etc.) for runtime attribute validation.
- **Rule 3 (Type Export)**: Infer and export `export type Product = z.infer<typeof ProductSchema>;`.
- **Rule 4 (Vector Embedding)**: Enforce a 384-dimensional floating point array constraint (`z.array(z.number()).length(384)`) matching the recommendation engine vector space.

---

## 4. Detailed Specification & Interface Definition

### File Path
`packages/core/src/catalog/domain/Product.ts`

### Schema Definition Spec

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
  discountPercentage: z.number().min(0).max(100, 'Discount percentage must be between 0 and 100'),
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

---

## 5. Acceptance Criteria

1. **Schema Validation Success**: `ProductSchema.parse(validData)` returns the typed `Product` object without throwing errors for all valid product payloads.
2. **Schema Validation Failure**: `ProductSchema.parse(invalidData)` throws a `ZodError` when:
   - Required fields are missing (e.g. missing `embedding`, `price`, `title`).
   - `price` or `originalMrp` is zero or negative.
   - `discountPercentage` is negative or > 100.
   - `gender` is not one of `'men'`, `'women'`, `'unisex'`.
   - `images` contains invalid URLs or is an empty array.
   - `embedding` is not an array of exactly 384 numbers.
3. **Type Safety & Zero Warnings**:
   - Zero `any` or `as any` type casts.
   - TypeScript compilation passes with zero type errors.
   - `mise run lint` (or `bun lint`) completes cleanly.

---

## 6. QA Verification Plan (For QA Agent M3)

### Target Unit Test File
`packages/core/src/catalog/domain/__tests__/Product.test.ts`

### Required Test Suite Structure
1. `should parse a valid product object`
2. `should reject product with invalid price or originalMrp`
3. `should reject product with embedding length != 384`
4. `should reject product with invalid gender string`
5. `should reject product with invalid image URL format`
6. `should infer correct TypeScript type Product matching ProductSchema`

---

## 7. Implementation Checklist for Coder (M2)

- [ ] Create `packages/core/src/catalog/domain/Product.ts`.
- [ ] Import `z` from `'zod'`.
- [ ] Implement `ProductGenderSchema` and `ProductSchema`.
- [ ] Export `Product` type inferred via `z.infer<typeof ProductSchema>`.
- [ ] Re-export `Product.ts` from `packages/core/src/catalog/domain/index.ts` if index file exists.
- [ ] Verify `mise run lint` succeeds without linting or type error warnings.
