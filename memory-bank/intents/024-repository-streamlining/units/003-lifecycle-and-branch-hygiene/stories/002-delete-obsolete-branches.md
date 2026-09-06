---
id: 002-delete-obsolete-branches
unit: 003-lifecycle-and-branch-hygiene
intent: 024-repository-streamlining
status: complete
priority: must
created: "2026-09-06T21:28:53Z"
assigned_bolt: 071-lifecycle-and-branch-hygiene
implemented: true
---

# US-182: Delete Obsolete Branches

As the owner, I want the reviewed cleanup completed so current behavior has one clear implementation and useful evidence.

## Acceptance Criteria

- [x] Delete unused integrated and rejected obsolete branches locally and remotely after live ownership/PR/worktree checks; preserve current tasks, uncommitted work, main and the cleanup branch.
- [x] Relevant surviving safety, migration and regression contracts pass.
- [x] No unrelated user work or active branch is lost.
