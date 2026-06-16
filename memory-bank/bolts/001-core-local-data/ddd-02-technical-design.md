---
unit: 001-core-local-data
bolt: 001-core-local-data
stage: design
status: complete
updated: 2026-06-16T18:13:21Z
---

# Technical Design - Core & Local Data

> Scope: Bolt `001-core-local-data` — **US-002** (configure locally), **US-003** (register a
> refundable Booking.com hotel), **US-013** (operate without a BookSaver cloud). Translates
> `ddd-01-domain-model.md` into a concrete Python architecture and resolves the TBDs deferred by
> `standards/tech-stack.md` (Python version, config format, persistence mechanism, scaffold).
> Daemon lifecycle + scheduler (US-001) are **out of scope** here and built in Bolt `002`; they
> appear only as forward-reference seams. Several choices below are flagged **[ADR]** for Stage 3.

## Architecture Pattern

**Hexagonal (Ports & Adapters) over a DDD core, in a single OS process.** **[ADR]**

Rationale:
- The domain model is rich (invariants on platform/product-type/refundability, immutable baseline,
  local-only data) and must stay pure and independently testable — so domain logic depends on
  **ports** (interfaces), never on SQLite, the filesystem, or the CLI.
- `standards/system-architecture.md` mandates a *single-process, local-first daemon* with modular
  components, not distributed services. Ports & Adapters gives module boundaries
  (`coding-standards.md`) without process boundaries.
- Downstream Units 2–4 are declared **consumers** of `Config`, `Booking`, and persistence. Exposing
  them as stable port interfaces (Protocols) lets those units depend on a contract, not an
  implementation.

Driving adapters (inbound): the **CLI**. Driven adapters (outbound): **SQLite store**, **TOML+env
config source**, **filesystem path resolver**. The future `Scheduler`/`DaemonLifecycle` (Bolt 002)
becomes an additional driving adapter against the same application use cases.

## Layer Structure

```text
┌─────────────────────────────────────────────┐
│  Presentation  │  cli/  — argparse commands  │  (Bolt 002 adds daemon/scheduler driver)
├─────────────────────────────────────────────┤
│  Application   │  use cases + PORTS          │  register_booking, load_config, ports.py
├─────────────────────────────────────────────┤
│  Domain        │  pure business logic        │  models, value objects, services, events, errors
├─────────────────────────────────────────────┤
│  Infrastructure│  driven adapters            │  sqlite store, toml/env config, path policy
└─────────────────────────────────────────────┘
```

Dependency rule: arrows point **inward**. Domain imports nothing from Application/Infrastructure;
Application defines ports and imports only Domain; Infrastructure and CLI depend inward on ports.

### Proposed package layout (created in Stage 4 — first-bolt scaffold) **[ADR: src-layout + tooling]**

```text
booksaver-agent/
├── pyproject.toml                 # packaging + tool config (ruff, pytest, mypy)
├── src/booksaver/
│   ├── __init__.py
│   ├── domain/
│   │   ├── value_objects.py       # Money, StayDates, ConfirmationId, Platform, ProductType,
│   │   │                          #   Property, RoomType, RefundabilityPolicy, CheckInterval,
│   │   │                          #   DataDirectory, NotificationSettings
│   │   ├── models.py              # Booking (aggregate root), Config (aggregate root)
│   │   ├── services.py            # BookingRegistrationService, LocalOnlyDataPolicy
│   │   ├── events.py              # BookingRegistered/Rejected, ConfigLoaded/ValidationFailed
│   │   └── errors.py              # ConfigValidationError, BookingRejectedError, hierarchy
│   ├── application/
│   │   ├── ports.py               # BookingRepository, CheckHistoryRepository, ConfigSource (Protocols)
│   │   ├── register_booking.py    # RegisterBooking use case
│   │   └── load_config.py         # ConfigurationService use case
│   ├── infrastructure/
│   │   ├── paths.py               # local path resolution + LocalOnlyDataPolicy enforcement
│   │   ├── config/toml_env_source.py   # ConfigSource adapter (TOML file + environment)
│   │   └── persistence/
│   │       ├── sqlite_store.py     # SQLite BookingRepository + CheckHistoryRepository
│   │       └── schema.sql          # DDL / migration v1
│   └── cli/
│       ├── __main__.py             # `python -m booksaver`
│       └── commands.py             # config / register / bookings subcommands
└── tests/
    ├── unit/                       # domain + value-object rules
    └── integration/                # config load + sqlite persistence round-trips
```

