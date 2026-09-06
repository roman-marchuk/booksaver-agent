---
id: 001-remove-retired-mutation-workflows
unit: 001-retired-runtime
intent: 024-repository-streamlining
status: complete
priority: must
created: "2026-09-06T21:28:53Z"
assigned_bolt: 069-retired-runtime
implemented: true
---

# US-177: Remove Retired Mutation Workflows

As the owner, I want the reviewed cleanup completed so current behavior has one clear implementation and useful evidence.

## Acceptance Criteria

- [x] Remove retired mutation and rebooking code and dedicated behavior tests; keep account synchronization as the sole production writer and preserve migration/purge contracts.
- [x] Relevant surviving safety, migration and regression contracts pass.
- [x] No unrelated user work or active branch is lost.
