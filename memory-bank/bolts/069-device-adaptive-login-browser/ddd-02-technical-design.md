---
stage: design
bolt: 069-device-adaptive-login-browser
created: 2026-09-06T21:44:35Z
---

# Technical Design

## Contracts and layers

- Domain: LoginDevice enum and server-owned display-size property; unknown JSON values default
  to mobile without coercing arbitrary objects into strings.
- Viewer: known native desktop wins even with touch; recognized web uses fine-pointer/no-touch
  evidence; all uncertain cases choose mobile. Add login_device to the existing exchange body.
- Gateway: verify signed Telegram identity first, normalize optional enum, pass to manager.exchange.
- Application: per-attempt viewer-ready event and selected LoginDevice. exchange sets both under
  the existing lock after consuming the capability. Worker waits in bounded intervals, checking
  cancel/shutdown/expiry, then builds immutable RemoteBrowserWork with the selected enum.
  Existing completion code releases leases and delivers terminal state for both launched and
  never-launched attempts. Selection never restarts a browser or resets the attempt deadline.
- Runner: one geometry source supplies Xvfb and Chromium args. Desktop browser.new_context uses
  a native viewport within the 1280x800 display, no mobile/touch emulation, and configured locale/timezone. Mobile keeps
  its current context creation. Both use the same guarded navigation policy and cookie observer.
- Verifier: keep mobile descriptor/settings unchanged; isolated HTTP server probes authenticate
  exact snapshots from either producer. No broadening to UI/cookie-presence success.

## Persistence, privacy and limits

No schema/dependency/secret changes. Client class remains in memory for the attempt; no user-agent,
local browser access, hardware model, raw dimensions or arbitrary executable/launch arguments.
One browser lease exists even while waiting; old viewers omitting the hint get mobile after
authenticated exchange. No browser launches for an unopened link. Wait polling is bounded at
100ms and uses the existing attempt expiry. Cancellation remains authoritative before capture.

## Verification strategy

Domain normalization, signed gateway handling, deferred-launch race tests and profile geometry
checks; preserve existing lifecycle tests with authenticated exchange before runner expectations.
Run actual Chromium desktop/mobile smoke and prove independent mobile verifier options. Then
run targeted suites, full suite, Ruff/mypy and AI-DLC validators. Native Telegram/Desktop-to-mobile
account reuse must be qualified separately and cannot be inferred from HTTP-only authentication.

## VPS staging correction

Real headed Chromium creates an oversized native window for an explicit desktop viewport,
even with --kiosk. Desktop therefore uses no_viewport=True and sets the newly created window
to fullscreen through fixed CDP window-control calls before navigation. The native content
area fits the 1280x800 framebuffer (observed1279x799 on packaged Chromium). This fullscreen
is inside the VPS display, independent of Telegram popup fullscreen. Mobile is unchanged.
