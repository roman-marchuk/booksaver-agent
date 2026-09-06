---
id: 002-remove-legacy-monitor-scaffolding
unit: 001-retired-runtime
intent: 024-repository-streamlining
status: complete
priority: must
created: "2026-09-06T21:28:53Z"
assigned_bolt: 070-retired-runtime
implemented: true
---

# US-179: Remove Legacy Monitor Scaffolding

As the owner, I want the reviewed cleanup completed so current behavior has one clear implementation and useful evidence.

## Acceptance Criteria

- [x] Remove the retired manage-page monitor, unused batch/global-session APIs, null repositories, and dead compatibility wrappers; retain authenticated deterministic rollback.
- [x] Relevant surviving safety, migration and regression contracts pass.
- [x] No unrelated user work or active branch is lost.
