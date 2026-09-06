---
stage: test
bolt: 067-responsive-remote-auth-viewer
created: 2026-09-06T20:44:13Z
---

# Test Walkthrough

## Results

- Final affected suite: **105 passed** in 16.30s. Includes the viewer browser tests, all
  remote-auth unit suites, remote-browser runner, and Telegram connect command.
- Ruff over `src tests`: passed. Mypy over `src`: passed, 129 source files.
- Full suite before the final keyboard layout regression: **1934 passed, 6 failed**, 55 warnings.
- All six failures reproduce in an untouched archive of HEAD
  `da5a065e9c535480b43f55fcc71f1c891eced7c4`: **6 failed** in 0.50s.
- Mandatory bolt completion succeeded. Final AI-DLC artifact validator: zero errors/warnings.
  Status integrity: zero inconsistencies across 65 bolts and 23 intents. Diff whitespace check passed.
- Independent review found no blocking correctness/security issues; its recommended combined
  fullscreen/mobile-keyboard test was added and passes.

## Acceptance evidence

- [x] Native desktop, non-touch web, and unknown desktop request fullscreen once.
- [x] Native touch desktop auto-requests; Android/iOS/touch web preserve startup presentation.
- [x] Exit/reentry and native fullscreen events update the control from confirmed host state.
- [x] Missing/old APIs, thrown requests, asynchronous unsupported, and already-fullscreen startup
  preserve the signed exchange, input readiness, and lifecycle without automatic retries.
- [x] Desktop resize and portrait/landscape safe-area changes keep controls inside the safe viewport.
- [x] System/Telegram content insets combine correctly and clear when the host removes them.
- [x] Fullscreen with mobile keyboard shrink preserves visible controls, last-touch scrolling,
  keyboard focus, Tab forwarding, restoration and exactly one RFB/session exchange.
- [x] Existing finalization, terminal closure, cancellation, bounded reconnect and mobile typing pass.
- [x] Source-based screenshots inspected at desktop 1440x1000 and mobile 320x568 with safe insets.
  The local HTTP harness returned 200, reached mock RFB readiness, and was stopped after inspection.

## Existing full-suite failures

All failures are in `tests/unit/daemon/test_check_coordinator.py`:

- test_bookings_request_discovers_and_projects_authenticated_inventory
- test_current_agentic_positive_allows_selected_check_with_shared_residual_limits
- test_selected_booking_without_current_agentic_positive_is_rejected
- test_selected_check_surfaces_agentic_inventory_terminal_detail
- test_scheduled_agentic_plan_contains_only_current_run_positive_bookings
- test_compatibility_scheduler_reuses_inventory_residual_agentic_limits

The fixture stays end September 5, 2026, while the current date is September 6.
`evaluate_eligibility` correctly rejects past stays, so no monitoring projection is created.
These pre-existing failures were reproduced independently; unrelated tests/code were left intact.
The full repository gate is therefore **not clean**, despite passing affected checks.

## Limits and operations handoff

Mock Telegram/noVNC browser tests verify viewer behavior, not native popup/window-manager support
or actual remote framebuffer pixels. The fixed Android browser aspect ratio remains intentional.
Native Telegram Desktop fullscreen and mobile acceptance remain pending approved deployment.
No commit, push, merge, production restart, external message, or real account login was performed.

## Release integration — 2026-09-06T21:22:34Z

Rebased on production/latest main `863e9b517b51683de02e60adbb76971c6f4b49c9`, preserving
PRs 44–45. Those changes already repair the expired test fixtures described above. The final
integrated quality gate is clean: **1957 passed**, 55 existing warnings, Ruff clean, strict mypy
clean over 130 source files, artifact validator zero errors/warnings, status integrity zero
inconsistencies across 67 bolts/23 intents, and diff whitespace clean.

To avoid IDs allocated by upstream work, this viewer bolt was renumbered from 065 to 067 and
its story from US-170 to US-173; scope and implementation are unchanged. The owner explicitly
approved merge and VPS redeployment, with a Bugbot exception only if its usage limit is reached.
