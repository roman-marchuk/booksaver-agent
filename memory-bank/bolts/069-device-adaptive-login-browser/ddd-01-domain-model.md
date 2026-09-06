---
stage: model
bolt: 069-device-adaptive-login-browser
created: 2026-09-06T21:44:35Z
---

# Domain Model

## Entities and aggregate

RemoteAuthAttempt owns one user, expiring capabilities, cancellation, worker, browser lease and
once-bound session finalization. Its presentation may be selected exactly once during the
authenticated exchange. A waiting attempt is STARTING and cannot expose WebSocket readiness.
The worker owns cleanup whether it starts a browser or ends while waiting.

## Value objects

LoginDevice is a closed desktop/mobile enum. It is a presentation preference, not authenticated
identity. Server-owned geometry is bounded: desktop 1280x800, mobile display 480x960.
The existing MobileWebSettings remains the independent authority for verification/check contexts.
CandidateSnapshot and receipt bind accepted cookies to the caller/attempt without recording device.

## Events and services

AuthenticatedViewerBound releases the waiting worker. Cancel/expire/purge/shutdown/replacement
can win before launch or capture. Runner creates the selected interactive profile; mobile verifier
retains the negative baseline and two positive probes. No repository or schema change is needed.

## Language

Device discovery means coarse client classification. Interactive profile means the VPS browser
used for human login. Verification/check profile means configured mobile Chromium. These profiles
are deliberately separate and cannot grant trust based on a client hint.
