---
bolt: 001-core-local-data
created: 2026-06-16T19:28:12Z
status: accepted
superseded_by:
---

# ADR-001: SQLite as the local persistence store

## Context

BookSaver Agent needs durable local storage for registered bookings and check history. The
`tech-stack.md` standard deferred the persistence technology as TBD. Key constraints: entirely
local (no hosted service), must enforce the domain invariants (`UNIQUE(confirmation_id)`,
Booking.com-hotel-only, refundable-only) at the storage layer, and must survive a crash mid-write
without corrupting a booking record.

## Decision

Use SQLite (stdlib `sqlite3`) as the single local store. One file at
`{data_directory}/booksaver.db`, created with mode `0600`.

## Rationale

The domain model defines hard invariants (unique confirmation, immutable baseline, refundable-only)
that should be enforced durably — not just in memory — so they survive process restarts and partial
failures. SQLite provides ACID transactions and CHECK/UNIQUE constraints at zero cost (stdlib).

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| JSON flat files | Simple, human-readable | No ACID; crash mid-write corrupts the file; uniqueness is an in-memory-only check | Invariants not durable; not safe for concurrent or interrupted writes |
| JSON + file locking | Adds crash safety | Complex to implement correctly; still no schema-level constraint enforcement | Reimplements what SQLite gives for free |
| YAML/TOML flat files | Human-readable | Same problems as JSON flat files | Same reasons as JSON |

## Consequences

### Positive

- `UNIQUE(confirmation_id)` and `CHECK` constraints make domain invariants durable — tested at the
  storage layer per `coding-standards.md` priority.
- Atomic registration: a crash mid-write cannot leave a half-written booking.
- Single portable file — trivially backed up, copied, or inspected with any SQLite browser.
- Zero third-party runtime dependency (stdlib `sqlite3`).
- Schema versioning (`schema_meta` table) gives a clean migration path as Units 2–4 extend the DB.

### Negative

- Not human-editable (unlike JSON/YAML flat files); requires a tool or CLI command to inspect.
- Schema changes need explicit migrations (managed via `schema_meta`).

### Risks

- **SQLite WAL corruption on unclean shutdown**: mitigated by using WAL mode and relying on
  SQLite's built-in recovery; single-writer daemon process avoids concurrent write conflicts.

## Related

- **Stories**: US-003, US-013
- **Standards**: `tech-stack.md` (resolves "persistence technology TBD")
- **Previous ADRs**: none
