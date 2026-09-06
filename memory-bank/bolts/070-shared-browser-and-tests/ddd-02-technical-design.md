---
stage: design
bolt: 070-shared-browser-and-tests
created: 2026-09-06T21:28:53Z
---

# Technical Design

Extract a shared Browser Use session host from inventory internals with public narrow lifecycle methods and a shared Agent configuration factory; capability-specific registries and output mapping remain separate. Consolidate pure normalization/provenance functions and packaged replay corpus. Use small explicit test builders and constructor spies rather than generic frameworks or reduced coverage.

## ADR analysis

This applies existing ADR-027, ADR-036, ADR-039 and ADR-043 boundaries. No new technology, public behavior or destructive schema transition is chosen. Shared runtime extraction is an internal ownership correction, not a new executor/fallback. No new ADR is required; retain historical decisions and record retirement in the construction log.

## Verification

Use focused checks for each changed boundary, then integration-wide Ruff, mypy, pytest, CLI smoke, canonical artifact/status validators and diff checks. Negative fixtures must prove validator defects are fixed; migration and user-scope tests must cover retained compatibility. Review branch deletion state independently of code quality.
