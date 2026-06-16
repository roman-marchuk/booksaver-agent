---
bolt: 001-core-local-data
created: 2026-06-16T19:28:12Z
status: accepted
superseded_by:
---

# ADR-003: Python 3.11+ baseline and standard-library-first core

## Context

BookSaver Agent is a local daemon with no hosted deployment target — it runs on the user's
machine. The Python version and dependency philosophy were deferred as TBD in `tech-stack.md`.
This bolt (the first code-producing bolt) sets the baseline that all future bolts inherit. A
deliberate policy on third-party dependencies affects correctness risk, install friction, and
long-term maintenance.

## Decision

Require **Python 3.11+** as the minimum runtime. Prefer standard-library solutions; introduce
a third-party runtime dependency only when the stdlib genuinely cannot satisfy a requirement
(not merely for convenience). Dev/test tooling (ruff, pytest, mypy) is exempt from this
constraint.

## Rationale

Python 3.11 is the lowest version that includes `tomllib` (stdlib TOML parser, needed for
ADR-002) and delivers meaningful performance improvements over 3.9/3.10. It is also still
actively supported. Setting the floor here avoids runtime conditional imports and `try/except
ImportError` shims. The stdlib-first philosophy minimises install friction for a personal
tool (no large dependency trees), reduces supply-chain risk, and keeps the install a single
`pip install` with no transitive surprises.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| Python 3.9 / 3.10 | Broader compatibility | No stdlib `tomllib`; 3.9 is nearing EOL | Would require `tomli` dep or a different config format |
| Python 3.12+ | Latest features | Narrows user compatibility for minimal gain at this stage | No compelling feature need yet; can raise the floor later |
| Liberal third-party deps (e.g. pydantic from day 1) | Rich validation, less boilerplate | Heavier install; locks in an opinion before we know the full shape | Can be introduced in a later bolt if domain complexity justifies it |

## Consequences

### Positive

- `tomllib`, `sqlite3`, `decimal`, `dataclasses`, `argparse`, `pathlib`, `zoneinfo` are all
  stdlib → zero third-party runtime deps for the data/config core.
- Fast, lightweight install; no large transitive dependency trees.
- Reduced supply-chain risk for a personal security-sensitive tool.
- Python 3.11 is actively supported through at least 2027.

### Negative

- Users on older Python installs must upgrade (3.11 released Oct 2022 — reasonable ask by 2026).
- Future bolts must justify each new runtime dependency against this policy; convenience alone
  is not sufficient.

### Risks

- **A later unit genuinely needs a third-party dep** (e.g. a browser automation library for
  Unit 2): that is expected and acceptable — the policy is "prefer stdlib", not "ban all deps".
  Each addition should be explicitly noted in the relevant bolt's ADR.

## Related

- **Stories**: US-002, US-003, US-013
- **Standards**: `tech-stack.md` (resolves "Python version TBD" and "libraries TBD")
- **Previous ADRs**: ADR-002 (TOML config — depends on `tomllib` availability)
