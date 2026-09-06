# Implementation Walkthrough

Removed manual registration, edit/delete, guided rebooking and post-rebooking modules, their mutation ports/repositories, and dedicated feature tests. Existing schema tables and migration/purge SQL remain for old databases. Surviving tests seed strict booking projections from tests/support/bookings.py; production projection writes remain account-sync-owned.

Deleted the source-dead manage-page monitor, global plaintext session repository/manager, old interactive login helpers, CLI factories, and cache deletion. The current search monitor exposes run_authenticated without null global-session plumbing; its search core is private. Occupancy failures now request a /bookings refresh instead of a retired CLI mutation.

Removed unused OwnerGuard, bind_for_booking, test-only incident projection, semantic-proof types and inactive classifier/inventory helpers. The active page resolver and CodeVerificationReceipt still own verified state. ADR-033 remains historical architectural evidence; the unused concrete proof types are retired in favor of the already-running FreshPageObservation/PageStateResolution implementation. Negative inventory claims remain rejected at interpretation, grounding and persistence boundaries. The active classifier sanitizer is unchanged.
