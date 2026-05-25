# Unit 4 — Guided Rebook

**Tag:** MVP  
**Build order:** 4

## Purpose

Provides an opt-in, user-controlled rebook flow after a savings opportunity is detected. Browser automation prepares cancel/rebook steps but **never** executes destructive actions without explicit local confirmation. Maintains a local audit trail of rebook sessions.

## Dependencies on other units

| Unit | What this unit needs |
|------|----------------------|
| **Unit 1 — Core & Local Data** | `Booking` records, local log/storage paths, config |
| **Unit 2 — Booking.com Price Monitor** | Browser session and automation primitives for Booking.com manage/rebook pages |
| **Unit 3 — Savings Detection & Notifications** | `SavingsOpportunity` (or user-initiated rebook for a known booking id from alert) |

## Downstream consumers

None for MVP. This is the terminal user-facing workflow slice.

## Loose coupling / interfaces (design-level)

| Consumes | Source |
|----------|--------|
| `SavingsOpportunity` / `booking_id` | Unit 3 alert or CLI invocation |
| `BrowserSession` | Unit 2 — shared session interface, not reimplemented login |
| `LocalStore` | Unit 1 — append rebook audit events |

| Emits | Description |
|-------|-------------|
| `RebookEvent` | Local audit log: started, confirmation_requested, confirmed, declined, completed, error |

Confirmation UI is local-only (CLI prompt or equivalent); no web frontend.

## Recommended implementation order (within unit)

1. US-010 — Opt-in rebook session; no action without user intent
2. US-011 — Mandatory confirmation gates before cancel or purchase
3. US-012 — Local audit trail for all rebook events

---

## Assigned user stories

### US-010 Start guided rebook only after explicit intent — MVP

**As a** user  
**I want** to opt in before any rebook automation runs  
**So that** nothing is cancelled or purchased without my approval  

**Acceptance criteria**

- Given a savings alert
- When I have not started a rebook session
- Then the daemon performs no cancel or purchase actions
- When I explicitly start guided rebook for that booking id
- Then browser automation prepares the rebook path but waits at confirmation gates

---

### US-011 Mandatory confirmation before cancel or purchase — MVP

**As a** user  
**I want** a clear confirmation step before cancel or new booking  
**So that** I remain in control of money and itinerary changes  

**Acceptance criteria**

- Given an active guided rebook session
- When the flow reaches a cancel-existing or confirm-new-booking action
- Then the daemon stops and presents what will happen (old vs new price, refundability summary)
- And it requires explicit yes/no confirmation from me in the local interface
- When I decline
- Then no cancel or charge occurs and the session ends safely
- When I confirm
- Then automation may proceed only for that single approved action
- And each subsequent destructive step requires a new confirmation

---

### US-012 Log rebook outcomes locally — MVP

**As a** user  
**I want** a local audit trail of rebook attempts  
**So that** I can troubleshoot what the agent did on my behalf  

**Acceptance criteria**

- Given any guided rebook session
- When steps complete or fail
- Then events (started, confirmation requested, confirmed, cancelled by user, completed, error) are appended to local logs/storage
- And logs stay on my machine

---

## Cross-cutting constraint (from Unit 1)

**US-013:** Rebook sessions, confirmations, and audit logs are stored locally only; no BookSaver cloud orchestration.

---

## MVP completion criteria (unit-level)

- User can start rebook only via explicit local command after an alert.
- Every cancel/charge step stops for yes/no confirmation.
- Full rebook session history is queryable from local logs.
