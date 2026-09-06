---
id: 001-discover-login-device
unit: 002-device-adaptive-login-browser
intent: 016-device-aware-remote-auth-viewer
status: complete
priority: must
created: 2026-09-06T21:44:35.000Z
assigned_bolt: 069-device-adaptive-login-browser
implemented: true
---

# US-175: Discover login device class

As a BookSaver user, I want a login browser suited to my device while monitoring continues
using authenticated mobile-web prices.

## Acceptance criteria

Known desktop and non-touch recognized web select desktop; mobile/touch/unknown select mobile. Send only a bounded enum and retain older-viewer fallback.

## Qualification

Local automated coverage is required. Native Telegram and desktop-login-to-mobile-check acceptance
are operations gates; do not claim those outcomes from mocks.
