# Unit Brief: Guided Rebook

**Unit ID:** `004-guided-rebook`  
**Intent:** `001-booksaver-agent-mvp`  
**Status:** MVP  
**Build order:** 4

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

## Story Files

- `US-010`
- `US-011`
- `US-012`

## Cross-cutting constraint (from Unit 1)

**US-013:** Rebook sessions, confirmations, and audit logs are stored locally only; no BookSaver cloud orchestration.

---

## MVP completion criteria (unit-level)

- User can start rebook only via explicit local command after an alert.
- Every cancel/charge step stops for yes/no confirmation.
- Full rebook session history is queryable from local logs.
