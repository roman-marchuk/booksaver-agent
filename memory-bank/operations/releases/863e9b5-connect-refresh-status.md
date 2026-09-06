# Release 863e9b5 — Connect refresh status

- Verified: 2026-09-06T20:26:41Z.
- PR #45 merged as `863e9b517b51683de02e60adbb76971c6f4b49c9`.
- Intent 023, Unit 008, US-172, Bolt 066 completed through AI-DLC.
- Bugbot attempted final head `1479c284fafe0c9e7e0716cb4b87fe3725977988` and reached
  its usage limit. Owner's explicit waiver applied; no successful Bugbot review is claimed.

## Development and staged verification

- 1,941 tests passed; Ruff, mypy (130 source files), CLI smoke, and both AI-DLC validators passed.
- Independent review found no blocking issues. Pre-admission wording was clarified.
- Six expired test fixtures were corrected to use future UTC dates; production behavior unchanged.
- Exact merge-image smoke passed ordered progress, accepted-positive success, and busy refusal.
- Production configuration and Compose validation passed.
- Quiesced daemon before state backup and the isolated coordinator replay; no concurrent browser.
- The exact release image ran the full inventory prerequisite and Browser Use price check with
  `consented_users` routing. Exit 0; authenticated mobile-web USD observation accepted; no failure,
  no fallback, zero violations. Recorded model cost USD 0.138255; recorded price-stage duration
  72,093 ms (not total replay wall time). No Telegram notification was sent by the replay.
- A non-interactive click was rejected during inventory; the agent continued to successful completion.

## Production verification

- Running image: `sha256:df5b49fe8fc6ed706fb2a757f91c2e988d4aa634f36e14a170c299a66e8c6179`.
- OCI revision matches the merge SHA; promoted the exact tested image without rebuilding it.
- BookSaver recreated; Caddy remained running with existing public port bindings.
- Internal and public `/healthz` returned 200; startup logs clean; zero restarts and no OOM.
- Database quick_check ok, zero foreign-key violations.
- Existing shared-user Browser Use routing and all time/cost/session limits retained.
- Authentication notification ordering is covered by deterministic tests; human `/connect` UI
  acceptance remains user-driven. No human login was simulated or claimed.

## Recovery

- Previous runtime: `booksaver-agent:rollback-59a833c-pre-863e9b5`.
- Config, environment, and quiesced data archive: `/opt/booksaver-backups/863e9b5-connect-refresh/`.
- Archive SHA256: `433887a5b97740feaba9568b1e7847f4f3a393a257f3b82de5599735feb44b41`.
- Runtime rollback retags the previous image to latest and recreates only BookSaver. No schema or
  config change in this release. Restoring old data requires separate data-loss approval.
