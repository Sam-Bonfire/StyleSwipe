## Current Stack Manifest

> [!WARNING]
> **Agents: If you have not read `docs/AGENTS.md`, do so IMMEDIATELY.**


| Task ID | Agent Owner | Base Branch/PR | Shared Dependencies |
|---------|-------------|----------------|---------------------|
| PRD-28  | Agent 1     | trunk          | None                |
| PRD-99  | Agent 2     | PRD-28         | User Entity         |
| DOCS-001| Antigravity | trunk          | Documentation       |
| LEGAL-001| Antigravity | trunk          | Proprietary License |
| ID-001  | Antigravity | trunk          | Identity, Auth      |
| ID-005  | Antigravity | ID-001         | Identity, Auth      |
| ID-002  | Antigravity | ID-005         | Identity            |
| ID-003  | Antigravity | ID-002         | Identity            |
| ID-004  | Antigravity | ID-003         | Identity            |
| COM-001 | Antigravity | ID-004         | Cart                |
| COM-002 | Antigravity | COM-001        | PDP                 |
| COM-003 | Antigravity | COM-002        | Checkout            |
| DIS-001 | Antigravity | ID-004         | Identity, Discovery |
| DIS-002 | Antigravity | DIS-001        | Discovery           |
| DIS-003 | Antigravity | DIS-002        | Discovery           |
