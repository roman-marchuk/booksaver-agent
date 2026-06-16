---
unit: 001-core-local-data
bolt: 001-core-local-data
stage: model
status: complete
updated: 2026-06-16T16:27:51Z
---

# Static Model - Core & Local Data

> Scope: Bolt `001-core-local-data` — stories **US-002** (configure locally), **US-003**
> (register a refundable Booking.com hotel), **US-013** (operate without a BookSaver cloud).
> Daemon lifecycle and scheduler (US-001) are modeled in Bolt `002-core-local-data` and appear
> here only as forward references. No source code is produced in this stage.

## Bounded Context

**Core & Local Data** is the local-first foundation context of BookSaver Agent. It is the
single source of truth, on the user's own machine, for two things:

1. **How the daemon is configured** — schedule, local data location, and credential/settings
   placeholders that later units fill in.
2. **What is being watched** — registered, refundable Booking.com hotel bookings and their
   original price baselines.

The context owns all reading and writing of this data and guarantees it never leaves the local
machine (no BookSaver-hosted backend). Downstream contexts (Price Monitor, Savings &
Notifications, Guided Rebook) are **consumers**: they read `Config`, `Booking`, and persistence
paths through this context's interfaces but do not own the data. The boundary is deliberately
drawn so that browser automation, LLM extraction, savings evaluation, and notification logic
live *outside* this context.

## Domain Entities

| Entity | Properties | Business Rules |
|--------|------------|----------------|
| **Booking** (aggregate root) | `bookingId` (local identity), `platform`, `productType`, `confirmationId`, `property`, `stayDates`, `roomType`, `baselinePrice`, `refundability`, `registeredAt`, `status` (`active` / `archived`) | Identity is unique; a booking is only valid if `platform = booking_com`, `productType = hotel`, and it is refundable at registration; `baselinePrice` is captured once at registration and is immutable thereafter (it *is* the baseline); `confirmationId` is unique within the local store |
| **Config** (aggregate root) | `checkInterval`, `dataDirectory`, `notificationSettings` (placeholder until Unit 3), `extractionSettings` (LLM/browser placeholder until Unit 2), `loadedAt` | Assembled and validated as a unit on startup; all *required* fields must be present and valid or load fails with a clear error; `dataDirectory` must resolve to a local filesystem path; secrets are read from local config/environment and are never written back to git-tracked files |

## Value Objects

| Value Object | Properties | Constraints |
|--------------|------------|-------------|
| **Money** | `amount` (decimal), `currency` (ISO-4217) | `amount >= 0`; `currency` is a valid 3-letter code; equality by value; used for the price baseline |
| **StayDates** (DateRange) | `checkIn` (date), `checkOut` (date) | `checkOut > checkIn`; both are valid calendar dates; equality by value |
| **ConfirmationId** | `value` (string) | Non-empty, trimmed; used as the natural key against the store |
| **Platform** | enum | MVP allows only `booking_com`; any other value is rejected |
| **ProductType** | enum | MVP allows only `hotel`; any other value is rejected |
| **Property** | `name`, `bookingComRef` (property id / URL) | `name` non-empty; `bookingComRef` identifies the hotel on Booking.com |
| **RoomType** | `label` (string) | Non-empty; part of future equivalence checks (Unit 3) |
| **RefundabilityPolicy** | `isRefundable` (bool), `note` (free text), `deadline` (optional date) | Must be `isRefundable = true` for the booking to be registrable; `deadline`, if present, must be a valid date |
| **CheckInterval** | `duration` | Strictly positive; bounded by a sensible minimum (avoid abusive polling) |
| **DataDirectory** | `path` | Must be a **local** path (not a URL/remote location); must be resolvable and writable |
| **NotificationSettings** | `email` (placeholder), `telegram` (placeholder) | Structure defined now; fully validated by Unit 3. Secrets never persisted to git |

## Aggregates

