# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

BookSaver Agent is a planned **local-first Python daemon / CLI tool** that monitors a user's refundable
Booking.com hotel reservation, detects price drops via **browser automation + LLM-assisted page
interpretation**, notifies the user (email/Telegram), and offers a **guided rebook with mandatory human
confirmation**. It is explicitly *not* a web app, hosted service, or multi-tenant SaaS, uses *no* official
Booking.com API, and keeps all credentials, sessions, and data on the user's machine.

**Current state: Bolt `001-core-local-data` implement stage complete.** Python scaffold, domain model,
SQLite store, config loader, and CLI are in place. `project_type` is `cli-tool`
(`memory-bank/project.yaml`).

## Build / Lint / Test Commands

```bash
# Install (editable, includes dev tools)
pip install -e ".[dev]"

# Lint + auto-fix
python3 -m ruff check src/ --fix
python3 -m ruff check src/         # must be clean before committing

# Type-check
python3 -m mypy src/

# Tests
python3 -m pytest

# Run CLI
python3 -m booksaver.cli <command>
# or, after pip install -e .:
booksaver <command>
```

**Python 3.11+ required** (uses stdlib `tomllib`). Zero third-party runtime dependencies for the
core; add new runtime deps only when stdlib genuinely cannot satisfy the need (ADR-003).

## This repo is driven by the specs.md AI-DLC flow

All planning happens through the **specs.md AI-DLC** framework (an AWS-derived, three-phase,
Domain-Driven methodology). The framework itself is installed under `.specsmd/aidlc/` (agents, skills,
templates, schema) and project artifacts live under `memory-bank/`. Work is done by invoking specialized
agents as slash commands, not by editing artifacts ad hoc:

| Command | Phase | Role |
|---------|-------|------|
| `/specsmd-master-agent` | — | **Start here.** Orchestrator: routes requests, analyzes state, answers methodology questions |
| `/specsmd-inception-agent` | Inception | Requirements, stories, system context, unit decomposition, bolt planning |
| `/specsmd-construction-agent` | Construction | Execute bolts through DDD stages (domain → technical design → implement → test) |
| `/specsmd-operations-agent` | Operations | Build, deploy, verify, monitor |

These are duplicated into `.claude/commands/`, `.claude/agents/`, and `.cursor/commands/` by the
installer — edit agent behavior in `.specsmd/aidlc/`, not the copies.

**Hierarchy:** Intent (a capability) → Unit (independently buildable component) → Story. A **Bolt** is a
time-boxed execution session scoped to a Unit. Agents are **stateless** — they read context fresh from
`memory-bank/` each invocation, so artifacts must be saved after each step. Humans validate at every
checkpoint (after requirements, decomposition, each bolt stage, before deploy).

## Memory bank layout and conventions

`.specsmd/aidlc/memory-bank.yaml` is the **authoritative schema** — read it before placing or renaming
artifacts. Key paths:

- `memory-bank/intents/{NNN}-{intent}/` — `requirements.md`, `system-context.md`, `units.md`
- `.../units/{UUU}-{unit}/` — `unit-brief.md`, `construction-log.md`, `stories/{SSS}-{slug}.md`
- `memory-bank/bolts/{BBB}-{unit}/` — `bolt.md` + DDD stage artifacts
- `memory-bank/standards/` — project standards (see below)
- `memory-bank/story-index.md` — single-file global index of all stories

Hard conventions enforced by the schema: **3-digit zero-padded prefixes** on intents/units/stories/bolts,
**kebab-case** names derived from folder/file names (no frontmatter name prefixes), and **ISO-8601
timestamps with time + timezone** (`YYYY-MM-DDTHH:MM:SSZ`) on every date field — never date-only. Keep
`story-index.md` consistent when stories change; it asserts all 16 stories are assigned exactly once.

## Standards are the source of truth for product + tech constraints

`memory-bank/standards/` files are loaded as context by every agent — treat them as binding when
designing or coding:

- `system-architecture.md` — single-process local daemon; modular components
  (`LocalConfig → Scheduler → BookingComMonitor → {BrowserAutomation, LLMClient, LocalPersistence} →
  SavingsDetection → {Notifications, GuidedRebook}`), not distributed services.
- `tech-stack.md` — Python, single local daemon with CLI entry points; local-only persistence; browser
  automation + LLM + notification libraries all TBD until the scaffold bolt.
- `coding-standards.md` — explicit domain types for bookings/prices/check-results/savings/rebook events;
  keep browser automation, LLM extraction, savings evaluation, notification, and rebook-confirmation
  logic in separate module boundaries; first test coverage targets config validation, persistence
  invariants, savings equivalence rules, and confirmation gates.

## Current intent: `001-booksaver-agent-mvp`

5 units, 16 stories, "Ready for Construction planning". **Build order (from `system-architecture.md`):**

1. `001-core-local-data` — config, booking registration, local persistence, daemon lifecycle/scheduler (root dependency)
2. `002-booking-com-price-monitor` — local session, scheduled browser check, LLM extraction, failure handling
3. `003-savings-detection-notifications` — baseline comparison, equivalence/refundability gate, email + Telegram
4. `004-guided-rebook` — explicit-intent start, mandatory confirmation before cancel/purchase, local outcome logging
5. `005-extensibility-future` — pluggable second platform / non-hotel types (post-MVP only)

## Product constraints to preserve in every design and code change

- **Booking.com hotels only** in MVP; reject other booking types with a clear message.
- **Refundable bookings only**; a cheaper offer must itself still be refundable to count as savings.
- **Equivalence = same property, same check-in/out dates, same room type**, still refundable.
- **No autonomous cancel or purchase** — guided rebook always requires an explicit local confirmation step.
- **Local-only** — no outbound calls to any BookSaver-hosted backend; secrets never committed to git.
