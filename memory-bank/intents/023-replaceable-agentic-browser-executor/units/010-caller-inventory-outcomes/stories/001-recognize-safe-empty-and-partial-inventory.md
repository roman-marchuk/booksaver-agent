---
id: 001-recognize-safe-empty-and-partial-inventory
unit: 010-caller-inventory-outcomes
intent: 023-replaceable-agentic-browser-executor
status: complete
priority: must
created: 2026-09-08T21:59:19Z
assigned_bolt: 073-caller-inventory-outcomes
implemented: true
---

# US-184: Recognize safe empty and partial inventory outcomes

As an invited user, I want BookSaver to recognize the reservation state my account actually
shows so an empty page or unfinished account traversal does not become a generic loading failure.

## Acceptance Criteria

- An authenticated initial canonical upcoming page with recognized explicit empty evidence can
  produce a code-owned empty-upcoming outcome before paid model work.
- Missing authentication, wrong destination, visible booking-count conflict, or ambiguous evidence
  cannot produce that outcome; model/provider terminal submissions cannot manufacture it.
- Empty-upcoming is an incomplete, zero-positive result. Saved reservations remain intact and no
  current-run monitoring receipt is granted by absence.
- A non-successful agent finish retains already validated positive identities using the existing
  current-run evidence map without claiming account-wide completeness.
- Authentication, unsafe-action, deadline, action, and cost failures retain their precedence.
- Invalid or conflicting identity facts are never accepted merely to recover a partial result.

## Dependencies

Existing positive-only inventory validation, runtime guards, and caller-bound execution metrics.
No absence authority, transaction action, identity-policy relaxation, or same-job fallback.

## Completion

Construction verified 2026-09-08T22:10:41Z; final gate and both caller-specific isolated replays passed.
Release checks and deployed acceptance remain separate. See Bolt 073 test report.
