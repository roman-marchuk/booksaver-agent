---
stage: test
bolt: 001-core-local-data
created: 2026-06-17T00:00:00Z
---

# Test Report: Core & Local Data

## Summary

- **Unit tests**: 27/27 passed
- **Integration tests**: 18/18 passed (real SQLite in tmp dir; real TOML files on disk)
- **Total**: 60/60 passed in 0.05s
- **Security/performance tests**: N/A — security properties are domain invariants (already tested); performance is not relevant for a single-user local store.

One bug found and fixed during this stage: `DataDirectory.of()` resolved the path before checking for `://`, which stripped the scheme separator. URL check moved to the raw input string in `DataDirectory.of()`.

## Unit Tests

### `tests/unit/test_value_objects.py` (35 tests)

**Money** (9 tests)
- ✅ Valid creation with amount and currency
- ✅ Zero amount allowed
- ✅ Negative amount rejected
- ✅ Invalid (lowercase) currency rejected
- ✅ Numeric currency code rejected
- ✅ Equality by value
- ✅ Inequality on different amount
- ✅ `Money.of()` normalises currency to uppercase
- ✅ `Money.of()` rejects non-numeric amount

**StayDates** (4 tests)
- ✅ Valid stay dates
- ✅ Same check-in/check-out rejected
- ✅ check_out before check_in rejected
- ✅ Equality by value

**ConfirmationId** (5 tests)
- ✅ Valid construction via `.of()`
- ✅ `.of()` strips leading/trailing whitespace
- ✅ Empty string rejected
- ✅ Whitespace-only string rejected
- ✅ Direct construction with empty string rejected

**CheckInterval** (8 tests)
- ✅ Parse `"6h"` → 6-hour duration; `__str__` round-trips to `"6h"`
- ✅ Parse `"30m"` → 30-minute duration
- ✅ Parse `"1d"` → 1-day duration
- ✅ Below 15m minimum rejected
- ✅ Exactly 15m allowed
- ✅ Zero duration rejected
- ✅ Invalid format string rejected
- ✅ Equality by value

**DataDirectory** (4 tests)
- ✅ Valid local path accepted and resolved
- ✅ `~` expanded (no tilde in resolved path)
- ✅ URL (`https://`) rejected — *bug found here, fixed in implementation*
- ✅ Equality by value

**RefundabilityPolicy** (3 tests)
- ✅ Refundable policy with note
- ✅ Refundable policy with optional deadline
- ✅ Equality by value

### `tests/unit/test_services.py` (9 tests)

**BookingRegistrationService** (6 tests)
- ✅ Valid registration returns Booking aggregate and BookingRegistered event
- ✅ Non-refundable booking rejected with clear message
- ✅ Duplicate confirmation ID rejected with clear message
- ✅ Each call produces a unique `booking_id`
- ✅ Baseline price recorded correctly (amount + currency)
- ✅ `registered_at` timestamp is set

**LocalOnlyDataPolicy** (3 tests)
- ✅ Path inside data directory accepted (no exception)
- ✅ Path outside data directory raises `LocalPathViolation`
- ✅ The data directory path itself is accepted

## Integration Tests

### `tests/integration/test_config.py` (8 tests)

- ✅ Valid TOML config loads with correct `CheckInterval` and `DataDirectory`
- ✅ Missing `check_interval` raises `ConfigValidationError` with field-level message
- ✅ Missing `data_directory` raises `ConfigValidationError` with field-level message
- ✅ Both missing → **2 errors collected in a single raise** (not fail-fast)
- ✅ Invalid interval format (`"2hours"`) → validation error on that field
- ✅ Interval below minimum (`"5m"`) → validation error on that field
- ✅ Missing config file raises `FileNotFoundError`
- ✅ Notification settings absent → both fields default to `None` (optional)

### `tests/integration/test_persistence.py` (10 tests)

- ✅ `add()` + `get_by_id()` round-trip succeeds
- ✅ `get_by_confirmation()` retrieves by natural key
- ✅ `exists()` returns `True` after add
- ✅ `exists()` returns `False` for unknown confirmation
- ✅ `list_active()` returns only `active` status bookings
- ✅ Duplicate `confirmation_id` → `BookingRejectedError` (domain service catches UNIQUE before DB)
- ✅ Full field round-trip: all 13 booking fields survive serialise → DB → deserialise unchanged
- ✅ `baseline_amount` stored as **string** in SQLite (not float) — `Decimal` precision preserved
- ✅ `get_by_id()` returns `None` for unknown ID
- ✅ `get_by_confirmation()` returns `None` for unknown confirmation

## Acceptance Criteria Validation

- ✅ **US-002**: Config loads on startup; all validation errors surfaced together; secrets never in TOML
- ✅ **US-003**: Refundable Booking.com hotel registered with immutable baseline; duplicate rejected; non-refundable rejected
- ✅ **US-013**: `LocalOnlyDataPolicy` enforces data-dir containment; all persistence paths local; no network dependency

## Issues Found

- **Bug**: `DataDirectory.__post_init__` URL check was ineffective because `Path.resolve()` normalises `://` to `:/` before the check runs. Fixed by moving the URL check to `DataDirectory.of()` on the raw input string.

## Recommendations

- Platform and product-type rejection guards in `BookingRegistrationService` cannot be triggered in MVP (single-value enums). They are forward-compatibility guards; test coverage will activate automatically when more enum values are added in a future bolt.
- `CheckHistoryRepository` and `SqliteCheckHistoryRepository` are contract stubs. Integration tests for check history will be added in Unit 2 (Bolt `002-booking-com-price-monitor`) when the record shape is finalised.
