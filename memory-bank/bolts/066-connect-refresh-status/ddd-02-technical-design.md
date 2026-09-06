---
stage: design
bolt: 066-connect-refresh-status
created: 2026-09-06T19:02:00Z
---

# Technical Design

Keep remote authentication success and inventory refresh as separate operations under the existing
single browser gate. Send the saved-login notification before invoking the follow-up callback;
the callback announces reservation discovery before submitting it to the coordinator. This orders
even an immediately completed refresh behind its progress announcement. Notification delivery can
fail independently; it must not invalidate an already persisted login.

Extract the post-connect callback into a small testable wiring helper. It recognizes both complete
inventory and accepted positive observations as successful discovery. Positive-only results show
found and eligible counts and explain that other saved reservations were kept. Empty/incomplete,
failure, and unavailable results retain distinct retry guidance.

Busy `/checknow` replies describe browser activity generally and explicitly state no price check
was started. A competing operation can still win the lock after login; the callback must accurately
report that discovery did not start. Do not add queuing, atomic browser handoff, or another lock.

Handle follow-up callback failure separately from successful authentication with a redacted log
and a retry instruction; do not leak exception messages. Preserve callback and gate safety.

Verification: deterministic synchronous callbacks, failed callback, all inventory report branches,
and existing coordinator concurrency tests. Staged image exercises the same wiring and rendering;
production verifies process, health, config, and a bounded notification-free coordinator replay.

ADR analysis: existing ADR-021, ADR-027 and ADR-039 cover these choices; no new architecture or ADR.
