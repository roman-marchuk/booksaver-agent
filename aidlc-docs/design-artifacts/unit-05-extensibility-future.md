# Unit 5 — Extensibility (Future)

**Tag:** Future — **not implemented in MVP**  
**Build order:** Post-MVP (after Units 1–4)

## Purpose

Documents extension points for adding a second booking platform and non-hotel product types without rewriting the core daemon. MVP code in Units 1–4 should leave hooks (e.g. platform field on `Booking`, adapter interface for check/compare/rebook) but this unit’s stories are **not** delivered until after the Booking.com hotel MVP is working.

## Dependencies on other units

| Unit | Relationship |
|------|--------------|
| **Unit 1** | `Booking` model should carry `platform` and `product_type` fields; registry validates per adapter |
| **Unit 2** | Monitor logic becomes one implementation of a `PlatformAdapter` interface |
| **Unit 3** | Equivalence rules become selectable per `product_type` |
| **Unit 4** | Rebook flow delegates destructive browser steps to platform adapter |

No MVP unit is blocked on completing Unit 5; design hooks only.

## Downstream consumers

Future platform and product implementations plug into the adapter interfaces defined when this unit is built.

## Loose coupling / interfaces (design-level, future)

| Interface | Responsibility |
|-----------|----------------|
| `PlatformAdapter` | authenticate, run_check, guided_rebook for one OTA/site |
| `EquivalencePolicy` | rules keyed by `product_type` (hotel, flight, …) |
| `Booking.platform` | routes check/notify/rebook to correct adapter |

MVP hard-codes `platform=booking_com` and `product_type=hotel`; Unit 5 generalizes without changing MVP behavior.

## Recommended implementation order (within unit)

1. US-015 — Platform adapter interface and second-platform stub
2. US-016 — Product-type-specific equivalence policies

---

## Assigned user stories

### US-015 Add a second booking platform — Future

**As a** user  
**I want** to plug in another OTA or airline site later  
**So that** I am not locked to Booking.com forever  

**Acceptance criteria**

- Given a platform adapter interface exists in design
- When a new adapter is implemented
- Then registration, check, compare, notify, and rebook flows can route per booking’s platform
- And Booking.com hotel behavior remains unchanged

---

### US-016 Support non-hotel product types — Future

**As a** user  
**I want** flights or other products with their own equivalence rules  
**So that** the same daemon can expand beyond hotels  

**Acceptance criteria**

- Given a booking type other than hotel
- When registered
- Then equivalence rules are selected per product type
- And MVP hotel rules on Booking.com are unchanged

---

## MVP hook checklist (design-only, no implementation)

When building Units 1–4, prefer:

- `Booking.platform` defaulting to `booking_com`
- `Booking.product_type` defaulting to `hotel`
- Check/compare/rebook modules callable behind a single adapter entry point (even if only one adapter exists)

---

## Future completion criteria (unit-level)

- Second platform can be added without modifying Booking.com hotel code paths.
- Non-hotel bookings use product-specific equivalence while hotel rules stay isolated.
