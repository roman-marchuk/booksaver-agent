# Unit 3 — Savings Detection & Notifications

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

## Assigned user stories

### US-007 Compare live price to baseline — MVP

**As a** user  
**I want** the daemon to compare the live equivalent offer to what I paid  
**So that** I only hear about real savings opportunities  

**Acceptance criteria**

- Given a successful check with parsed live price
- When live total is strictly less than my stored baseline (same currency)
- Then the booking is flagged as a potential savings opportunity
- When live total is greater or equal
- Then no savings alert is raised for that run

---

### US-008 Enforce pragmatic equivalence and refundability — MVP

**As a** user  
**I want** “cheaper” to mean same stay and room, still refundable  
**So that** I am not pushed toward worse or non-refundable deals  

**Acceptance criteria**

- Given a candidate live offer
- When dates differ from my registered check-in/out
- Then it is rejected as not equivalent
- When property or room type differs
- Then it is rejected as not equivalent
- When cancellation terms are not refundable (free cancellation / refundable policy absent per extraction)
- Then it is rejected even if price is lower
- When dates, property, and room match and offer is refundable
- Then it may proceed to notification (policy tier may differ from original if still refundable)

---

### US-009 Notify via email and Telegram — MVP

**As a** user  
**I want** email and Telegram alerts when savings are found  
**So that** I can act before the rate changes again  

**Acceptance criteria**

- Given a validated savings opportunity
- When notification runs
- Then I receive an email with booking id, baseline vs live price, and percent/amount saved
- And I receive a Telegram message with the same core facts
- And messages include a pointer to start the guided rebook flow (local CLI or documented command)
- And notification failures for one channel do not block the other (both attempted; failures logged)

---

## Cross-cutting constraint (from Unit 1)

**US-013:** Notification credentials and savings history remain local; alerts are sent directly via user-configured email/Telegram, not through a BookSaver cloud relay.

---

## MVP completion criteria (unit-level)

- Cheaper, pragmatically equivalent, refundable offers trigger email + Telegram alerts.
- Non-equivalent or non-refundable offers are silently skipped (logged locally).
- Alerts include enough detail to start guided rebook (Unit 4).
