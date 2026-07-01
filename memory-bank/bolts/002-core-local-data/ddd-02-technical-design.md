---
unit: 001-core-local-data
bolt: 002-core-local-data
stage: design
status: complete
updated: 2026-06-30T00:00:00Z
---

# Technical Design — Daemon Lifecycle & Scheduler

> Scope: Bolt `002-core-local-data` — **US-001** (run BookSaver as a local daemon).
> Translates `ddd-01-domain-model.md` into concrete Python. Builds on the Hexagonal
> scaffold established in Bolt 001. Key open decisions (daemonization approach, scheduler
> mechanism) are flagged **[ADR]** for Stage 3.

## Architecture Pattern

Same **Hexagonal (Ports & Adapters)** layering as Bolt 001. This bolt adds a new
`daemon/` package at the Application/Infrastructure boundary:

- `DaemonLifecycleService` and `Scheduler` are **application-layer services** — they
  consume `Config` (port) and `LocalStore` (port) from Bolt 001 but contain no I/O
  themselves beyond PID file and signal handling.
- The `booksaver run` and `booksaver stop` CLI subcommands are the new **driving adapters**.
- No new driven adapters (no new repository ports) — the PID file is managed directly
  by `DaemonLifecycleService` using `pathlib`, not behind a port.

## Package Layout Changes

New files added to the existing scaffold:

```text
src/booksaver/
├── daemon/
│   ├── __init__.py
│   ├── lifecycle.py       # DaemonLifecycleService — start, stop, PID file
│   └── scheduler.py       # Scheduler — register jobs, run loop
└── cli/
    └── commands.py        # + cmd_run, cmd_stop (alongside existing commands)
```

No existing files are modified except `cli/commands.py` (two new subcommands added).

## Daemonization Approach **[ADR]**

**Run in the foreground; the user backgrounds the process.**

`booksaver run` starts the scheduler loop in the calling process and blocks. The user
runs it as `booksaver run &` or via a systemd user unit / launchd plist. No `os.fork()`
double-fork daemonization.

Rationale:
- `os.fork()` daemonization is error-prone (file descriptor leaks, signal mask, stdio
  redirection) and provides no benefit for a local personal tool.
- A foreground process is trivially inspectable (`ps`, logs to stdout/stderr or a local
  log file), restartable, and integrable with the OS service manager.
- The acceptance criteria ("runs as a background process") is satisfied by the OS
  backgrounding mechanism, not by the Python process forking itself.
- Keeps implementation to pure stdlib with no daemonization library.

## Scheduler Mechanism **[ADR]**

**`time.sleep()` loop with `threading.Event` for clean shutdown — stdlib only.**

```python
# Conceptual loop (detail in scheduler.py)
while not _stop_event.is_set():
    for job in self._jobs:
        job.handler()
    _stop_event.wait(timeout=interval_seconds)
```

`threading.Event.wait(timeout)` is used instead of `time.sleep()` so that a stop signal
wakes the loop immediately rather than waiting out the full interval.

Rationale:
- Simplest correct implementation; zero third-party deps (consistent with ADR-003).
- APScheduler and similar libraries add scheduling features (cron, jitter, persistence)
  that are not needed for a single fixed-interval loop.
- The `Scheduler` interface is stable regardless of the internal mechanism — Unit 2
  only calls `register()` and the loop is started internally by `DaemonLifecycleService`.

## Module Design

### `daemon/lifecycle.py` — `DaemonLifecycleService`

```python
class DaemonLifecycleService:
    def start(self, config: Config, scheduler: Scheduler) -> None: ...
    def stop_via_pidfile(self, data_dir: DataDirectory) -> None: ...
    def _write_pid(self, path: Path) -> None: ...
    def _remove_pid(self, path: Path) -> None: ...
    def _check_stale(self, path: Path) -> None: ...
```

**Start sequence:**
1. Resolve `pid_file = data_dir / "booksaver.pid"`.
2. If PID file exists: read PID, check if process is alive (`os.kill(pid, 0)`).
   - Alive → refuse to start, emit `DaemonStartFailed` with stale PID info.
   - Not alive → stale file, log warning, remove it, continue.
