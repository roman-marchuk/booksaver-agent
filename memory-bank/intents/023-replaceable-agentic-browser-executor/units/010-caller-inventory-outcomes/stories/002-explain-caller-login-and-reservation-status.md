---
id: 002-explain-caller-login-and-reservation-status
unit: 010-caller-inventory-outcomes
intent: 023-replaceable-agentic-browser-executor
status: complete
priority: must
created: 2026-09-08T21:59:19Z
assigned_bolt: 073-caller-inventory-outcomes
implemented: true
---

# US-185: Explain caller login and reservation status plainly

As a user, I want short messages explaining what worked, what failed, and what to do next so
I can use BookSaver without understanding browser execution or synchronization terminology.

## Acceptance Criteria

- Successful login means a saved login and remains separate from loading reservations or checking
  prices; progress and failure messages preserve that distinction.
- Loading failure preserves and labels saved reservations instead of exposing internal detail,
  enum values, provider prose, or claiming that the account has no reservations.
- An observed empty upcoming page has a distinct message; any previously saved reservations are
  explicitly described as saved, without an absence-based deletion claim.
- Accepted partial positives are described plainly without claiming the whole account is current.
- Expired-login and personal-key failures retain their respective reconnect/key recovery actions;
  ordinary loading failures point to retrying /bookings rather than repeated sign-in.
- Status says login saved instead of implying inventory success; dates are readable with explicit
  UTC because no caller-local timezone is established. Missing validation is not a login failure.
- Busy or stopping admission never implies queued work; authentication security instructions remain.

## Dependencies

US-184 supplies the distinct empty outcome. Existing Telegram sender scoping remains unchanged.

## Completion

Construction verified 2026-09-08T22:10:41Z; final gate and both caller-specific isolated replays passed.
Release checks and deployed acceptance remain separate. See Bolt 073 test report.
