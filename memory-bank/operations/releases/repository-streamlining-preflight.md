---
intent: 024-repository-streamlining
status: blocked
created: 2026-09-06T22:20:39Z
---

# Repository Streamlining Release Preflight

The user authorized committing, merging and redeploying the reviewed cleanup. PR #49 contains
the release candidate. Current main PR #48 (`0ca8b8f`) was integrated before release, preserving
device-adaptive login behavior. Cleanup uses Bolts 070–072 and US-178–183 to avoid allocations
that landed concurrently. No production promotion has occurred from this task.

## Candidate verification

- Full integrated suite: 1768 passed, 52 existing warnings, 36.26 seconds.
- Ruff and strict mypy passed (115 source files); source CLI help passed.
- Node policy/validator tests: 16 passed.
- Artifact validator: zero errors, 471 historical warnings (466 timestamp precision and five legacy
  name-only stage lists). Status integrity: zero inconsistencies, 72 bolts/24 intents.
- The remote-browser test conflict retained both model-free sentinels and every upstream
  device/profile/fullscreen/lifecycle case; an independent worker verified its 18 tests.
- Existing wheel validation loaded all six packaged fixtures and excluded retired modules.
  Production image build/staging remain pending the merge gate.

## Merge blocker

Cursor reported that Bugbot could not run because its account/team usage limit was reached.
The check returned NEUTRAL, not SUCCESS. No absence of comments or clean local tests substitutes
for the required current-head Bugbot check. Restore available Bugbot usage or obtain an explicit
owner waiver of that repository gate before merging. No waiver was inferred from general release
authorization. Check the final PR head again with scripts/bugbot_merge_gate.py after push.

## Read-only VPS snapshot

At approximately 22:19 UTC, production was revision `4b52ea3`, image
`sha256:aa67ef15c0ac13f911256696027bb7a87560080018995b304c865c86237db94d`.
BookSaver and Caddy were healthy; internal/public health returned 200; heartbeat was fresh;
restarts/OOM were zero/false. SQLite schema18 quick_check passed and foreign-key violations were
zero. There was no active browser process or unfinished inventory run. Only SSH and Caddy ports
were externally exposed. Another task's device-adaptive staging image is reserved; do not remove it.

The host had 4GB disk free (90% used), approximately2.85GB available RAM, and2GB swap.
Docker reported3.696GB reclaimable build cache. Recheck capacity before a cached build; preserve
all production/rollback images, volumes and other tasks' laboratory containers. Any necessary
cache cleanup must be bounded to unused regenerable build cache.

## Pending deployment sequence

1. Verify the final merge gate and merge; pin the resulting main SHA.
2. Recheck current production and other task activity; preserve operator config/env and data.
3. Build and verify the exact candidate image in isolation, including imports, dependencies,
   CLI/config, packaged corpus, noVNC/Caddy/Compose and Chromium startup/cleanup. Never start a
   second production daemon or share its browser lease.
4. Tag the actual current image for rollback; back up config/env and quiesced data with restricted
   permissions. Gracefully stop only BookSaver and verify data/backup integrity.
5. Use the existing notification-free read-only probe if session/budget allow; it currently forces
   OWNER_CANARY and cannot alone prove configured consented_users admission.
6. Promote the tested image, recreate only BookSaver, then verify revision, health, heartbeat,
   logs, dependencies, ports, DB integrity and absence of orphan browser processes.
7. On a release regression, restore the prior image; do not automatically overwrite newer user
   data with an older database backup.
