# Implementation Walkthrough

The viewer sends only an allowlisted desktop/mobile hint with the existing signed exchange.
The gateway verifies Telegram identity before passing the normalized hint to the manager.
A waiting worker retains the shared browser lease, binds the hint once, and uses the original
expiry and cancellation paths before launching. Unopened attempts launch no browser.

The runner uses one fixed geometry for Xvfb and Chromium. Desktop login creates a native-viewport
non-mobile, non-touch context in a 1280x800 display with Chromium's native user agent and configured locale/timezone.
Mobile login uses the unchanged Android context helper. The independent verifier continues
receiving the mobile descriptor and settings for every login producer. Check execution is unchanged.

The viewer preserves existing fullscreen behavior and uses the landscape aspect ratio for its
keyboard layout on touch-capable desktop clients. Resizing does not relaunch or change identity.
No database, dependency, executable selection, user-agent collection, or logging changes.

Local implementation and verification follow the owner's request; deployment and live account
qualification remain separate from this construction result.
