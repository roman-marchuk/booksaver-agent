---
id: 003-qualify-caller-outcomes-with-isolated-replay
unit: 010-caller-inventory-outcomes
intent: 023-replaceable-agentic-browser-executor
status: complete
priority: must
created: 2026-09-08T21:59:19Z
assigned_bolt: 073-caller-inventory-outcomes
implemented: true
---

# US-186: Qualify caller outcomes with isolated replay

As the deployment owner, I want isolated replay evidence for each affected account state so
working owner behavior is not mistaken for proof that an invited user's path works.

## Acceptance Criteria

- Focused tests cover authenticated empty, false/unauthenticated empty, partial positives, invalid
  identities, guard/limit precedence, caller-scoped empty-result reload, and plain message branches.
- An operator replay retains the selected caller, real routing/disclosure checks, and that caller's
  session while using an isolated database/state copy and suppressing notifications.
- Production is only a read source for replay; no authoritative booking/session state is changed.
  The daemon is paused or the existing browser lease otherwise prevents concurrent browser work.
- Evidence separately records unchanged saved-match, explicit-empty, and changed/new-identity cases.
  The father's saved-record mismatch remains inconclusive until his own replay establishes outcome.
- Local tests, staged replay, deployed replay, and Telegram/price acceptance are labeled separately;
  unavailable or failed live evidence is never replaced with owner success or test counts.
- Conditional release requires final-head CI/Bugbot checks and post-deployment service, logs,
  health, ports, and dependencies verification under the operations phase.

## Dependencies

US-184 and US-185; existing operator replay, coordinator, session custody, and operations procedures.
No repeated unsolicited Telegram messages or broadened access to other users' records.

## Completion

Construction verified 2026-09-08T22:10:41Z; final gate and both caller-specific isolated replays passed.
Release checks and deployed acceptance remain separate. See Bolt 073 test report.
