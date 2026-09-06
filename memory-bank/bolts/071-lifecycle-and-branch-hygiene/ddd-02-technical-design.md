---
stage: design
bolt: 071-lifecycle-and-branch-hygiene
created: 2026-09-06T21:28:53Z
---

# Technical Design

Read canonical memory-bank.yaml in existing validators, traverse declared timestamp fields including stage arrays, validate intent-scoped unit/bolt links and index membership; post-fix revalidate and fail on residual errors. Keep check entrypoints small and document them. Remove current-state counters from prose; annotate historical metadata uncertainty without inventing dates. For branch deletion, record names/SHAs and policy, reject moved refs, preserve active checkouts and untracked work, and verify remote/local absence.

## ADR analysis

This applies existing ADR-027, ADR-036, ADR-039 and ADR-043 boundaries. No new technology, public behavior or destructive schema transition is chosen. Shared runtime extraction is an internal ownership correction, not a new executor/fallback. No new ADR is required; retain historical decisions and record retirement in the construction log.

## Verification

Use focused checks for each changed boundary, then integration-wide Ruff, mypy, pytest, CLI smoke, canonical artifact/status validators and diff checks. Negative fixtures must prove validator defects are fixed; migration and user-scope tests must cover retained compatibility. Review branch deletion state independently of code quality.
