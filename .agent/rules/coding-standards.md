---
trigger: always_on
description: "Strict coding standards for Type Systems, Effect TS, and Code Quality"
globs: ["**/*.ts", "**/*.tsx"]
---

# Coding Standards

## 1. Type Safety (The "Strict Typing" Pact)
- **Applicability**: This rule applies EQUALLY to **Humans** and **AI Agents**.
- **Rule**: Maintain type safety at ALL costs.
- **Prohibited**: Do NOT default to `any`.
    - ❌ `data: any`
    - ❌ `as any` (Strictly forbidden unless no other option exists; must be commented).
- **Requirement**: Use robust, specific types.
    - **Validation**: MUST use **Zod** wherever runtime validation is applicable (Forms, Configs, API Responses, Env Vars) across **ALL** apps and packages (`core`, `infra`, `ui-kit`, `apps/*`).
    - **Definitions**: distinct Interfaces/Types for all Entities.

## 2. Functional Programming (Effect TS)
- **Library**: `Effect` (effect.website).
- **Rule**: Use the Effect library effectively for:
    - Error Handling (avoid `try/catch`).
    - Dependency Injection.
    - Async flow control.

## 3. Definition of Done
- **Linting**: A task is **NOT COMPLETE** until all linting issues are resolved.
    - Run `mise run lint` (or `bun lint`) to verify.
- **Documentation**: Whenever major changes are made, associated documentation (architecture, READMEs) **MUST** be updated immediately.