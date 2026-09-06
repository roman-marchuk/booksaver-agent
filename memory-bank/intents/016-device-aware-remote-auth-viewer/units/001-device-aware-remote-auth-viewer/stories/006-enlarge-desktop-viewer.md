---
id: 006-enlarge-desktop-viewer
unit: 001-device-aware-remote-auth-viewer
intent: 016-device-aware-remote-auth-viewer
status: complete
priority: must
created: 2026-09-06T20:39:36.000Z
assigned_bolt: 067-responsive-remote-auth-viewer
implemented: true
---

# Story: Enlarge the desktop viewer (US-173)

As a desktop Telegram user, I want the streamed login to use my available screen so that
Booking.com fields are readable without working inside a tiny popup.

## Acceptance Criteria

- [ ] Supported desktop hosts receive one fullscreen request at startup; mobile hosts do not.
- [ ] A host-supported accessible control enters/exits fullscreen and follows native changes.
- [ ] Older clients and failed fullscreen requests retain usable login without retry loops.
- [ ] Viewer and controls fit resized portrait/landscape viewports and system/Telegram safe areas.
- [ ] Enlargement does not reconnect RFB, reauthorize, cancel, or change the mobile framebuffer.
- [ ] Existing mobile keyboard and terminal/cancellation behavior passes regression coverage.

## Verification

Browser integration tests simulate Telegram capabilities and events. Native Telegram Desktop
fullscreen and mobile keyboard acceptance require a separately approved deployment.
