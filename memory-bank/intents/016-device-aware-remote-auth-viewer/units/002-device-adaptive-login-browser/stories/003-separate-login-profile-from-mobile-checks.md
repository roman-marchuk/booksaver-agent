---
id: 003-separate-login-profile-from-mobile-checks
unit: 002-device-adaptive-login-browser
intent: 016-device-aware-remote-auth-viewer
status: complete
priority: must
created: 2026-09-06T21:44:35.000Z
assigned_bolt: 069-device-adaptive-login-browser
implemented: true
---

# US-177: Separate login profile from mobile checks

As a BookSaver user, I want a login browser suited to my device while monitoring continues
using authenticated mobile-web prices.

## Acceptance criteria

Display/window/context match the selected login profile; fresh mobile verification and all check settings remain independent. Preserve receipts, navigation guards and session isolation.

## Qualification

Local automated coverage is required. Native Telegram and desktop-login-to-mobile-check acceptance
are operations gates; do not claim those outcomes from mocks.
