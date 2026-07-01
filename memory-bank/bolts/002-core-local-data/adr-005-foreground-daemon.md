---
unit: 001-core-local-data
bolt: 002-core-local-data
id: ADR-005
title: Foreground-only daemon (no os.fork double-fork)
status: accepted
updated: 2026-07-01T00:00:00Z
---

# ADR-005: Foreground-only daemon

## Context

US-001 requires BookSaver to "run as a background process on my machine." The classic
Unix approach is a double-fork (`os.fork()`) that detaches the process from the terminal,
redirects stdio, and sets a new session. Python's stdlib also offers no built-in
daemonization helper, so third-party libraries (python-daemon, daemonize) fill the gap.

## Decision

`booksaver run` runs in the **foreground**. The user or the OS service manager is
responsible for backgrounding it:

- Interactive: `booksaver run &` (shell background job)
- Persistent: a systemd user unit or macOS launchd plist (one-time user setup)

No `os.fork()`, no double-fork, no daemonization library.

## Rationale

| Factor | Foreground | os.fork double-fork |
|--------|-----------|---------------------|
| Implementation risk | Low — blocking loop | High — fd leaks, signal mask, stdio, umask traps |
| Debuggability | Logs visible in terminal; `ps` shows it clearly | Requires separate log file wiring from the start |
| OS integration | Works with systemd/launchd natively (they expect foreground processes) | Actually *breaks* systemd (`Type=forking` required, fragile) |
| Third-party deps | None | None (stdlib `os.fork`) or optional (python-daemon) |
| MVP fit | Sufficient for single-user local tool | Overengineered for current scope |

The acceptance criteria says "runs as a background process" — this is satisfied by the
OS backgrounding mechanism, not by the Python process detaching itself.

## Consequences

- `booksaver run` blocks the terminal unless backgrounded by the caller.
- Log output goes to stdout/stderr by default; a `--log-file` flag can redirect it
  (deferred to a future bolt if needed).
- Users who want auto-start on login set up a launchd plist or systemd unit; sample
  unit files can be documented later.
- If a future requirement demands true background daemonization (e.g. no terminal at
  all), this decision can be revisited without changing the Scheduler or CLI contract.
