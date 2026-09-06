---
stage: test
bolt: 071-lifecycle-and-branch-hygiene
created: 2026-09-06T22:05:17Z
---

# Test Report

Sixteen Node tests cover schema/path parity, scoped references, index totals/duplicates/identity, nested timestamp errors, chronology/provenance, residual post-fix errors, status/completion scoping, and parsed Compose policy. Branch deletion was verified locally and remotely; active task/worktree material was preserved.

## Integrated evidence

The final integrated gate passed against main `4b52ea3`: 1,726 Python tests, Ruff, strict mypy
over 115 source files, 16 Node tests, CLI smoke and installed-wheel fixture verification.
The [consolidated cleanup report](../../intents/024-repository-streamlining/cleanup-report.md)
records commands/results, independent findings and fixes, historical warnings and offline limits.

No new live Booking.com qualification or cleanup code publication is claimed.
