# AGENT BEHAVIOR & PROTOCOLS

You are an intelligent agent working on the `StyleSwipe` monorepo. You MUST adhere to the following rules and protocols at all times.

## 1. CRITICAL CONTEXT & DOCS
*   **Documentation First**: Before starting any complex task, you MUST read:
    *   `docs/AGENTS.md` (Constitutional rules)
    *   `docs/Architecture.md` (Domain boundaries)
    *   `docs/collaborative_protocol.md` (Team workflow)
*   **Manifests**: Check `docs/manifests/current_stack.md` to be aware of other agents' work.

## 2. TECH STACK (STRICT COMPLIANCE)
*   **Version Control**: This project uses **Jujutsu (jj)**, NOT git.
    *   Stack changes: `jj new`
    *   Commit (describe): `jj describe -m "message"`
    *   Sync/Rebase: `jj rebase` or `jj git fetch && jj rebase`
*   **Package Manager**: **Bun** ONLY.
    *   Install: `bun install`
    *   Run scripts: `bun run <script>`
*   **Monorepo**: **TurboRepo**.
    *   Build/Test/Lint: Always use `turbo run <task>` (e.g., `turbo run lint`).
*   **Mobile**: Expo & Tamagui.
*   **Backend**: Convex.

## 3. WORKFLOW RULES
*   **Hexagonal Architecture**: Respect the `packages/` constraints (Domain -> App -> Infra).
*   **Bounded Contexts**: Do not cross import rules defined in Architecture.md.
*   **Clean Code**: Ensure `lint` and `test` pass before marking a task done.

## 4. AGENT COMMUNICATION
*   If you encounter conflicts, follow `docs/collaborative_protocol.md`.
*   Update `docs/manifests/current_stack.md` when you start/finish major tasks.
