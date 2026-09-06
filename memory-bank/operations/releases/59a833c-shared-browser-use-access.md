# Release 59a833c — Shared Browser Use access

- Verified: 2026-09-06T17:21:09Z
- Source: `59a833c9d67f0012cd5d2183b2eb840d31cba1be`, PR #44, merged.
- AI-DLC: Intent 023, Unit 007, Bolt 065; construction complete.
- Owner explicitly waived unavailable Cursor Bugbot review for this release. Bugbot returned
  NEUTRAL because its usage limit was reached; this is not a clean review result.
- Development verification: 1,931 tests, Ruff, mypy, artifact validation, and independent review
  passed for the unchanged PR head before merge.

## Build and staging

- Built the merged source on the VPS as `booksaver-agent:staging-59a833c`.
- Image: `sha256:f170084b324d65f8c98d3b47ccc7acc571363f3f05bdfcf6b0439dad5d17dd07`.
- OCI revision matches the merge commit.
- Runtime imports, candidate configuration, Compose validation, owner/consented-invitee routing,
  missing-consent refusal, and Telegram admin funding rendering passed in the release image.
- Quiesced the daemon before backing up data and running the isolated coordinator replay.
- The replay terminated unavailable: `Booking.com session is expired.` It did not verify a live
  price. A second diagnostic replay with `consented_users` routing confirmed the same cause.

## Production

- Promoted the tested image and recreated BookSaver; Caddy remained running.
- Effective configuration: `consented_users`, `browser_use`, agentic inventory, disclosure
  `anthropic-visible-booking-page-v1`, USD 1/check and USD 10/deployment-day limits.
- Container healthy, zero restarts, no OOM; memory approximately 29 MiB / 2 GiB.
- Internal and public `/healthz`: HTTP 200. Startup logs clean.
- Database snapshot: integrity ok, no foreign-key violations.
- Actual admin rendering against a database snapshot produced funding rows for all three users;
  no Telegram messages were sent by verification.
- Current disclosure records: zero. Invitees must accept the disclosure through `/connect` before
  Browser Use admission. The owner must reconnect to refresh the expired Booking.com session.
- Manual and scheduled price work use the same configured route. Live acceptance remains pending
  renewed authentication; deployment health is verified, live price success is not claimed.

## Rollback

- Previous image: `booksaver-agent:rollback-b0b6757-pre-59a833c`.
- Config, environment, and quiesced data archive:
  `/opt/booksaver-backups/59a833c-shared-access/`.
- Archive SHA256: `50ff95fdfcdc69d50016a3038c21c3b36633326aaf5ad64b5a540635f7c8a3ba`.
- Runtime rollback restores the saved configuration, retags the rollback image to latest, and
  recreates only BookSaver. Restoring database backups requires separate data-loss approval.
