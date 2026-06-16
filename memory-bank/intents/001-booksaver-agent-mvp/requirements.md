# Requirements: BookSaver Agent MVP

Migrated from the original MVP scope artifact into the official specs.md AI-DLC memory bank. Stories are now stored under unit folders and indexed in [`../../story-index.md`](../../story-index.md).

## Problem

After booking a **refundable hotel** on Booking.com, the live price can drop. The user wants a **local daemon** on their own machine to periodically check the booking via **browser automation**, detect a cheaper **equivalent** option, notify them, and optionally help **rebook** with explicit safety gates—not a hosted product or official travel API integration.

## User

Individual running the tool for themselves (or a small trusted circle, e.g. family). One machine, one config, no multi-tenant SaaS.

## In scope (MVP)

| Area | Scope |
|------|--------|
| Runtime | Single local Python daemon; scheduled background checks |
| Platform | **Booking.com** only — hotel bookings |
| Automation | Browser automation to open/manage booking and compare live price; **no** official Booking.com API |
| Intelligence | **LLM required** for extraction, reasoning, and page interpretation where DOM alone is insufficient |
| Data | Local config and persistence (booking reference, baseline price, check history) |
| Comparison | **Pragmatic equivalence**: same check-in/out dates, same property, same room type; new offer must still be **refundable** (cancellation policy may differ if still refundable) |
| Notify | **Email** and **Telegram** when a savings opportunity is found |
| Rebook | **Guided flow** with **mandatory user confirmation** before any cancel or new purchase action |
| Trust | Credentials and session data stay on the user’s machine |

## Out of scope (MVP)

- Other booking platforms (flights, Airbnb, other OTAs) — design for extension later only
- Official travel or Booking.com partner APIs
- Web frontend / mobile app / cloud backend
- Unattended auto-purchase without human confirmation
- Non-refundable bookings
- Corporate/multi-user admin, billing, or centralized user accounts

## Assumptions

- User already has a refundable hotel reservation on Booking.com they can access in a logged-in browser session (or can authenticate locally).
- User can configure SMTP (or send provider) and Telegram bot credentials locally.
- Price checks run on a schedule the user configures (e.g. every N hours); failures are logged and retried.
- “Savings” means live equivalent offer total is below original booked total (currency-normalized on same site).

## Non-goals

- Price prediction, cross-site meta-search, or loyalty points optimization
- Legal/compliance review of automating Booking.com (user accepts site ToS risk for personal use)

## Success (MVP)

1. User registers one hotel booking; daemon stores baseline locally.
2. On schedule, daemon checks live price via browser + LLM-assisted parsing.
3. When a pragmatic equivalent is cheaper and refundable, user gets email + Telegram alert.
4. User can start a guided rebook path; **no** cancel/charge without explicit confirmation step.

## Future (post-MVP)

- Additional platforms behind a pluggable “platform adapter” interface
- Optional notify channels; stricter equivalence presets per product type