**Runtime baseline: Python 3.11+** **[ADR]** — chosen so the core stays **standard-library-first**:
`tomllib` (TOML parsing), `sqlite3` (ACID local store), `decimal`, `dataclasses`,
`enum`, `pathlib`, `argparse`, `zoneinfo` are all stdlib. This bolt targets **zero third-party
runtime dependencies** for the data/config core; dev tooling only (ruff, pytest, mypy). Whether to
adopt a validation library (e.g. pydantic) later is deferred — see ADR opportunities.

## Module / Port Mapping (Domain → Code)

| Domain element (Stage 1) | Layer | Lands in |
|--------------------------|-------|----------|
| `Booking` aggregate, `Config` aggregate | Domain | `domain/models.py` |
| All value objects (`Money`, `StayDates`, `Platform`, `RefundabilityPolicy`, …) | Domain | `domain/value_objects.py` |
| `BookingRegistrationService`, `LocalOnlyDataPolicy` | Domain | `domain/services.py` |
| Domain events | Domain | `domain/events.py` |
| `ConfigurationService` (loader orchestration) | Application | `application/load_config.py` |
| `BookingRepository`, `CheckHistoryRepository`, `ConfigSource` (interfaces) | Application (ports) | `application/ports.py` |
| SQLite impl of the two repositories | Infrastructure | `infrastructure/persistence/sqlite_store.py` |
| `ConfigSource` impl (TOML + env) | Infrastructure | `infrastructure/config/toml_env_source.py` |
| Path resolution enforcing local-only | Infrastructure | `infrastructure/paths.py` |

> Ports are `typing.Protocol` interfaces so domain/application code is decoupled from SQLite and the
> filesystem, and so Units 2–4 can depend on the contract. `CheckHistoryRepository` is **contract-only**
> in this bolt; its record shape is finalized in Unit 2 (forward reference from the domain model).

## API Design (CLI Surface — this is a CLI tool, not an HTTP service)

Entry point: `python -m booksaver <command>` (and a `booksaver` console script via `pyproject.toml`).
Each command is a thin driving adapter that calls one application use case and renders the result.

| Command | Purpose | Inputs | Output / Exit |
|---------|---------|--------|---------------|
| `booksaver init` | Create the local data directory + a sample config file (no secrets) | `--data-dir` (optional) | Creates dir (0700) + `config.toml` template; exit 0 |
| `booksaver config validate` | Load + validate config; assert local-only data dir | config path / env | Effective config **without secrets**, or ordered error list; exit 0/2 |
| `booksaver config show` | Show effective config (secrets redacted) | — | Rendered config; exit 0 |
| `booksaver register` | Register a refundable Booking.com hotel booking | `--confirmation`, `--property`, `--property-ref`, `--check-in`, `--check-out`, `--room-type`, `--amount`, `--currency`, `--refundable/--refund-note`, `--refund-deadline` | Persists booking + baseline; prints booking id; or rejection message; exit 0/2 |
| `booksaver bookings list` | List active registered bookings | `--all` (include archived) | Table of bookings (no secrets); exit 0 |

> Forward reference (Bolt 002, out of scope here): `booksaver run` / `start` / `stop` (daemon +
> scheduler). The CLI module is structured so these subcommands slot in beside the above.

### Use-case contracts (Application layer)

- **`LoadConfig(sources) -> Config`** — reads via `ConfigSource`, resolves secrets from environment,
  validates all required fields, asserts `dataDirectory` is local; emits `ConfigLoaded` /
  `ConfigValidationFailed`. Aggregates *all* validation errors (does not fail on the first).
