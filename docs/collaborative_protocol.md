# Team Player Protocol

## Protocol A: Dependent Features
When an agent (e.g., Discovery) requires changes from another context (e.g., DB):
1.  **Reference**: Identify the prerequisite Graphite PR ID.
2.  **Rebase**: Run `jj rebase -d <pr_commit_id>` to stack your changes on top of the dependency.
3.  **Verify**: Ensure the stack is `trunk -> dependency -> my_feature`.

## Protocol B: Conflict Resolution
If a merge conflict occurs:
1.  **Halt**: Do not force push.
2.  **Report**: Generate `CONFLICT_REPORT.md` with:
    *   Conflicting files
    *   Logic overlap description
    *   Proposed resolution
3.  **Review**: Submit to Architect for approval.
