---
stage: model
bolt: 066-connect-refresh-status
created: 2026-09-06T19:00:00Z
---

# Domain Model

Authentication success means a verified session was saved. Reservation discovery is a separate
operation. Price checking is a third operation that users request after discovery.

The coordinator owns one browser lease. Busy admission means no new work was started or queued.
The inventory report contains completeness, failure, discovered count, and eligible count.
Accepted positive observations establish current reservation presence while preserving unseen
saved entries; this is successful discovery without complete account traversal.

Events: session saved, login announced, refresh announced, refresh admitted/declined, refresh
completed. User-visible ordering must preserve announcement before completion. Existing session
and inventory repositories and their authorization boundaries remain unchanged.
