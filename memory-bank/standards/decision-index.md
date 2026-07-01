---
last_updated: 2026-07-01T00:00:00Z
total_decisions: 6
---

# Decision Index

This index tracks all Architecture Decision Records (ADRs) created during Construction bolts.
Use this to find relevant prior decisions when working on related features.

## How to Use

**For Agents**: Scan the "Read when" fields below to identify decisions relevant to your current task. Before implementing new features, check if existing ADRs constrain or guide your approach. Load the full ADR for matching entries.

**For Humans**: Browse decisions chronologically or search for keywords. Each entry links to the full ADR with complete context, alternatives considered, and consequences.

---

## Decisions

### ADR-006: threading.Event sleep loop as the scheduler mechanism
- **Status**: accepted
- **Date**: 2026-07-01
- **Bolt**: 002-core-local-data (core-local-data)
- **Path**: `bolts/002-core-local-data/adr-006-threading-event-scheduler.md`
- **Summary**: A `threading.Event.wait(timeout)` loop is used for the fixed-interval scheduler instead of `sched`, `time.sleep()`, or APScheduler. Wakes immediately on stop signal; no third-party dep; sufficient for a single fixed-interval job in MVP.
- **Read when**: Adding a new job to the scheduler; changing the check interval; considering APScheduler or cron-style scheduling for future units; implementing or testing clean daemon shutdown.

### ADR-005: Foreground-only daemon (no os.fork double-fork)
- **Status**: accepted
- **Date**: 2026-07-01
- **Bolt**: 002-core-local-data (core-local-data)
- **Path**: `bolts/002-core-local-data/adr-005-foreground-daemon.md`
- **Summary**: `booksaver run` blocks in the foreground; users background it with `&` or a systemd/launchd unit. No `os.fork()` double-fork or daemonization library. Simpler, debuggable, and compatible with OS service managers that expect foreground processes.
- **Read when**: Implementing `booksaver run`/`stop`; writing a systemd unit or launchd plist for auto-start; considering background daemonization for a future bolt.

### ADR-004: Hexagonal architecture with typing.Protocol repository interfaces
- **Status**: accepted
- **Date**: 2026-06-16
- **Bolt**: 001-core-local-data (core-local-data)
- **Path**: `bolts/001-core-local-data/adr-004-hexagonal-protocol-ports.md`
- **Summary**: Units 2–4 are declared consumers of Config, Booking, and LocalStore and must not couple to SQLite or the filesystem. Repository interfaces are defined as `typing.Protocol` classes in `application/ports.py`; SQLite and filesystem adapters live in `infrastructure/` and are injected at startup.
- **Read when**: Adding a new repository or data-access class; wiring a new unit that reads bookings, config, or check history; writing tests that need a fake in-memory store; adding a new driven adapter (e.g. a second persistence backend).

### ADR-003: Python 3.11+ baseline and standard-library-first core
- **Status**: accepted
- **Date**: 2026-06-16
- **Bolt**: 001-core-local-data (core-local-data)
- **Path**: `bolts/001-core-local-data/adr-003-python-311-stdlib-first.md`
- **Summary**: Python version and dependency philosophy were deferred as TBD in tech-stack.md. Require Python 3.11+ as the minimum runtime and prefer standard-library solutions, introducing a third-party runtime dependency only when the stdlib genuinely cannot satisfy a requirement.
- **Read when**: Considering adding a new third-party runtime dependency; choosing a Python version constraint; deciding whether to use stdlib vs a library for parsing, validation, HTTP, or date handling.

### ADR-002: TOML file + environment variables for config and secrets
- **Status**: accepted
- **Date**: 2026-06-16
- **Bolt**: 001-core-local-data (core-local-data)
- **Path**: `bolts/001-core-local-data/adr-002-toml-env-config.md`
- **Summary**: The daemon needs a user-editable local config file and a secret-handling approach that ensures secrets are never committed to git. Use `config.toml` (parsed with stdlib `tomllib`) for non-secret settings; secrets are read exclusively from environment variables and never written to any git-tracked file.
- **Read when**: Adding new config fields or sections; handling new secrets (API keys, tokens, passwords); implementing config loading or validation; working on notification or LLM credential handling in Units 2–3.

### ADR-001: SQLite as the local persistence store
- **Status**: accepted
- **Date**: 2026-06-16
- **Bolt**: 001-core-local-data (core-local-data)
- **Path**: `bolts/001-core-local-data/adr-001-sqlite-local-persistence.md`
- **Summary**: BookSaver Agent needs durable local storage with domain invariants enforced at the storage layer. Use SQLite (stdlib `sqlite3`) as the single local store — one file at `{data_directory}/booksaver.db` with UNIQUE and CHECK constraints matching domain rules.
- **Read when**: Extending the database schema (e.g. Unit 2 adding check_history columns); writing or modifying repository implementations; designing data migrations; working on persistence invariant tests.
