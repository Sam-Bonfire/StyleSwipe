# STYLE SWIPE: THE MASTER AGENT PROTOCOL (GT EDITION)

## I. THE CONSTITUTION
1. **Stack**: Bun (Runtime), Turbo (Build), Git (VCS), Graphite (Stacking).
2. **Layers**: Hexagonal Architecture (Domain -> App -> Infrastructure).
3. **Integrity**: Never bypass the `pre-push` hook. All PRs target `dev`.

## II. THE WORKFLOW
1. **Start**: `bun task {{type}} {{name}}`. 
2. **Work**: Code logic. Use VS Code Source Control to stage files.
3. **Save**: `bun snap "{{type}}/{{name}}"`.
4. **Submit**: `bun submit`. (Auto-fix + Validation + PR Creation).

## III. STACK MANAGEMENT
- Use `gt log` to visualize the stack.
- Use `gt upstack get` / `gt downstack get` to navigate.
- Use `bun sync` if the remote `dev` branch moves forward.

## IV. RELEASES
- Only `bun release` is permitted to update `main`.