| Aggregate Root | Members | Invariants |
|----------------|---------|------------|
| **Booking** | `ConfirmationId`, `Platform`, `ProductType`, `Property`, `StayDates`, `RoomType`, `Money` (baseline), `RefundabilityPolicy` | Platform is `booking_com`; product type is `hotel`; booking is refundable; baseline price is immutable after registration; the aggregate is the consistency boundary for "a watched booking" |
| **Config** | `CheckInterval`, `DataDirectory`, `NotificationSettings`, `extractionSettings` (placeholder) | All required fields valid before the config is usable; `DataDirectory` is local; the assembled config is treated as an immutable snapshot for the run |

## Domain Events

| Event | Trigger | Payload |
|-------|---------|---------|
| **BookingRegistered** | A submission passes all rules and is persisted | `bookingId`, `platform`, `property`, `stayDates`, `roomType`, `baselinePrice`, `registeredAt` |
| **BookingRegistrationRejected** | A submission violates a rule (wrong platform, not a hotel, not refundable, duplicate confirmation) | `reason` (clear message), summary of submitted data |
| **ConfigLoaded** | Config is successfully assembled and validated at startup | effective config **without secrets**, `dataDirectory`, `checkInterval` |
| **ConfigValidationFailed** | Required config is missing or invalid on load | ordered list of validation errors |

> In a single-process CLI these events may be realized as structured local log entries rather
> than a published event bus; they are captured here to make the triggers and payloads explicit.

## Domain Services

| Service | Operations | Dependencies |
|---------|------------|--------------|
| **BookingRegistrationService** | `register(submission) -> Booking` — validate platform/product-type/refundability, reject duplicates with a clear message, construct the `Booking`, persist it, record the baseline, emit `BookingRegistered` / `BookingRegistrationRejected` | `BookingRepository` |
| **ConfigurationService** (loader) | `load(sources) -> Config` — assemble config from local file(s) + environment, resolve secrets locally, validate, emit `ConfigLoaded` / `ConfigValidationFailed` | `ConfigSource` (local file system + environment) |
| **LocalOnlyDataPolicy** (specification) | `assertLocal(targetPath)` — every persistence path must resolve under `Config.dataDirectory`; forbids remote/networked targets and any BookSaver-hosted backend (enforces **US-013**) | `Config.dataDirectory` |

## Repository Interfaces

| Repository | Entity | Methods |
|------------|--------|---------|
| **BookingRepository** | `Booking` | `add(booking)`, `getById(bookingId)`, `getByConfirmation(confirmationId)`, `listActive()`, `exists(confirmationId)` |
| **CheckHistoryRepository** | `CheckRecord` (entity owned/populated by Unit 2) | `append(record)`, `listForBooking(bookingId)` — contract and local-only guarantee defined here; record shape finalized in Unit 2 |
| **ConfigSource** (read-only) | raw configuration | `read() -> RawConfig` from local file(s) + environment; no write-back of secrets |

> All repository implementations are bound by `LocalOnlyDataPolicy`: storage resolves strictly
> under the user's `dataDirectory`, satisfying the local-only invariant for every consumer unit.

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Booking** | A user's existing, refundable Booking.com hotel reservation registered for monitoring |
| **Baseline** | The original total price (`Money`) recorded at registration; immutable; the reference for future savings checks |
| **Refundable / Refundability** | Whether the reservation can be cancelled for a refund; a precondition for registration and (later) for counting a cheaper offer as savings |
| **Confirmation ID** | The Booking.com confirmation number; the natural key for a registered booking |
| **Property** | The specific hotel on Booking.com (name + reference) |
| **Room Type** | The booked room category; part of future equivalence rules |
| **Stay Dates** | Check-in and check-out dates of the reservation |
| **Check Interval** | How often the daemon runs scheduled checks (configured locally) |
| **Data Directory** | The local filesystem location where all BookSaver data is stored |
| **Local-only** | The guarantee that all data is read/written on the user's machine, with no BookSaver-hosted backend |
| **LocalStore** | The collective local persistence (bookings + check history) exposed via repository interfaces |
| **Registration** | The act of adding a booking to the LocalStore after validation |
| **Daemon / Scheduler** | The background process and interval trigger — *forward reference*, modeled in Bolt `002-core-local-data` |
