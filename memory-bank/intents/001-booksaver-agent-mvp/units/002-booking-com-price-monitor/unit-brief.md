# Unit Brief: Booking.com Price Monitor

**Unit ID:** `002-booking-com-price-monitor`  
**Intent:** `001-booksaver-agent-mvp`  
**Status:** MVP  
**Build order:** 2

**Tag:** MVP  
**Build order:** 2

## Purpose

Automates periodic price checks for registered Booking.com hotel bookings using browser automation and LLM-assisted page interpretation. Manages local Booking.com session state and records check outcomes resiliently. Does not compare prices or notify—that is Unit 3.

## Dependencies on other units

| Unit | What this unit needs |
|------|----------------------|
| **Unit 1 — Core & Local Data** | Config (interval, paths, LLM/browser settings), registered `Booking` records, scheduler hook, `LocalStore` for check history |

## Downstream consumers

- **Unit 3** consumes successful `CheckResult` payloads (price, currency, refund flags, equivalence fields).
- **Unit 4** reuses browser session management and automation primitives from this unit.

## Loose coupling / interfaces (design-level)

| Consumes | From Unit 1 |
|----------|-------------|
| `Booking` | booking id, confirmation id, dates, property, room type |
| `Config` | browser/LLM settings, data paths |

| Emits | To Unit 3 |
|-------|-----------|
| `CheckResult` | `booking_id`, `timestamp`, `outcome` (success/failure), `live_total`, `currency`, `refund_indicators`, extracted property/room/dates for equivalence, `failure_reason` if failed |

Session storage (US-004) is internal to this unit; Unit 4 accesses it through a shared browser/session interface, not by duplicating login logic.

## Recommended implementation order (within unit)

1. US-004 — Booking.com session authenticate and persist locally
2. US-005 — Scheduled browser navigation to manage-booking flow
3. US-006 — LLM extraction when DOM parsing is insufficient
4. US-014 — Failure logging, retry behavior, optional repeated-failure warning

---

## Story Files

- `US-004`
- `US-005`
- `US-006`
- `US-014`

## Cross-cutting constraint (from Unit 1)

**US-013:** Session cookies, check records, and logs remain on the user’s machine only; browser automation uses Booking.com directly, not a travel API.

---

## MVP completion criteria (unit-level)

- On schedule, daemon opens each registered booking on Booking.com via browser automation.
- LLM extraction populates `CheckResult` when checks succeed.
- Failed checks are logged; bookings are never removed due to check failure.
