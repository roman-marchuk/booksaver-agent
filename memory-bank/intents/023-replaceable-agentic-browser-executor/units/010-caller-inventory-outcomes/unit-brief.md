---
unit: 010-caller-inventory-outcomes
intent: 023-replaceable-agentic-browser-executor
status: complete
default_bolt_type: ddd-construction-bolt
created: 2026-09-08T21:59:19Z
---

# Caller Inventory Outcomes

## Assigned requirements and scope

FR-25 / US-184: Distinguish a code-observed empty upcoming page from a failed browser run, and
retain valid current-run positive reservations when the agent cannot finish the whole account.
FR-26 / US-185: Explain login, loading, saved reservations, empty results, and next actions plainly.
FR-27 / US-186: Qualify owner and invited-user outcomes with caller-scoped isolated replay.

## Evidence and context

The reported invited-user flow saved the Booking.com login, then failed during reservation
loading. Production investigation found different account states: one invited account displayed
an explicit authenticated empty upcoming page; another had current reservation identifiers/stay
facts that differed from saved records; the owner's simpler saved match worked. These differences
identify input-dependent paths, not an owner/invite authorization defect. They do not establish
that the father's entire inventory or price-check flow is repaired.

Authentication, account inventory, and price checks remain separate. The shared coordinator owns
one browser lease; existing current disclosure, caller ownership, browser guards, deadline, action
limit, and model cost bounds apply. No new provider, routing mode, dependency, or database migration.

## Safety and acceptance

- Only code-owned authenticated page evidence can report empty upcoming inventory; provider output
  cannot assert this status. It remains incomplete and cannot delete or deactivate saved rows.
- Accepted positive records survive a non-successful agent finish only through existing validation;
  unsafe, unauthenticated, expired, or over-budget execution retains its failure precedence.
- Conflicting saved and observed booking facts remain subject to existing identity validation.
- Telegram distinguishes an observed empty page, partial update, unavailable refresh, and expired
  login without publishing internal reason codes, provider prose, or diagnostic details.
- Replay preserves caller identity, consent, routing, and session ownership; notifications and
  authoritative production writes are disabled and daemon/browser work cannot overlap.

## Authorization and plan

The user authorized implementing the diagnosed straightforward correction through specs.md AI-DLC,
and conditionally merging and redeploying once sufficiently verified while the user is away.
This standing instruction covers the narrow inception and construction checkpoints. Release still
requires the repository's final-head review gates and operations verification. Material scope or
security changes remain outside that approval. No live acceptance or deployment is claimed here.

Bolt 073 follows domain model, technical design, ADR analysis, implementation, and testing.
Existing ADR-021, ADR-027, ADR-028, ADR-039, ADR-044, and ADR-045 continue to govern the work.
An initial diagnosis and reversible message prototype predate this amendment; their chronology is
not rewritten as prior completion of AI-DLC stages.

## Story Summary

- Total stories: 3; all Must.
- US-184: Recognize safe empty and partial inventory outcomes — Complete.
- US-185: Explain caller login and reservation status plainly — Complete.
- US-186: Qualify caller outcomes with isolated replay — Complete; isolated live criteria passed.

## 2026-09-08T22:09:01Z - Current verification boundary

The father's caller-scoped isolated replay now accepts two current reservations through the normal
coordinator (incomplete traversal, no failure; zero price-eligible records). This proves candidate
inventory acceptance for that caller, not production deployment, Telegram delivery, or a price
check. The second caller's authenticated empty page exposed a footer/count false positive; the
corrected live replay now passes as empty_upcoming, incomplete/no failure, zero positives, 29390 ms,
and zero model cost. Both isolated live caller criteria pass. Final quality gate (1839 tests, Ruff, mypy117) and restored
service-health checks also pass. Unit and stories are complete for construction; final-head release
review, merge, deployment, and deployed acceptance remain separate.