- **`RegisterBooking(submission) -> Booking`** — delegates to `BookingRegistrationService`: enforces
  `platform = booking_com`, `productType = hotel`, `refundable = true`, and confirmation uniqueness
  (`BookingRepository.exists`); constructs the aggregate, records the immutable baseline, persists in
  one transaction; emits `BookingRegistered` / `BookingRegistrationRejected`.

## Data Persistence

**Mechanism: SQLite (stdlib `sqlite3`), one file under the user's data directory.** **[ADR]**

Why SQLite over flat JSON files:
- Enforces **persistence invariants at the storage layer**: `UNIQUE(confirmation_id)` makes the
  "no duplicate confirmation" rule durable, not just an in-memory check (directly testable per
  `coding-standards.md` "persistence invariants" priority).
- **ACID transactions** → atomic registration; a crash mid-write cannot leave a half-written booking.
- Single local file, zero external service, trivially backed up/copied — fits *local-first*.
- Stdlib → keeps the zero-runtime-dependency goal.

DB location: `{data_directory}/booksaver.db`, created with file mode `0600`; data directory `0700`.
Schema is versioned via a `schema_meta` table to allow forward migrations (Unit 2 extends
`check_history`).

| Table | Columns | Notes / Constraints |
|-------|---------|---------------------|
| `bookings` | `booking_id` TEXT PK, `platform` TEXT, `product_type` TEXT, `confirmation_id` TEXT **UNIQUE NOT NULL**, `property_name` TEXT, `property_ref` TEXT, `check_in` TEXT (ISO date), `check_out` TEXT, `room_type` TEXT, `baseline_amount` TEXT (decimal as string), `baseline_currency` TEXT (ISO-4217), `refundable` INTEGER (1), `refund_note` TEXT, `refund_deadline` TEXT NULL, `registered_at` TEXT (ISO-8601), `status` TEXT (`active`/`archived`) | CHECK `platform='booking_com'`, CHECK `product_type='hotel'`, CHECK `refundable=1`, CHECK `check_out > check_in`. Baseline stored as **string-encoded Decimal** (never float) to avoid currency rounding. |
| `check_history` | `id` INTEGER PK, `booking_id` TEXT FK→bookings, `recorded_at` TEXT | **Contract-only stub** in this bolt; columns finalized by Unit 2. FK + local-only guarantee established now. |
| `schema_meta` | `version` INTEGER, `applied_at` TEXT | Migration bookkeeping; v1 created by this bolt. |

> Money is persisted as a canonical decimal **string** + ISO-4217 currency, and rehydrated through
> `Decimal`. Dates are ISO-8601 strings. No ORM — a hand-written `sqlite_store.py` maps rows ⇄
> domain objects behind the repository ports.

### Config file format **[ADR]**

`config.toml` (parsed with stdlib `tomllib`). Secrets are **never** in this file — they are read from
environment variables and never written back (satisfies US-002 "secrets not committed to git").

```toml
[schedule]
check_interval = "6h"            # CheckInterval; parsed to a duration, must be > sensible minimum

[storage]
data_directory = "~/.booksaver"  # DataDirectory; must resolve to a local path, expanded + validated

[notifications]                  # placeholder structure — fully validated by Unit 3
# email = "..."                  # secret values come from env, not here
# telegram_chat_id = "..."

[extraction]                     # placeholder structure — fully validated by Unit 2
# model = "..."                  # LLM API key comes from env (e.g. BOOKSAVER_LLM_API_KEY)
```

Secret env vars (read-only, resolved at load): e.g. `BOOKSAVER_LLM_API_KEY`,
`BOOKSAVER_TELEGRAM_BOT_TOKEN`, `BOOKSAVER_SMTP_PASSWORD`. Unset secrets are allowed in this bolt
(placeholders for Units 2–3); only `schedule` and `storage` are required-and-validated now.

## Security Design

