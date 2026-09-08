---
stage: model
bolt: 073-caller-inventory-outcomes
created: 2026-09-08T21:59:37Z
---

# Domain Model: Caller Inventory Outcomes

## Entities and aggregates

A caller owns the Booking.com session, saved reservations, and current inventory run. The session
being saved does not prove that reservation loading or price checking succeeded. Saved reservation
identity and current observed identity remain separate until the existing validator accepts their
relationship. A changed stay or confirmation is not interchangeable with the saved booking.

The current-run inventory aggregate contains validated positive observations, traversal coverage,
terminal outcome, and caller-bound execution identity. It can refresh or insert accepted positive
rows but cannot infer an unseen row's absence. The coordinator owns the single browser lease and
must serialize live replay with the daemon.

## Value objects and invariants

- Empty-upcoming observation: code-observed explicit empty account-page evidence, authenticated
  caller context, exact allowed initial destination, and no conflicting visible booking count.
  This is an informational incomplete outcome, never authoritative account completeness.
- Accepted partial positives: independently validated current-run records retained despite an
  unfinished traversal. Every identity and domain check still applies.
- Failed execution: authentication, unsafe action, timeout, action/cost limit, or other failure;
  retained positives cannot erase a guard failure or grant a receipt for an unseen reservation.
- Caller outcome projection: saved login, empty observation, partial update, or loading failure,
  with caller-owned saved rows and a plain next action. Internal diagnostics are not user prose.

## Services and repository boundaries

Code-owned authentication/page recognition supplies empty evidence; inventory validation decides
whether it is usable. Positive-only reconciliation accepts valid observations and keeps unseen rows.
Existing execution metrics may reload a caller-bound empty flag only when the stored run still
satisfies incomplete, no failure, and zero-positive predicates. No new persistence schema is needed.
Telegram formats the result; it never establishes inventory truth or changes validation decisions.

## Events and language

Login saved precedes loading progress and its outcome. Inventory may report accepted positives,
observed empty upcoming, or failure. A successful login is not a successful price check. Busy means
work was not admitted or queued. Saved means previously recorded; observed means supported by the
current run. Qualification evidence must name which caller case and execution boundary it proves.

## Checkpoint

Model recorded under the user's standing authorization for the narrow correction. Existing
positive-only and caller-isolation authority is retained. No additional consequential tradeoff or
new architecture is introduced. Technical design follows; live acceptance remains pending.
