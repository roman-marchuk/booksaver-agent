---
intent: 024-repository-streamlining
phase: construction
status: complete
created: "2026-09-06T21:28:53Z"
updated: "2026-09-06T21:28:53Z"
---

# Repository Streamlining

## Authorization

The user reviewed the branch-wide slop audit and explicitly requested: "go through this list and cleanup the code and delete unused old branches completely, following your reasoning." This authorizes implementing the reviewed cleanup and deleting verified obsolete branch refs. The audit supplies the requirements/design decisions below; no new reservation behavior is introduced. Commit, push of cleanup code, merge and deployment are separate from branch deletion and remain subject to explicit authorization.

## Requirements

1. Finish ADR-027/US-118 retirement of manual mutations and guided rebooking, including dead tests and public mutation surfaces.
2. Remove unused legacy monitor/global-session APIs and compatibility scaffolding. Keep the authenticated deterministic route and explicit Stagehand rollback required by ADR-043.
3. Consolidate repeated Browser Use infrastructure and pure mappings with explicit ownership; retain every safety and cost boundary.
4. Consolidate duplicate fixture data and test setup, strengthen assertions about keys, forbidden calls and deployment policy.
5. Keep specs.md as sole lifecycle authority; make existing validators and orientation docs match canonical state. Preserve historical evidence; correct metadata transparently, never fabricate historical timestamps.
6. Delete obsolete local/remote refs, including the two rejected stale Cursor branches, after checking live tasks/PRs/worktrees. Do not delete active work or user files.

## Constraints and validation

No new dependency, distributed service, autonomous reservation action, weakening of caller isolation, new database destruction, automatic adapter fallback, or alteration of live Booking.com sessions. Historical compatibility tables may remain solely to support safe opening/migration/purge of existing databases; remove unused mutation APIs without a destructive migration. Targeted tests during construction; full Python lint/types/tests, CLI smoke and AI-DLC checks at integration. Independent review verifies all audit items and retained boundaries.

## Release authorization — 2026-09-06T22:15:30Z

After reviewing the completed cleanup and checks, the user explicitly authorized merging and
redeploying if verification passes. This covers the cleanup commit/push, review PR, guarded merge,
isolated build/staging checks, production promotion, rollback if needed, and health verification.
The current-head Bugbot gate and BookSaver safety boundaries remain in force.
