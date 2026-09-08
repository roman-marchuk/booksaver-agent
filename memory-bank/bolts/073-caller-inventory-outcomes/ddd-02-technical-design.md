---
stage: design
bolt: 073-caller-inventory-outcomes
created: 2026-09-08T22:00:05Z
---

# Technical Design: Caller Inventory Outcomes

## Architecture and API contract

Retain the provider-neutral inventory executor, code-owned validation, positive-only reconciliation,
caller-bound repositories, and Telegram adapter. Add `InventoryExecutionStatus.EMPTY_UPCOMING`
with value `empty_upcoming` for the initial code-owned preflight only. Before starting the model,
read the active rendered page's CDP `bodyText`, then recognize the authenticated exact
`secure.booking.com/mytrips.html` destination with the expected Bookings & Trips / Active context
and Booking.com's explicit empty-state sentence. The rendered body is transient evidence and is
not persisted in diagnostics. A generic browser-state summary or missing representation cannot
replace this page evidence. Recheck authentication, destination, runtime safety, and resource limits
after the awaited read so a stale pre-await result cannot authorize the empty outcome.

Reject a conflicting visible booking count using strict standalone booking-count evidence. A footer
such as `2026 Booking.com` is not a reservation count and must not defeat a valid empty marker. A
blank, unknown, signed-out, redirected, or merely model-declared empty view does not satisfy the
contract. Provider terminal parsers reject this enum value. Exact regressions cover the real footer
false positive as well as genuine contradictory booking counts and missing authenticated evidence.

The validator maps accepted empty evidence to incomplete inventory with zero positive observations.
`SynchronizationReport.upcoming_empty_observed` is true only for the validated empty outcome.
Persist/reload via the existing caller-scoped execution metric terminal status, additionally gated
by incomplete completeness, no failure, and zero discovered records. No database migration, new
secret, dependency, routing mode, or absence-reconciliation path is introduced.

For guarded `done(false)`, preserve only buffered positive identities that have already passed
existing validation and the current-run evidence map. Traversal remains incomplete. Do not rescue
runtime authentication, unsafe-action, time, action, or cost failures. A saved/current identity
conflict remains rejected; the model cannot turn a changed confirmation or stay into a saved match.

## Presentation

A shared Telegram guidance helper maps closed failure categories to a plain next action; raw
failure detail and reason codes stay out of user text. Login success confirms a saved login only.
Refresh results distinguish accepted positives, observed empty upcoming, failure, and previously
saved reservations. An observed empty page does not assert that retained saved rows are cancelled,
missing, or safe to delete. Partial success does not claim a complete account refresh.

Status replaces technical session wording with saved/expired/sign-in-needed and readable UTC dates.
Missing post-save validation is not presented as a login failure. Busy or stopping admission states
that loading has not started; it never claims a request is queued. Initial login instructions retain
the supported sign-in methods and prohibition on sending passwords in Telegram.

## Privacy, limits, and operational verification

Retain the exact selected caller, routing, current disclosure, and caller-owned session for isolated
replay. Production state is read-only source material; replay works on an isolated copy, suppresses
notifications and authoritative writes, and excludes concurrent daemon/browser work using the
existing operational pause/lease boundary. Restore service and verify process, logs, health, ports,
and dependencies after any operational pause or release.

Evaluate unchanged saved match, authenticated explicit-empty, and changed/new-identity cases
separately. A successful owner replay is not invited-user evidence. The father's actual mismatch
requires his own replay; a passed inventory replay still does not establish eligible price results
or a successful user Telegram interaction. Broad
privacy-sensitive page/identity data is not copied into artifacts; retain bounded/redacted evidence.

## Verification and completion criteria

Focused tests cover positive preservation, runtime guard/limit precedence, false-empty evidence,
provider rejection of empty status, non-destructive reconciliation, caller-scoped metric reload,
and plain Telegram branches. Follow with the repository quality gate and isolated caller replay.
Record test results only after observed completion, and keep staging, deployed inventory acceptance,
and real Telegram/price acceptance distinct. Conditional merge/deployment also requires a successful
current-head Cursor Bugbot gate and operations verification; missing evidence blocks that release
step, not continued safe local diagnosis.

## ADR analysis and checkpoint

Existing ADR-021 serialization, ADR-027/028 inventory authority, ADR-039 positive-only reconciliation,
ADR-044 shared inventory execution, and ADR-045 disclosed caller routing cover this correction.
No new architecture or authority decision is required. The user's standing authorization covers
the narrow design and construction checkpoints; release remains conditional on verified scope and
the repository gates. Construction and both isolated live caller criteria are complete; final release/deployed
acceptance remains separate.

## 2026-09-08T22:09:01Z - Qualification update

The father's isolated normal-coordinator replay on the production image with candidate source
accepted two current reservations (incomplete traversal, no failure, zero price-eligible records).
The separate explicit-empty account exposed the footer false-positive detector bug described above;
that correction and exact regression are implemented. The corrected empty replay subsequently passed
with incomplete/no-failure/zero-positive outcome, no model cost, and 29390 ms duration. Final quality
gate and restored-service health verification subsequently passed; see the test report. Release
review, merge, deployment, and deployed acceptance remain separate.
