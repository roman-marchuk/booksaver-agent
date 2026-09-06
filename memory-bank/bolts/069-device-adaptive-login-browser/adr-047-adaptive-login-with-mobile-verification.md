---
adr: ADR-047
status: accepted
created: 2026-09-06T21:44:35Z
bolt: 069-device-adaptive-login-browser
amends: ADR-026
depends_on: ADR-025, ADR-035
---

# ADR-047: Adaptive Login with Mobile Verification

## Context

The owner requests desktop/mobile device discovery for interactive login while all checks remain
mobile. Keeping the login viewport mobile on desktop wastes horizontal space; switching all
monitoring to desktop would change the accepted mobile-web pricing product.

## Decision

Allow a closed device class to select only the interactive VPS Chromium profile, after signed
Telegram exchange. Keep a waiting worker/lease so cancellation and replacement use the same
lifecycle. Unknown/older hints default to mobile. Verification always uses fresh configured
mobile contexts and the exact ADR-035 snapshot/receipt contract; checks stay mobile.

## Consequences and alternatives

No Safari/Firefox engine emulation, local-browser capture, user-agent fingerprint, persistent
device identity, schema or new dependency. Desktop-to-mobile session reuse must pass the existing
server verifier and later live rendered-check qualification; cookies are not assumed portable.
If mobile probes stay negative, retain the old session and existing retry/expiry behavior.
Matching all checks to the connecting device is rejected for this scope. Starting before discovery
or relaunching mid-login creates unnecessary races and is rejected.

The owner authorized this separation after its tradeoffs were discussed. Prior mobile identity
requirements continue to govern verification, inventory, price provenance and automated actions.
