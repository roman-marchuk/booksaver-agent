# Unit Brief: Savings Detection & Notifications

**Unit ID:** `003-savings-detection-notifications`  
**Intent:** `001-booksaver-agent-mvp`  
**Status:** MVP  
**Build order:** 3

**Tag:** MVP  
**Build order:** 3

## Purpose

Evaluates successful check results against registered booking baselines using pragmatic equivalence and refundability rules. When a valid savings opportunity exists, sends email and Telegram alerts. Pure domain logic plus notification adapters—no browser automation in this unit.

## Dependencies on other units

| Unit | What this unit needs |
|------|----------------------|
| **Unit 1 — Core & Local Data** | `Booking` baselines, notification settings from config |
| **Unit 2 — Booking.com Price Monitor** | `CheckResult` from successful checks (price, currency, refund flags, dates/property/room) |

## Downstream consumers

- **Unit 4 — Guided Rebook** consumes `SavingsOpportunity` events and alert pointers to start a rebook session.

## Loose coupling / interfaces (design-level)

| Consumes | Source |
|----------|--------|
| `Booking` | Unit 1 — baseline price, currency, dates, property, room type |
| `CheckResult` | Unit 2 — live price, currency, refund indicators, extracted equivalence fields |

| Emits | To Unit 4 |
|-------|-----------|
| `SavingsOpportunity` | `booking_id`, `baseline_total`, `live_total`, `currency`, `amount_saved`, `percent_saved`, `validated_at` |

Notification channels (email, Telegram) are pluggable adapters reading credentials from Unit 1 config.

## Recommended implementation order (within unit)

1. US-008 — Equivalence and refundability rules (gates all savings detection)
2. US-007 — Price comparison against baseline
3. US-009 — Email and Telegram notification on validated opportunity

---

## Story Files

- `US-007`
- `US-008`
- `US-009`

## Cross-cutting constraint (from Unit 1)

**US-013:** Notification credentials and savings history remain local; alerts are sent directly via user-configured email/Telegram, not through a BookSaver cloud relay.

---

## MVP completion criteria (unit-level)

- Cheaper, pragmatically equivalent, refundable offers trigger email + Telegram alerts.
- Non-equivalent or non-refundable offers are silently skipped (logged locally).
- Alerts include enough detail to start guided rebook (Unit 4).
