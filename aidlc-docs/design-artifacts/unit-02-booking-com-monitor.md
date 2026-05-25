# Unit 2 — Booking.com Price Monitor

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

## Assigned user stories

### US-004 Store Booking.com session locally — MVP

**As a** user  
**I want to** authenticate to Booking.com in a browser context the daemon controls  
**So that** automated checks can reach my manage-booking pages  

**Acceptance criteria**

- Given browser automation is configured
- When I complete login (or refresh session) through the supported local flow
- Then session cookies or credentials are stored only on my machine
- And the daemon can reuse the session for scheduled checks until expiry
- And session expiry surfaces a local alert telling me to re-authenticate

---

### US-005 Run scheduled browser check — MVP

**As a** user  
**I want** the daemon to periodically open my booking on Booking.com via browser automation  
**So that** I get an up-to-date live price without manual visits  

**Acceptance criteria**

- Given a registered booking and valid local session
- When the schedule triggers
- Then the daemon launches browser automation against Booking.com (not a travel API)
- And it navigates to the booking’s manage/view flow for that reservation
- And each run appends a check record (timestamp, outcome, raw price if parsed) to local storage
- And transient failures are logged and retried without deleting the booking

---

### US-006 Extract booking and offer data with LLM — MVP

**As a** user  
**I want** the system to use an LLM to interpret complex booking pages  
**So that** price and policy details are extracted reliably when the DOM is messy  

**Acceptance criteria**

- Given a Booking.com page is loaded in the automated browser
- When structured selectors are insufficient or ambiguous
- Then the daemon invokes the configured LLM API with page context for extraction/reasoning
- And extracted fields include at minimum: current total price, currency, and cancellation/refund indicators
- And LLM API keys are read from local config only
- And extraction failures are logged and do not crash the daemon

---

### US-014 Handle check failures gracefully — MVP

**As a** user  
**I want** failed checks to be visible but non-fatal  
**So that** one broken session does not delete my monitoring setup  

**Acceptance criteria**

- Given a check fails (network, captcha, layout change, LLM error)
- When the run ends
- Then failure reason is logged locally
- And the booking remains registered for the next scheduled run
- And repeated failures can trigger a local warning (configurable threshold) — MVP: log + optional single alert

---

## Cross-cutting constraint (from Unit 1)

**US-013:** Session cookies, check records, and logs remain on the user’s machine only; browser automation uses Booking.com directly, not a travel API.

---

## MVP completion criteria (unit-level)

- On schedule, daemon opens each registered booking on Booking.com via browser automation.
- LLM extraction populates `CheckResult` when checks succeed.
- Failed checks are logged; bookings are never removed due to check failure.
