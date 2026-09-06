# Repository Cleanup Handoff

Construction completed on `codex/streamline-retired-code`; the reviewed cleanup is now committed
and submitted in PR #49 under the owner's subsequent release authorization. Current main PR #48
was integrated while preserving other tasks' work. Merge/deployment are blocked by Bugbot usage
limits; see the [release preflight](../../operations/releases/repository-streamlining-preflight.md).
The user-authorized branch deletion is complete.

## Result

The cleanup removes **9,876 net physical lines** from source and tests, including new shared
files: 4,410 source lines and 5,466 test/fixture lines. This includes retiring obsolete behavior,
not merely reducing test assertions. Surviving safety/regression cases remain covered.

## Audit disposition

| Audit item | Delivered result |
|---|---|
| 1. Retired manual CRUD/rebooking | Removed domain/application/Telegram behavior, mutation ports/repositories and dedicated tests. Old schema tables, migration and purge SQL retained; purge compatibility tested. |
| 2. Old monitor/global sessions | Removed manage-page monitor, plaintext repository/manager, null adapter and unused batch API. Authenticated deterministic search remains. |
| 3. Compatibility helpers | Removed OwnerGuard, dead factories/binding/click wrappers, lease booking_id alias and dead incident projection. Moved executor fakes to tests/support; application services use SessionLeaseBroker. |
| 4. Runtime cache deletion | CLI no longer recursively deletes Python package caches. |
| 5. Duplicate mappings | One terminal-provenance mapping and common Browser Use scalar/tri-state normalization. |
| 6. Browser Use coupling | Explicit shared session host, Agent/model configuration, guards and lifecycle. Price/inventory capability registries and results remain separate. |
| 7. Duplicate fixtures | One packaged six-fixture corpus; isolated installed-wheel loading verified. |
| 8. Repeated test setup | Small coordinator and budget-model builders preserve separate race, cancellation, admission, revocation and cap tests. |
| 9. Weak assertions | Exact key/model/decryption matrix; model-free remote-auth runtime assembly/execution sentinels; parsed Compose and active Docker/Caddy directives. |
| 10. Stale orientation docs | Removed volatile counters and linked canonical status/dependency sources. |
| 11. AI-DLC validator gaps | Schema paths/parity, scoped references, index membership/count/identity, nested timestamps, chronology/provenance, truthful post-fix exits and completion-stage parsing; 16 Node tests. |
| 12. Historical chronology | Preserved originals and recorded explicit uncertainty for irreconcilable timestamps in Bolts 006, 051 and 066. No guessed historical execution times. |
| 13. Obsolete branches | Deleted 18 local and 16 remote refs with expected-SHA protection and verified absence. Current viewer, diagnostics, performance and issue-3 work preserved. |

The lower-priority semantic-proof types and inactive classifier/inventory helpers were also
removed after call-site review established they were superseded. The active page resolver,
CodeVerificationReceipt and negative-inventory protections remain. Historical ADRs are retained.

## Verification

- **1,768 Python tests passed** after PR #48 integration, 52 existing schedule deprecation warnings, 36.26 seconds.
- **Ruff passed; strict mypy passed over 115 source files.**
- **16 Node policy/validator tests passed.**
- Artifact validation: **0 errors**; status integrity: **0 inconsistencies**, 72 bolts/24 intents.
- CLI help using `PYTHONPATH=src python3 -m booksaver.cli --help` and diff checks passed.
- Built a wheel without resolving dependencies and installed it in an isolated directory.
  All six replay fixtures loaded; retired rebooking/monitor/plaintext-session modules were absent.
- Independent reviews checked retirement/compatibility, test consolidation and browser safety.
  Findings fixed: stale fake methods, ambient-key test leakage, missing runtime-assembly coverage,
  retired occupancy guidance, and a lost one-shot correction-content flag.
- The first full run caught one missed CLI fixture path; it was fixed. The final full run above
  also includes constructor migration of the diagnostics tests newly merged in PR #47.

## Intentionally retained and limitations

Stagehand and deterministic rollback remain under ADR-043. Historical rebook tables remain only
for old database compatibility and purge; no destructive schema migration was introduced.

The validator reports 471 historical warnings: 466 literal millisecond-precision timestamps and
five legacy name-only stage lists whose chronology cannot be reconstructed. These are explicit
warnings, not false clean evidence; widespread cosmetic history rewrites were avoided. Future
serializer updates preserve canonical second precision.

This is offline code/packaging verification, not new live Booking.com qualification. No production
services or account sessions were changed. Code publication/deployment now has owner
authorization, subject to the unresolved merge gate. Current active branches and their worktree files remain available.

See [branch deletion evidence](../../bolts/072-lifecycle-and-branch-hygiene/branch-deletion-report.md)
and the test reports for Bolts [069](../../bolts/070-retired-runtime/ddd-03-test-report.md),
[070](../../bolts/071-shared-browser-and-tests/ddd-03-test-report.md), and
[071](../../bolts/072-lifecycle-and-branch-hygiene/ddd-03-test-report.md).
