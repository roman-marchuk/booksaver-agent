---
unit: 002-device-adaptive-login-browser
intent: 016-device-aware-remote-auth-viewer
status: complete
unit_type: cli
default_bolt_type: ddd-construction-bolt
created: 2026-09-06T21:44:35.000Z
updated: 2026-09-06T21:44:35.000Z
---

# Unit: Device-Adaptive Login Browser

## Purpose

Adapt the streamed login's desktop/mobile presentation to the connecting client while all
verification, inventory and price checking retain the configured mobile Chromium profile.

## Scope and requirements

FR-9/US-175: coarse discovery; FR-10/US-176: authenticated deferred launch; FR-11/US-177:
interactive profile split with unchanged mobile acceptance. One DDD bolt, 069, covers the
related profile value object, attempt lifecycle, gateway/viewer contract and runner changes.

## Constraints and dependencies

ADRs 025, 026 and 035: mobile pricing, signed Telegram authority, server-verification receipt,
per-user encrypted session and single coordinator/browser lease remain. No local browser access
or arbitrary device/browser dimensions. Native/live cross-profile qualification remains pending.

## Authorization

The owner requested device discovery and adaptive login while checks stay mobile after the
architecture tradeoffs were discussed. Proceed with this bounded local implementation and
verification; no merge or deployment of this new behavior is included in construction.
