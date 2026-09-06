---
stage: plan
bolt: 067-responsive-remote-auth-viewer
created: 2026-09-06T20:40:20Z
---

# Implementation Plan

## Objective and deliverables

Use Telegram Bot API 8.0 fullscreen on desktop with an explicit reversible control, expanded
window fallback, and safe-area-aware responsive sizing. Keep changes inside viewer.py and
its existing browser regression harness.

## Dependencies and approach

- Existing Telegram WebApp bridge: feature/version checks, requestFullscreen/exitFullscreen,
  fullscreenChanged/fullscreenFailed and viewport/safe-area events.
- Existing noVNC scaling: retain scaleViewport=true, resizeSession=false and mobile aspect ratio.
- A compact header control avoids adding width to the already dense mobile keyboard dock.
- Automatic desktop request happens once; mobile startup is unchanged. All host failures are
  presentation-only and must not break signed authorization or obscure session status.
- Reserve all four system/Telegram safe edges and recalculate on resize/orientation/fullscreen.
- No new dependency, credential endpoint, CSP change, external browser link, or persistence.

## Acceptance criteria

1. Supported desktop fullscreen request and explicit exit/reentry work.
2. Old/missing/throwing/unsupported hosts still authorize and connect with no automatic retries.
3. Resize and safe-area changes keep controls visible and reuse one RFB instance.
4. Mobile input, cancellation, finalization and successful closure retain behavior.
5. Browser regressions, remote-auth tests, Ruff, mypy, full suite and AI-DLC validation pass.

## Evidence and review boundary

Official API reference: https://core.telegram.org/bots/webapps (reviewed 2026-09-06).
Fullscreen is a host request, not guaranteed native window control. Native Telegram desktop
and mobile acceptance follows separately approved deployment. The owner requested implementation
of this bounded fix; local stages proceed within that scope, with final review before Git/deploy.
