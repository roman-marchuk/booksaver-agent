# Coding Standards

## Current Rule

This repository is still documentation/planning only. Do not add application code or dependencies during documentation migration work.

## Future Python Code Standards

Specific formatting, linting, packaging, and test commands must be established during the approved Python scaffold plan. Until then:

- Keep secrets out of git and read credentials from local config only.
- Prefer explicit domain types for bookings, prices, check results, savings opportunities, and rebook events.
- Keep browser automation, LLM extraction, savings evaluation, notification delivery, and rebook confirmation logic separated by module boundaries.
- Add tests when runtime code is introduced, with coverage focused first on local config validation, persistence invariants, savings equivalence rules, and confirmation gates.
- Preserve the MVP product constraints: Booking.com hotels only, refundable bookings only, equivalent cheaper offers only, no autonomous cancel or purchase, local-only data.
