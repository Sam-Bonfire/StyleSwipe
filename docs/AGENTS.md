# AGENT PROTOCOL & CONSTITUTION

> [!IMPORTANT]
> **ALL AGENTS MUST READ THIS FILE BEFORE STARTING ANY TASK.**

This project `StyleSwipe` is a complex monorepo with strict architectural and collaborative rules. Failure to follow these rules will result in broken builds, merge conflicts, and rejected PRs.

## 1. The Golden Rules
1.  **Read the Docs**: You must read `docs/Architecture.md` to understand where your code belongs (Bounded Contexts) and `docs/collaborative_protocol.md` to understand how to work with other agents.
2.  **Tech Stack Compliance**:
    *   **Runtime**: Bun ONLY. Do not use `npm` or `yarn` directly unless specified in `package.json` scripts.
    *   **Repo**: TurboRepo. Run commands via `turbo run <command>`.
    *   **Backend**: Convex.
    *   **Mobile**: Expo + Tamagui.
3.  **No "YOLO" Coding**:
    *   Do not create new folders outside the defined `apps/` or `packages/` structure.
    *   Do not add external dependencies without verifying they are compatible with Bun and Expo.

## 2. Starting a Task
Before checking out a branch or writing code:
1.  Check `docs/manifests/current_stack.md` to see what other agents are working on.
2.  If your task depends on another agent's active PR, you MUST stack your changes on top of theirs using `jj new <their_commit_id>`.

## 3. Definition of Done
A task is only complete when:
1.  Code is written and follows the **Hexagonal Architecture** (Domain -> App -> Infra).
2.  `lint` passes (`turbo run lint`).
3.  `test` passes (`turbo run test`).
4.  You have updated `docs/manifests/current_stack.md` to include your new Task ID and any shared dependencies you modified.
