---
id: 001-core-local-data
unit: 001-core-local-data
intent: 001-booksaver-agent-mvp
type: ddd-construction-bolt
status: complete
stories:
  - 002-configure-daemon-locally
  - 003-register-a-refundable-booking-com-hotel
  - 004-operate-without-a-booksaver-cloud
created: 2026-06-16T16:25:59.000Z
started: 2026-06-16T16:27:51.000Z
completed: "2026-06-17T20:54:33Z"
current_stage: null
stages_completed:
  - name: model
    completed: 2026-06-16T18:13:21.000Z
    artifact: ddd-01-domain-model.md
  - name: design
    completed: 2026-06-16T19:28:12.000Z
    artifact: ddd-02-technical-design.md
  - name: adr
    completed: 2026-06-16T19:28:12.000Z
    artifact: adr-001-sqlite-local-persistence.md, adr-002-toml-env-config.md, adr-003-python-311-stdlib-first.md, adr-004-hexagonal-protocol-ports.md
  - name: implement
    completed: 2026-06-16T19:46:17.000Z
    artifact: src/booksaver/ + pyproject.toml
  - name: test
    completed: 2026-06-17T20:47:32.000Z
    artifact: ddd-03-test-report.md
requires_bolts: []
enables_bolts:
  - 002-core-local-data
requires_units: []
blocks: false
complexity:
  avg_complexity: 2
  avg_uncertainty: 2
  max_dependencies: 2
  testing_scope: 2
---

# Bolt: 001-core-local-data

## Overview

First bolt of the BookSaver Agent project. Establishes the static data and configuration
foundation of the local daemon: how the tool is configured, how a refundable Booking.com
hotel booking is represented and persisted, and the local-only data guarantee that every
other unit relies on. Because this is the project's first bolt, its Implement stage also
creates the Python scaffold (project layout, dependency/tooling choices, build/lint/test
commands) currently deferred by `memory-bank/standards/tech-stack.md`.

## Objective

Deliver a configurable, local-only persistence core: load and validate local config
(keeping secrets out of git and off any hosted backend), register a refundable Booking.com
hotel booking with its price baseline, and read/write all data exclusively under the
user-configured local data directory.

## Stories Included

- **US-002**: Configure daemon locally (Must)
- **US-003**: Register a refundable Booking.com hotel (Must)
- **US-013**: Operate without a BookSaver cloud (Must)

## Bolt Type

**Type**: DDD Construction Bolt
**Definition**: `.specsmd/aidlc/templates/construction/bolt-types/ddd-construction-bolt.md`

## Stages

- ✅ **1. Domain Model**: Complete → ddd-01-domain-model.md
- ✅ **2. Technical Design**: Complete → ddd-02-technical-design.md
- ✅ **3. ADR Analysis**: Complete → adr-001 through adr-004
- ✅ **4. Implement**: Complete → src/booksaver/ + pyproject.toml
- ✅ **5. Test**: Complete → ddd-03-test-report.md

## Dependencies

### Requires
- None (first bolt of the project)

### Enables
- 002-core-local-data (daemon lifecycle + scheduler need Config and LocalStore)
- Downstream: Unit 2/3/4 all read config, bookings, and persistence paths from this core

## Success Criteria

- [ ] All stories implemented
- [ ] Config loads on startup; misconfiguration produces a clear local error; secrets never committed
- [ ] A refundable Booking.com hotel booking can be registered and persisted with its baseline price/currency
- [ ] Non-Booking.com / non-hotel registrations are rejected with a clear message
- [ ] All booking and check data is read/written only under the local data directory
- [ ] Tests passing (config validation + persistence invariants prioritized per coding-standards.md)
- [ ] Python scaffold established and build/lint/test commands documented in CLAUDE.md

## Notes

- Per `memory-bank/standards/tech-stack.md` and `coding-standards.md`, no application code
  exists yet — the Implement stage creates `src/`, `pyproject.toml`, and dependency/tooling
  setup. Persistence mechanism and config format are TBD and should be resolved during
  Technical Design (Stage 2), with significant choices captured as ADRs (Stage 3).
- Prefer explicit domain types for bookings, prices, and config; keep persistence behind a
  `LocalStore` interface so Units 2–4 depend on a stable contract.
- Refundability and "Booking.com hotel only" are domain invariants, not just input checks.
