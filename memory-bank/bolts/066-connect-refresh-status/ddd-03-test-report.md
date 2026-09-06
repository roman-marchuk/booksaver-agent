---
stage: test
bolt: 066-connect-refresh-status
created: 2026-09-06T20:21:00Z
---

# Test Report

US-172 passes: notification attempt precedes the follow-up callback; instant refresh completes
after progress; positive-only success shows counts and price-check guidance; empty, failed, and
ambiguous results retain failure guidance; busy/stopping messages do not imply queued work;
callback exception preserves successful login and redacts error contents.

- Focused authentication and Telegram tests: 46 passed.
- Full suite: 1,941 passed; 55 existing schedule deprecation warnings.
- Ruff passed; mypy passed over 130 source files; CLI smoke and diff check passed.
- Artifact validator: zero issues. Status integrity: zero inconsistencies before completion.
- Independent review: no blocking issues. Pre-admission wording changed to 'Preparing to refresh'
  to avoid implying admission already succeeded.

Six pre-existing coordinator fixtures became ineligible after September 5. Their future-inventory
stay dates now derive from UTC today plus 30 days. Assertions and production clocks are unchanged;
all six failures were reproduced before the fixture correction and passed afterward.

Limitations: no hidden queue is introduced. Another operation may still win admission between
login and discovery; users receive an accurate refusal. Telegram notification delivery can fail;
ordering guarantees apply to send attempts. Live login is human-driven; staged replay verifies
the deployed coordinator independently, not a human Telegram interaction.
