# STYLE SWIPE: THE MASTER AGENT PROTOCOL

## I. THE CONSTITUTION (Rules of Engagement)
1. **Tech Stack**: Use **Bun** for runtimes, **Turbo** for orchestration, **Jujutsu (jj)** for local VCS, and **Graphite** for PR stacking.
2. **Architecture**: Adhere to **Hexagonal Layers** (Domain -> App -> Infrastructure). Core logic must remain pure.
3. **No Legacy Commands**: Avoid direct `git`, `node`, or `npm` calls. Use the provided `bin/` scripts.

## II. THE WORKFLOW (Step-by-Step)
1. **Initialize**: Run `bun task {{type}} {{title}}`. This creates a `jj` change and a remote backup.
2. **Iterate**: Write code. Run `turbo run lint test` frequently.
3. **Checkpoint**: Run `bun snap {{type}} {{scope}} "{{title}}" "{{description}}" "{{ticketids}}"`. This snapshots `jj` and pushes to the remote.
4. **Ship**: Run `bun submit`. This validates the entire stack and pushes to Graphite for review.

## III. COLLABORATION & PARALLEL WORK
1. **Stacking**: To build on unmerged code from another agent, `jj git fetch` then `jj rebase -s <dependency_branch> -d @`. 
2. **Locking**: Signal changes to `schema.ts` or `ui-kit` in `docs/manifests/current_stack.md`.
3. **Conflicts**: If `jj` shows a conflict, resolve it in the file and run `bun snap` to clear the state.

## IV. PROMOTION & RELEASE
- Feature -> `dev` (Integration) -> `main` (Production).
- Merges to `main` trigger `bun release` to bump versions and tag the build.