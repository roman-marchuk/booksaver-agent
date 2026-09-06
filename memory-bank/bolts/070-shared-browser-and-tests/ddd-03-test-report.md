---
stage: test
bolt: 070-shared-browser-and-tests
created: 2026-09-06T22:05:17Z
---

# Test Report

Independent review preserved the session/network/action guards, isolated hosts, code-owned authentication and refresh, model budget accounting, result validation, and cleanup. Its one finding restored include_extracted_content_only_once=True with a contract assertion. Key-resolution tests now isolate ambient credentials. Remote-auth tests cover runtime assembly and positive/negative server verification with model sentinels.

## Integrated evidence

The final integrated gate passed against main `4b52ea3`: 1,726 Python tests, Ruff, strict mypy
over 115 source files, 16 Node tests, CLI smoke and installed-wheel fixture verification.
The [consolidated cleanup report](../../intents/024-repository-streamlining/cleanup-report.md)
records commands/results, independent findings and fixes, historical warnings and offline limits.

No new live Booking.com qualification or cleanup code publication is claimed.
