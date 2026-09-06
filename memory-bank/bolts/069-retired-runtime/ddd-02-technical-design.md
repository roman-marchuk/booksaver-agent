---
stage: design
bolt: 069-retired-runtime
created: 2026-09-06T21:28:53Z
---

# Technical Design

Delete unused CRUD/rebooking modules and dedicated feature tests; migrate surviving tests to explicit test-only booking seeding. Remove unused repository mutation/rebook APIs while retaining SQL compatibility cleanup/migrations. Delete unused manage-page monitor and global-session adapters; simplify current monitor constructor and tests around run_authenticated. Remove dead wrappers, lease aliases and runtime cache deletion without weakening type/value checks.

## ADR analysis

This applies existing ADR-027, ADR-036, ADR-039 and ADR-043 boundaries. No new technology, public behavior or destructive schema transition is chosen. Shared runtime extraction is an internal ownership correction, not a new executor/fallback. No new ADR is required; retain historical decisions and record retirement in the construction log.

## Verification

Use focused checks for each changed boundary, then integration-wide Ruff, mypy, pytest, CLI smoke, canonical artifact/status validators and diff checks. Negative fixtures must prove validator defects are fixed; migration and user-scope tests must cover retained compatibility. Review branch deletion state independently of code quality.
