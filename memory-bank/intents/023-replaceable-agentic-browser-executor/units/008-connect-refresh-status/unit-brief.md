---
unit: 008-connect-refresh-status
intent: 023-replaceable-agentic-browser-executor
status: complete
created: 2026-09-06T19:00:00.000Z
---

# Connect Refresh Status

## Requirements and scope

US-172: Users must understand that successful login starts reservation discovery, not a price
check. Login confirmation must precede automatic refresh completion. Busy price requests must
explicitly say they were not started. A refresh with accepted positive observations must report
success while retaining unseen saved reservations. Genuine failure must remain distinguishable.

Preserve one global browser lock, per-user authorization, existing bounded work, and no request
queue. A competing job winning the post-login lock must produce an accurate refresh-not-started
message rather than implying a refresh was queued. No new API, dependency, database schema,
browser authority, or price evaluation behavior.

## Context and design checkpoint

Telegram login completion -> saved session -> login notification -> automatic inventory admission
-> accepted/declined -> current observations or actual failure -> Telegram completion.

The existing coordinator remains responsible for admission and lock release; presentation owns
the distinction between authentication, inventory discovery, and price checks. Existing ADR-021
serialization, ADR-027 inventory authority, and ADR-039 positive-only reconciliation apply.

## Authorization and plan

The user approved this diagnosed fix through AI-DLC, final merge, and redeployment on
2026-09-06. Proceed through inception and construction checkpoints under that authorization.
Bolt 066 covers one story, US-172. Tests must include fast completion ordering, busy admission,
positive-only success, complete success, real failures, and callback failures without lost login.

## Acceptance

- Login success is delivered before any automatic inventory completion.
- Refresh progress and declined price requests are understandable without implementation jargon.
- Accepted positives are successful discovery; they never authorize deleting unseen reservations.
- Error reports do not falsely imply successful price execution or queued work.