3. Write PID file (`os.getpid()`), mode `0600`.
4. Register `SIGTERM` and `SIGINT` handlers → set `_stop_event`.
5. Start `scheduler.run(config.check_interval)` (blocks until `_stop_event` is set).
6. On loop exit: remove PID file, emit `DaemonStopped`.

**Stop (from another terminal):**
`booksaver stop` reads the PID file, sends `SIGTERM` to that PID, and waits up to 10 s
for the PID file to disappear (confirming clean exit).

### `daemon/scheduler.py` — `Scheduler`

```python
class Scheduler:
    def register(self, name: str, handler: Callable[[], None]) -> None: ...
    def run(self, interval: CheckInterval) -> None: ...  # blocks
    def request_stop(self) -> None: ...                  # sets _stop_event
```

- `register()` is called **before** `run()`. Registering after the loop has started
  raises `RuntimeError`.
- Each tick: iterate `_jobs` in registration order, call `handler()`, catch and log
  any exception (does not stop the loop — satisfies `JobFailed` event contract).
- `TickResult` (success/failure per job) is emitted as a structured log line.

## CLI Surface

Two new subcommands alongside the existing ones in `cli/commands.py`:

| Command | Purpose | Behaviour |
|---------|---------|-----------|
| `booksaver run` | Start the daemon (foreground) | Loads config, verifies data dir, starts lifecycle service; blocks; Ctrl-C / SIGTERM → clean stop |
| `booksaver stop` | Stop a running daemon | Reads PID file, sends SIGTERM, waits for PID file removal (up to 10 s); exits 0 on success, 1 if no daemon running, 2 on timeout |

## PID File Convention

| Property | Value |
|----------|-------|
| Location | `{data_directory}/booksaver.pid` |
| Content | ASCII decimal PID + newline |
| Permissions | `0600` (owner read/write only) |
| Lifecycle | Created on successful start; removed on clean stop; stale detection on startup |

## Signal Handling

| Signal | Handler behaviour |
|--------|------------------|
| `SIGTERM` | Set `_stop_event`; loop finishes current tick then exits cleanly |
| `SIGINT` (Ctrl-C) | Same as SIGTERM |

No `SIGHUP` reload in MVP — restart the daemon to pick up config changes.

## Data Persistence

No new tables. The PID file lives on the filesystem (not in SQLite). The existing
`booksaver.db` is untouched by this bolt.

## Error Handling

| Error | Trigger | Surface |
|-------|---------|---------|
| Stale PID (process alive) | PID file exists, `os.kill(pid, 0)` succeeds | Clear message: "daemon already running (PID NNN)"; exit 2 |
| Stale PID (process gone) | PID file exists, `os.kill` raises `ProcessLookupError` | Warning logged, stale file removed, start proceeds |
| No daemon running | `booksaver stop` with no PID file | "No daemon running"; exit 1 |
| Stop timeout | PID file still present after 10 s | "Daemon did not stop cleanly"; exit 2 |
| Job exception | Handler raises in tick | Exception logged with job name + tick number; loop continues |
| Config invalid | `booksaver run` with bad config | Same `ConfigValidationError` path as `booksaver config validate`; exit 2 |

## External Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| `os` (stdlib) | `getpid()`, `kill()` for PID management | No new deps |
| `signal` (stdlib) | `SIGTERM`/`SIGINT` handlers | No new deps |
| `threading` (stdlib) | `Event` for clean-shutdown wake | No new deps |
| `time` (stdlib) | Fallback sleep | No new deps |
| `pathlib` (stdlib) | PID file path operations | Already in use |

**Zero new third-party runtime dependencies** — consistent with ADR-003.

## Open Decisions for Stage 3 (ADR Analysis)

1. **Foreground-only daemon** (no `os.fork()` double-fork) — user backgrounds via `&` or OS
   service manager.
2. **`threading.Event` sleep loop** as scheduler mechanism (vs APScheduler or `sched` stdlib
   module).
