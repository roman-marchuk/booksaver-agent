---
unit: 001-core-local-data
bolt: 002-core-local-data
stage: model
status: complete
updated: 2026-06-17T21:10:00Z
---

# Domain Model — Daemon Lifecycle & Scheduler

> Scope: Bolt `002-core-local-data` — story **US-001** (run BookSaver as a local daemon).
> Builds on the Config and LocalStore foundation from Bolt 001. No source code is produced
> in this stage.

## Bounded Context

**Daemon Lifecycle & Scheduler** is the runtime layer of the Core & Local Data context. It
is responsible for:

1. **Process lifecycle** — starting BookSaver as a local background process, running until
   explicitly stopped, and shutting down cleanly without corrupting local state.
2. **Scheduled execution** — firing registered jobs at the interval defined in `Config`, and
   exposing a hook so that Unit 2 (BookingComMonitor) can register its check job.

This context owns the PID file, signal handling, and the scheduler loop. It consumes `Config`
(for `checkInterval` and `dataDirectory`) and `LocalStore` (to confirm the data directory is
accessible before starting) from Bolt 001. It does not own monitoring, savings detection,
or rebook logic — those are registered as jobs.

## Domain Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **DaemonProcess** | `pid` (int), `dataDirectory`, `startedAt`, `status` (`starting` / `running` / `stopping` / `stopped`) | Only one daemon instance per `dataDirectory` at a time (enforced via PID file); transitions are `starting → running → stopping → stopped`; must reach `stopped` before the process exits |
| **PidFile** | `path` (inside `dataDirectory`), `pid` (int) | Created on successful start; removed on clean stop; if present on startup, indicates a prior unclean exit — daemon refuses to start and reports the stale PID |
| **ScheduledJob** | `name` (string), `handler` (callable), `registeredAt` | Registered before the scheduler loop starts; `name` is unique within the scheduler; handler is invoked on each tick |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **DaemonStatus** | enum: `starting`, `running`, `stopping`, `stopped` | Transitions only in order; no backward transitions |
| **JobName** | `value` (string) | Non-empty, unique within the scheduler; used for logging and diagnostics |
| **TickResult** | `jobName`, `success` (bool), `errorMessage` (optional string), `executedAt` | Captured per job per tick; errors are logged but do not stop the scheduler loop |

## Aggregates

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **DaemonProcess** | `PidFile`, `DaemonStatus` | Single instance per data directory; PID file must exist while status is `running`; PID file must be removed on `stopped` |
| **Scheduler** | `ScheduledJob[]`, `CheckInterval` | At least one job registered before loop starts; interval is the same `CheckInterval` from `Config`; all jobs run on every tick |

## Domain Events

| Event | Trigger | Payload |
|-------|---------|---------|
| **DaemonStarted** | Daemon reaches `running` status | `pid`, `dataDirectory`, `checkInterval`, `startedAt` |
| **DaemonStopped** | Daemon reaches `stopped` status | `pid`, `stoppedAt`, `reason` (`signal` / `command` / `error`) |
| **DaemonStartFailed** | Startup fails (e.g. stale PID file, unreadable data directory) | `reason`, `dataDirectory` |
| **JobTickCompleted** | All jobs have run for one interval | `tick` (int), `results` (`TickResult[]`), `nextTickAt` |
| **JobFailed** | A job raises an unhandled exception | `jobName`, `errorMessage`, `tickNumber` |

> Events are realized as structured local log entries (same approach as Bolt 001 — no
> event bus in a single-process CLI).

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **DaemonLifecycleService** | `start(config) -> DaemonProcess` — verify no existing PID file, write PID file, transition to `running`, start scheduler loop; `stop(daemon) -> void` — send stop signal, wait for clean exit, remove PID file, transition to `stopped` | `Config`, `LocalStore` (to verify data directory), `Scheduler` |
| **Scheduler** | `register(job: ScheduledJob) -> void` — add job to the run list; `run(interval) -> void` — block in a loop, sleeping `interval` between ticks, calling all registered handlers per tick, capturing `TickResult` for each | `CheckInterval` (from `Config`) |

## Repository / Port Interfaces

No new repository is introduced. The `Scheduler` is a domain service, not a persistence
concern. The daemon uses:

- `ConfigSource` (from Bolt 001) — to read `checkInterval` and `dataDirectory`
- `LocalStore` (from Bolt 001) — to verify the data directory is accessible at startup

## Ubiquitous Language Additions

| Term | Meaning |
|------|---------|
| **Daemon** | A local background process running BookSaver; owned by one user, one machine |
| **PID file** | A small file in the data directory holding the running process's PID; used as a single-instance lock |
| **Scheduler loop** | The main loop that sleeps for `checkInterval`, then calls all registered job handlers |
| **Job** | A named handler registered with the Scheduler; the only job in MVP is the Booking.com price check (registered by Unit 2) |
| **Tick** | One iteration of the scheduler loop — all registered jobs run once per tick |
| **Stale PID file** | A PID file whose PID refers to a process that is no longer running; indicates an unclean prior exit |
| **Clean stop** | Daemon receives a stop signal, finishes any in-progress tick, removes the PID file, and exits with code 0 |

## Forward References

- Unit 2 (`002-booking-com-price-monitor`) registers a `ScheduledJob` named `booking_com_check`
  against the `Scheduler` before the loop starts.
- The `Scheduler.run()` signature is the stable hook that downstream units depend on;
  its internal implementation (stdlib vs. third-party library) is an ADR candidate for
  Stage 3 of this bolt.
