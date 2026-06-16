# Unit Brief: Core & Local Data

**Unit ID:** `001-core-local-data`  
**Intent:** `001-booksaver-agent-mvp`  
**Status:** MVP  
**Build order:** 1

**Tag:** MVP  
**Build order:** 1 — **build this unit first**

## Purpose

Provides the foundation for BookSaver Agent as a local Python daemon: process lifecycle, local configuration, booking registration for Booking.com hotels, and local-only persistence. Every other unit depends on this slice. Satisfies the architectural constraint that no centralized BookSaver cloud service is required.

## Dependencies on other units

None. This is the root unit.

## Downstream consumers

- **Unit 2** reads config, scheduler hooks, registered bookings, and persistence paths.
- **Unit 3** reads booking baselines and config for notification settings.
- **Unit 4** reads booking records and local log/storage paths.

## Loose coupling / interfaces (design-level)

| Exposes | Description |
|---------|-------------|
| `Config` | Check interval, data directory, notification credentials (placeholders until Unit 3), LLM/browser settings (placeholders until Unit 2) |
| `Booking` | Registered hotel: confirmation id, dates, property, room type, baseline price/currency, refundability note, platform=`booking_com` |
| `LocalStore` | Read/write bookings and check history under user-configured data directory |
| `Scheduler` | Hook invoked on interval; Unit 2 registers check jobs |
| `DaemonLifecycle` | Start/stop background process without corrupting state |

## Recommended implementation order (within unit)

1. US-002 — Config loading and validation (enables everything else)
2. US-003 — Booking registration and local persistence
3. US-013 — Enforce local-only data paths (woven into store design)
4. US-001 — Daemon start/stop and scheduler wiring

---

## Story Files

- `US-001`
- `US-002`
- `US-003`
- `US-013`

## MVP completion criteria (unit-level)

- Daemon starts/stops locally with configured schedule.
- At least one Booking.com hotel booking can be registered and persisted.
- All data lives under the user’s local data directory; no outbound calls to a BookSaver-hosted service.
