# Tech Stack Standards

## Project Type

BookSaver Agent is a local-first Python daemon / CLI-style tool. It is not a hosted web app, frontend/backend split, SaaS product, or multi-tenant service.

## Current State

No runtime code exists yet. Do not create `src/`, `booksaver/`, `pyproject.toml`, dependency files, or tests unless a later approved specs.md construction plan or bolt explicitly calls for them.

## Planned Runtime Direction

- Language: Python, exact supported version TBD during scaffold planning.
- Runtime shape: single local daemon process with CLI entry points as needed.
- Persistence: local-only storage under a user-configured data directory; exact storage technology TBD.
- Browser automation: required for Booking.com checks and guided rebook flows; library TBD.
- LLM integration: user-configured API credentials read from local config only.
- Notifications: email and Telegram via user-owned credentials; no BookSaver cloud relay.