| Concern | Approach |
|---------|----------|
| Secret handling | Secrets read only from environment (or an out-of-repo secrets file); never persisted to `config.toml`, the DB, logs, or any git-tracked file. `config show` / events redact secrets. |
| Local-only guarantee (US-013) | `LocalOnlyDataPolicy.assertLocal(path)`: every persistence path must resolve (after `expanduser`/`resolve`) **under** `data_directory`; reject URLs, UNC/remote, and any non-local scheme. No network client is constructed in this unit. |
| Filesystem hardening | Data dir created `0700`, DB file `0600` (owner-only). |
| Input trust | All CLI inputs validated through value objects before persistence (defense at the domain boundary). |
| No outbound calls | This unit has **zero** network dependencies; there is no BookSaver-hosted backend to register with. |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| Reliability / integrity | SQLite ACID transactions; `UNIQUE`/`CHECK` constraints make domain invariants durable; single-transaction registration. |
| Correctness of money | `Decimal` end-to-end; stored as string; never `float`. |
| Performance | Scale is a handful of bookings on one machine — no indexing/perf concern beyond the PK + unique index. |
| Portability | `pathlib` + `expanduser`; `zoneinfo`/UTC ISO-8601 timestamps; macOS/Linux local filesystem. |
| Testability | Pure domain (no I/O) → fast unit tests; ports allow an in-memory fake repository for use-case tests; SQLite file in a tmp dir for integration tests. |
| Maintainability / boundaries | Strict inward dependency rule; each domain concern in its own module per `coding-standards.md`. |

## Error Handling

| Error type | Trigger | Surface / Exit |
|------------|---------|----------------|
| `ConfigValidationError` | Missing/invalid required config, non-local `data_directory` | Ordered list of all field errors; `ConfigValidationFailed` event; CLI exit code **2** |
| `BookingRejectedError` (wrong platform) | `platform != booking_com` | Clear "Booking.com only in MVP" message; `BookingRegistrationRejected`; exit **2** |
| `BookingRejectedError` (wrong product type) | `productType != hotel` | Clear "hotels only in MVP" message; exit **2** |
| `BookingRejectedError` (not refundable) | `refundable = false` | Clear "refundable bookings only" message; exit **2** |
| `BookingRejectedError` (duplicate) | `confirmation_id` already exists | "already registered" message; exit **2** |
| `LocalPathViolation` | Persistence path escapes `data_directory` | Hard fail with the offending path; exit **2** |
| Unexpected | Unhandled | Logged locally; non-zero exit; no secret leakage |

All errors render as clear **local** messages (US-002 / US-003 acceptance criteria). A shared
exception hierarchy lives in `domain/errors.py`; the CLI maps exceptions → exit codes + messages.

## External Dependencies

| Dependency | Purpose | Integration | Notes |
|------------|---------|-------------|-------|
| `sqlite3` (stdlib) | Local persistence | In-process file DB | No external service |
| `tomllib` (stdlib) | Parse `config.toml` | In-process | Read-only |
| `argparse` (stdlib) | CLI parsing | In-process | Driving adapter |
| ruff / pytest / mypy | Lint+format / test / type-check | Dev-only | Configured in `pyproject.toml`; not runtime deps |
| **(none)** runtime third-party | — | — | Zero third-party **runtime** deps is a goal of this bolt |

> Browser automation, LLM client, and notification SDKs are **not** introduced here — they belong to
> Units 2–3 and would violate this unit's boundary (`coding-standards.md`).

## Build / Lint / Test Commands (to be created in Stage 4, then documented in CLAUDE.md)

- Install (editable, dev): `pip install -e ".[dev]"`
- Lint + format: `ruff check src tests` / `ruff format src tests`
- Type-check: `mypy src`
- Test: `pytest`
- Run: `python -m booksaver <command>` (or `booksaver <command>` via console script)

## Open Decisions Carried to Stage 3 (ADR Analysis)

1. **SQLite** as the local persistence store (vs JSON files).
2. **TOML file + environment variables** for config and secret handling (vs YAML/JSON/dotenv).
3. **Python 3.11+** baseline + **standard-library-first / zero runtime dependencies** for the core
   (whether to adopt pydantic for validation later).
4. **Hexagonal (Ports & Adapters)** layering with `typing.Protocol` repository interfaces.
5. **src-layout packaging** + ruff/pytest/mypy toolchain (first-bolt scaffold conventions).
