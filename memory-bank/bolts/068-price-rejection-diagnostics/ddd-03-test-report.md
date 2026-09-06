---
stage: test
bolt: 068-price-rejection-diagnostics
created: 2026-09-06T21:36:00Z
---

# Test Report

US-174 passes: all five failed evidence predicates, actual room/selection outcomes, successful
and rejected traces, provider/query rejection, and bounded private-data-free output.

- Domain suite: 54 passed. Monitor diagnostics: 10 passed.
- Full suite: 1,977 passed; 55 existing warnings.
- Ruff, mypy (131 source files), CLI smoke, and diff validation passed.
- Tests cover all non-accepting enum variants and simultaneous evidence failures; malicious
  labels, URLs, keys and cancellation text do not reach the new trace projection.
- 25-offer fixture records 20 details and five omitted, but evaluates every candidate and selects
  the cheapest even when its detail is omitted. Matching runs exactly once per accepted offer.
- Diagnostic-builder exception test preserves successful check result and redacts error text.
- Independent review found no acceptance/privacy blocker.

No semantic model or acceptance change. Raw room labels and arbitrary tokens are intentionally
not retained, so lexical hints cannot reconstruct every naming mismatch. Query rejection remains
the first failing query gate; all failed offer-evidence predicates are recorded separately.

Compatibility: this version reads old traces. Older binaries cannot decode the new price_validation
event after rollback; preserve the current image for trace inspection. No database schema change.
