---
id: 001-explain-connect-refresh-lifecycle
unit: 008-connect-refresh-status
intent: 023-replaceable-agentic-browser-executor
status: complete
priority: must
created: 2026-09-06T19:00:00.000Z
assigned_bolt: 066-connect-refresh-status
implemented: true
---

# US-172: Explain the connect refresh lifecycle

As a user, I want login, reservation discovery, and price-check states reported accurately so I
know when to wait and when to submit a price check.

## Acceptance Criteria

- Login confirmation precedes immediate refresh completion, including synchronous test callbacks.
- Post-connect discovery announces its work before admission and accurately reports busy refusal.
- Positive-only discovery with no failure reports found/eligible counts, no retry instruction.
- Empty, rejected, or failed observations do not become success merely through message formatting.
- Busy price requests explicitly were not started; no hidden queue or overlapping browser work.
- Existing authentication and global browser lock behavior remain verified.

