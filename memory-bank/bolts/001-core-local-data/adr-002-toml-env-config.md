---
bolt: 001-core-local-data
created: 2026-06-16T19:28:12Z
status: accepted
superseded_by:
---

# ADR-002: TOML file + environment variables for config and secrets

## Context

The daemon needs a user-editable local config file for non-secret settings (schedule interval,
data directory, notification/LLM placeholders). US-002 requires that secrets are never committed
to git and never sent to a BookSaver-hosted backend. The format and secret-handling approach were
deferred as TBD in `tech-stack.md`. Units 2–3 will extend this config with LLM API keys and
notification credentials.

## Decision

Use a `config.toml` file (parsed with stdlib `tomllib`) for all non-secret settings. Secrets
(API keys, passwords, tokens) are read exclusively from environment variables and never written
to or stored in `config.toml` or any git-tracked file.

## Rationale

TOML is the only format that is (a) natively parseable in Python 3.11+ stdlib, (b) supports
comments (essential for a hand-edited file with placeholder sections), and (c) avoids
indentation-sensitivity. The env-var-only secrets pattern is the simplest approach that
guarantees secrets never appear in `config.toml`, satisfying the US-002 acceptance criterion
without requiring a secrets manager or encrypted vault.

### Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| YAML | Human-readable, supports comments | Requires `pyyaml` (third-party dep); indentation rules trip up hand-editing | Adds a runtime dependency; error-prone to edit |
| JSON | Stdlib `json`; unambiguous | No comment support — can't document placeholder sections | Unusable for a hand-edited config with placeholders |
| dotenv / `.env` file | Simple key=value | Poor support for structured sections (schedule, storage, notifications); requires `python-dotenv` or custom parsing | Not structured enough; needs a dep |
| Encrypted secrets file | Secrets fully local | Complex UX — user must manage a key; overkill for a personal tool | Over-engineered for a single-user local daemon |

## Consequences

### Positive

- Zero third-party runtime dependency for config parsing (stdlib `tomllib`).
- Structured sections (`[schedule]`, `[storage]`, `[notifications]`) are explicit and
  comment-friendly — users can annotate placeholders.
- Secrets never appear in `config.toml`, satisfying US-002 "secrets not committed to git".
- `config show` and all events can safely redact by simply not reading env vars into output.
- Units 2–3 extend config with new `[extraction]` / `[notifications]` keys in the same file;
  secret values are added as new env vars without changing the pattern.

### Negative

- Secrets require the user to export env vars (or use a `.env` loader shim) before running the
  daemon — slightly more setup than a single all-in-one config file.
- `tomllib` is read-only (Python stdlib); writing/updating config programmatically requires a
  third-party library or manual file manipulation.

### Risks

- **User accidentally puts secrets in `config.toml`**: mitigated by clear documentation and by
  the `config validate` command which warns if secret-looking values appear in the file.

## Related

- **Stories**: US-002, US-013
- **Standards**: `tech-stack.md` (resolves "config format TBD"); `coding-standards.md`
  ("secrets never committed to git")
- **Previous ADRs**: none
