---
bolt: 001-core-local-data
created: 2026-06-16T19:28:12Z
status: accepted
superseded_by:
---

# ADR-004: Hexagonal architecture with typing.Protocol repository interfaces

## Context

Units 2–4 are declared consumers of `Config`, `Booking`, and `LocalStore`. They must be able
to call `BookingRepository.listActive()` and read config values without caring whether the
underlying store is SQLite, a file, or an in-memory fake during tests. `coding-standards.md`
requires module boundaries separating browser automation, LLM extraction, savings evaluation,
notification, and rebook logic. A layering decision is needed before any code is written.

## Decision

Adopt **Hexagonal (Ports & Adapters)** as the architectural pattern for the `booksaver` package.
Repository interfaces (`BookingRepository`, `CheckHistoryRepository`, `ConfigSource`) are defined
as `typing.Protocol` classes in the `application/ports.py` module. Domain and application code
depend only on these protocols; SQLite and filesystem adapters live in `infrastructure/` and are
injected at startup.

## Rationale

The domain model has rich invariants (immutable baseline, Booking.com-only, refundable-only,
local-only data) that must be testable without a database. Protocols give structural subtyping
without inheritance — any class that implements the required methods satisfies the port, so an
in-memory fake repository requires no test-specific base class. This is the minimum structure
that satisfies `coding-standards.md` module boundaries while keeping the codebase simple enough
for a single-developer local tool.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Flat scripts (no layering) | Simplest to start | Domain logic and SQLite calls intermixed; impossible to unit-test invariants in isolation; Units 2–4 have no stable contract | Violates coding-standards.md module boundaries; not maintainable |
| Abstract base classes (ABCs) | Explicit interface contract | Requires inheritance; more boilerplate; Protocol is simpler for duck-typed Python | Protocols achieve the same goal with less coupling |
| Full Clean Architecture (separate packages per layer) | Maximum isolation | Over-engineered for a single-process local tool with one developer | Unnecessary complexity; Hexagonal within one package is sufficient |

## Consequences

### Positive

- Domain and use-case code is I/O-free and independently testable with a fake in-memory store.
- Units 2–4 depend on `BookingRepository` / `ConfigSource` protocols — not on SQLite — so the
  underlying store can change without touching consumers.
- `LocalOnlyDataPolicy` can be tested as a pure domain service with no filesystem calls.
- Satisfies `coding-standards.md` module boundary requirement explicitly.

### Negative

- Slightly more files/modules than a flat script approach — new contributors must understand the
  layering convention.
- Dependency injection (wiring adapters at startup in `__main__.py`) is manual; no DI framework.

### Risks

- **Protocol drift**: if an infrastructure adapter adds methods not on the Protocol, callers may
  start depending on concrete types. Mitigated by mypy strict Protocol checking in CI.

## Related

- **Stories**: US-002, US-003, US-013
- **Standards**: `coding-standards.md` (module boundaries), `system-architecture.md`
  (single-process modular components)
- **Previous ADRs**: ADR-001 (SQLite — the driven adapter behind BookingRepository)
