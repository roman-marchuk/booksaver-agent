---
id: 002-bind-device-before-browser-launch
unit: 002-device-adaptive-login-browser
intent: 016-device-aware-remote-auth-viewer
status: complete
priority: must
created: 2026-09-06T21:44:35.000Z
assigned_bolt: 069-device-adaptive-login-browser
implemented: true
---

# US-176: Bind device before browser launch

As a BookSaver user, I want a login browser suited to my device while monitoring continues
using authenticated mobile-web prices.

## Acceptance criteria

Only an authenticated one-time exchange selects the immutable login profile. Waiting cancellation, expiry, shutdown, purge and replacement release the gate without launching stale work.

## Qualification

Local automated coverage is required. Native Telegram and desktop-login-to-mobile-check acceptance
are operations gates; do not claim those outcomes from mocks.
