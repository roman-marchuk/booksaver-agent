---
unit: 001-retired-runtime
intent: 024-repository-streamlining
status: complete
created: "2026-09-06T21:28:53Z"
---

# Retired Runtime

## Scope

- US-177: Remove retired mutation and rebooking code and dedicated behavior tests; keep account synchronization as the sole production writer and preserve migration/purge contracts.
- US-178: Remove the retired manage-page monitor, unused batch/global-session APIs, null repositories, and dead compatibility wrappers; retain authenticated deterministic rollback.

## Contracts

Preserve current runtime boundaries and rollback routes. Follow requirements.md and bolt 069-retired-runtime; current user authorization covers the reviewed cleanup. Tests must exercise surviving behavior and compatibility obligations. No production data or service changes.
