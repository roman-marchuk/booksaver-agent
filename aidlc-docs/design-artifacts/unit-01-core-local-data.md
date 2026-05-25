# Unit 1 — Core & Local Data

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

## Assigned user stories

### US-001 Run BookSaver as a local daemon — MVP

**As a** user on my own computer  
**I want to** start and stop BookSaver as a background daemon  
**So that** price checks run on a schedule without me keeping a terminal open  

**Acceptance criteria**

- Given BookSaver is installed locally
- When I start the daemon with my local config
- Then it runs as a background process on my machine (not a remote service)
- And scheduled jobs run according to my configured interval
- And I can stop the daemon cleanly without corrupting local state

---

### US-002 Configure daemon locally — MVP

**As a** user  
**I want to** set schedule, paths, and notification settings in local config  
**So that** the tool behaves for my household without a cloud account  

**Acceptance criteria**

- Given a config file or local config directory on my machine
- When I set check interval, data directory, email, and Telegram settings
- Then the daemon loads them on startup
- And secrets are not committed to git or sent to a BookSaver-hosted backend
- And misconfiguration produces a clear local error message

---

### US-003 Register a refundable Booking.com hotel — MVP

**As a** user  
**I want to** register an existing Booking.com hotel booking for monitoring  
**So that** the daemon knows what to watch and my original price baseline  

**Acceptance criteria**

- Given I have a refundable hotel reservation on Booking.com
- When I register the booking (confirmation id, dates, property, room type, amount paid, refundability note)
- Then the booking is stored in local persistence
- And the original total price and currency are recorded as the baseline
- And only Booking.com hotel bookings are accepted in MVP (other types rejected with clear message)

---

### US-013 Operate without a BookSaver cloud — MVP

**As a** user  
**I want** all booking and check data to stay on my machine  
**So that** I am not tied to a vendor account for a personal tool  

**Acceptance criteria**

- Given the daemon is running
- When checks and notifications occur
- Then booking details and history are read/written only to local persistence
- And there is no requirement to register with a centralized BookSaver service

---

## MVP completion criteria (unit-level)

- Daemon starts/stops locally with configured schedule.
- At least one Booking.com hotel booking can be registered and persisted.
- All data lives under the user’s local data directory; no outbound calls to a BookSaver-hosted service.
