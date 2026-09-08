# Invited-user reservation refresh failure — 8 September 2026

Status as recorded 2026-09-08T22:09:27Z: candidate accepts the father's current reservations in isolated live
replay; the separate explicit-empty caller replay also passed on corrected candidate source. Final
quality gate and restored-service verification passed. Final-head release review, merge, and
deployment remain pending. This is not a claim of production resolution.

## Evidence

Read-only SSH inspection found production revision `3fa2487` (PR #49), a healthy BookSaver container,
and the same running image for owner and invited-user jobs. The supplied screenshots were matched
to one invited account using the displayed reservation; no reservation identifiers, account names,
Telegram identifiers, cookies, or page content are recorded here.

| UTC completion | Trigger | Recorded terminal | Accepted reservations | Duration |
| --- | --- | --- | --- | --- |
| 05:04:34 | `/bookings`, before reconnect | authentication required (expired session) | 0 | — |
| 05:11:03 | post-connect | provider_failure | 0 | 147.634 s |
| 05:16:00 | `/bookings` | provider_failure | 0 | 167.658 s |
| 14:24:03 | scheduled | provider_failure | 0 | 162.010 s |

All three post-connect failures used the same newly saved session revision. They entered the real
Browser Use episode after the code-owned authentication probe. Active account access and paid model
calls were present; neither an invite admission denial nor a missing API key explains these runs.
The audit recorded no executed safety violations. One unsafe visual-click candidate was rejected
in the first run; the agent continued afterward. These were not recorded as time/cost-limit stops.

Owner inventory jobs on the same image accepted one reservation repeatedly, including at 04:49,
12:49, 13:28, 13:30, and 18:29 UTC. The affected account's last recorded positive synchronization
was 29 July; the screenshot's reservation/price was preserved saved data, not a successful refresh.

## Original failure localization and uncertainty

The three failed episodes ran 11–13 model steps, attempted identity and optional-fact submission,
and ended without a final observation. Content-free page diagnostics found the saved hotel name
in 2–4 snapshots, with zero recognized confirmation/date/full-match hits.

Those counters do **not** prove that dates were absent from the page. The saved-booking matcher
recognizes only limited English month-first, US numeric, and ISO date representations. Day-first
and non-Latin dates can fail recognition. Locale/layout differences are plausible, but no retained
page evidence establishes the language or exact date representation for this account.

Submission action names also do **not** prove acceptance: a rejected submission is returned to the
model as a continuation, not necessarily as a Browser Use error. `done(success=false)` produces
`provider_failure` even when partial identities remain buffered. Existing logs omit submission
acceptance and the requested success flag. Consequently the provider-failure label does not prove
an Anthropic outage, and the exact reason cannot be reconstructed from these records alone.

These initial observations did not justify relaxing identity validation or broadening date regexes.
Subsequent caller-specific inspection/replay below supplied concrete evidence for a narrower terminal
outcome correction while retaining existing identity, authentication, and safety checks.

## Confirmed account-specific differences

Caller-preserving inspection identified different inputs behind the owner/invitee contrast. The
father's current Booking.com reservation identifiers/stay facts differed from previously saved
records, while the owner repeatedly exercised a simpler unchanged saved match. A separate invited
account displayed an authenticated explicit empty upcoming page, confirmed by HTTP and live browser.
These are distinct paths, not evidence that invited users lack browser or model access.

The father path could submit useful current identities and then end the agent episode without a
successful whole-account finish. The original terminal handling discarded buffered positive evidence
in that case. The candidate preserves independently validated current-run identities on guarded
`done(false)` while keeping traversal incomplete and retaining authentication, unsafe-action, time,
action, and cost failure precedence. This never loosens saved/current identity validation.

The empty account had no valid model-declared completion path. A code-owned pre-model empty outcome
now requires an authenticated exact upcoming page and strict explicit empty evidence read from
rendered CDP bodyText. It remains incomplete with zero positive records and never deletes, marks
absent, deactivates, or grants price eligibility to saved reservations. Provider terminal output
cannot assert this result. Safety, destination, authentication, and limits are rechecked after the
awaited page read. Raw rendered text is transient and is not recorded here.

Initial live detection falsely interpreted the footer `2026 Booking.com` as a booking count. The
candidate now uses strict booking-count evidence and includes that exact footer as a regression;
the corrected live replay passed as documented below.

## User-facing correction

- Plain-language `/connect`, loading, `/bookings`, and `/status` messages distinguish saved login,
  partial update, observed empty upcoming page, failed loading, and previously saved reservations.
- Internal failure details/codes and provider terminology are not pasted into Telegram.
- Saved login no longer implies successful inventory loading; status dates explicitly show UTC.
- Reconnect and personal-key guidance remain specific; ordinary loading failure suggests /bookings.
- Content-free terminal diagnostics retain bounded accepted/rejected identity/fact counts and closed
  outcomes without confirmation numbers, raw page content, model reasoning, or session secrets.

Intent 023 Unit 010 / Bolt 073 (US-184 through US-186) owns the correction under specs.md AI-DLC.
There is no new schema, provider, routing policy, transaction authority, or absence authority.

## Isolated live replay evidence

The father replay exercised the normal coordinator on the production image with candidate source,
retaining the exact caller, consent, routing, and encrypted-session ownership. It used an isolated
state clone with production as a read-only source, notifications disabled, and serialized browser
work during the approved operational pause.

| Result | Observed value |
| --- | --- |
| Accepted/current reservations discovered | 2 / 2 |
| Price-eligible reservations | 0 |
| Inventory completeness | Incomplete |
| Failure | None |
| Duration | 151,989 ms |
| Cost | 373,401 microUSD (USD 0.373401) |

This establishes candidate inventory acceptance for the father's current records. It does not
establish price eligibility, a price result, final Telegram delivery, or deployed behavior. The
separate empty account was qualified independently rather than inferred from this positive-record
result or owner success.

The final empty-account normal-coordinator replay returned `empty_upcoming=true`, terminal
`empty_upcoming`, incomplete, no failure, zero accepted/discovered/rejected records, **29,390 ms**,
and **zero model cost**. The rendered evidence flags confirmed the expected root, heading, active
scope, explicit empty introduction/follow-up, and no contradictory booking count. The result keeps
all saved rows and does not grant absence or price-check authority.

The daemon restart trap ran after both replay sessions. A prior restoration was healthy with zero
restarts; final service verification confirms running/healthy, zero restarts, OOM false, heartbeat 15 seconds,
public health OK, Caddy up six weeks, and only 80/443 published (BookSaver 8080/6080 internal).

## Validation and release state

- Earlier full candidate gate: **1,811 passed**; Ruff passed; mypy passed across **117** source files.
- Final gate including the footer/count correction: **1,839 tests passed**, 52 existing warnings,
  44.42 seconds. Ruff source/tests/probe passed; mypy **117** source files passed.
- Independent review added seven post-await safety/terminal regressions: **47 focused tests passed**,
  with no issues reported. Final-head release checks remain separate.
- AI-DLC artifact validation earlier passed with zero errors and no new-unit/bolt findings;
  471 historical warnings remain. Status integrity: zero inconsistencies across 73 bolts/24 intents.
- The user authorized the straightforward verified fix through AI-DLC and conditional merge and
  redeployment while away. This covers continued qualification, not an assertion that gates passed.
- Both caller-specific isolated live criteria, final quality gate, and service-restoration checks
  passed. Unit 010 / Bolt 073 construction is complete. Final-head review and current-head CI/Bugbot
  acceptance remain required before release; no merge or deployment is claimed here.
- Operations must verify restored/running process, relevant logs, health, ports, dependencies, and
  exact image/revision after any service pause or deployment. Deployed acceptance is separate from
  the isolated replay evidence above.

Do not ask the father to keep reconnecting based on the original sequence: his reconnect succeeded.
The remaining work is candidate qualification/release and accurate reporting of reservation and
price eligibility outcomes, not a presumption that his credentials are wrong.

Evidence update recorded: 2026-09-08T22:09:53Z.

Final construction/restore evidence recorded: 2026-09-08T22:10:41Z.
