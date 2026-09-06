---
stage: test
bolt: 069-device-adaptive-login-browser
created: 2026-09-06T21:52:12Z
---

# Test Report

## Automated evidence

- Full repository suite: 1999 passed, 55 existing deprecation warnings, 39.91 seconds.
- Focused manager suite: 31 passed; viewer browser suite: 40 passed; gateway/runner suites: 38 passed.
- Ruff: all checks passed. Mypy: no issues in 130 source files. git diff --check: clean.
- Independent source review: no actionable correctness/security findings.

Coverage includes native desktop/mobile, touch desktop, web pointer capability, missing/unknown
hints and older exchange clients; malformed hints normalize safely and cannot bypass signed
identity. The selected profile is bound once and replay/cross-user attempts cannot change it.
Unopened cancellation, expiry, daemon shutdown and same-user replacement launch no browser and
release the lease. Existing finalization, session isolation and failure behavior remain covered.
Both runner paths preserve mobile verifier inputs and existing navigation guards. Desktop context,
Chromium window and Xvfb use matching geometry; stopped attempts initialize no browser tools.

## Real local Chromium smoke

Used current workspace source through PYTHONPATH=src and real Playwright Chromium 149, headless,
without external navigation or account credentials. Desktop viewport/screen 1280x800, DPR 1,
zero touch points and native local desktop Chromium UA. Mobile real Pixel 7 viewport/screen
412x839, DPR 2.625, one touch point, coarse pointer and Android Mobile Chromium UA. Both retain
en-US/UTC. The mobile Xvfb display remains the existing 480x960; the mobile descriptor is unchanged.
This verifies context construction, not the VPS Xvfb/noVNC stack or native Telegram embedding.

## Remaining operations qualification

No commit, merge or deployment performed. Native Telegram device detection and live desktop
/connect followed by a successful mobile /checknow remain qualification gates. Mobile HTTP
server probes must accept the exact desktop-produced snapshot before it can be saved, but those
probes do not prove rendered inventory or price-check acceptance. No such live result is claimed.

## Release integration verification

Rebased onto production 4b52ea3, preserving PR 47 diagnostics. Renumbered this work to
Bolt 069 and US-175–177 because upstream allocated Bolt 068/US-174. The integrated suite
passed 2020 tests in 40.13 seconds; Ruff, mypy (131 files), artifact/status and whitespace
checks passed. The owner explicitly authorized merge and VPS redeployment.
