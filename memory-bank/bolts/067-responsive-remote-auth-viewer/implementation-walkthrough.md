---
stage: implement
bolt: 067-responsive-remote-auth-viewer
created: 2026-09-06T20:40:53Z
---

# Implementation Walkthrough

## Summary

The existing viewer requests fullscreen once on supported native desktop or non-touch web
clients. A header control permits entering/exiting fullscreen, while older hosts retain the
expanded viewer. Safe edges and responsive controls preserve usable content after size changes.

## Structure Overview

Presentation stays in the generated Mini App document alongside the existing input and lifecycle
handlers. Telegram capability errors have separate presentation feedback from session status.

## Completed Work

- [x] `src/booksaver/infrastructure/remote_auth/viewer.py` — optional fullscreen control,
  desktop startup request, graceful failure, all-edge safe areas, wrapping input dock,
  readable keyboard labels and a compact header during software-keyboard use.
- [x] Intent 016 / US-173 / Bolt 067 — scoped requirements, construction plan and status tracking.

## Key Decisions

- System safe insets and Telegram content insets are additive; CSS device insets and Telegram
  system insets overlap and use their maximum.
- Known native desktop clients auto-request even on touch laptops; mobile/web touch clients
  retain manual fullscreen choice.
- Fullscreen failure does not overwrite the session status or retry automatically.
- Fixed mobile framebuffer and noVNC scaling remain unchanged.

## Deviations from Plan

None.

## Dependencies Added

None.

## Developer Notes

Native client acceptance remains necessary after approved deployment. Browser mocks verify the
bridge contract and rendered layout, not the native Telegram window manager.
