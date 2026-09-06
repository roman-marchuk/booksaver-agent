---
stage: model
bolt: 070-shared-browser-and-tests
created: 2026-09-06T21:28:53Z
---

# Domain Model

## Entities and aggregates

Booking remains an account-derived projection, never a manually edited source of truth. User/session, reservation inventory, check evidence, savings, and spending ledgers retain current invariants. No guided-rebook aggregate or manual registration event remains part of active product behavior.

## Services and repositories

One coordinator admits owner-bound work. Separate price and inventory ports yield untrusted evidence; guards and verification remain code-owned. Existing database migration/purge obligations survive API retirement. Tests hold substitutes for these contracts; they do not justify obsolete production services.

## Lifecycle and language

An active branch has current work or an open task/PR requiring its ref; an obsolete branch is integrated or an explicitly rejected abandoned alternative with no active work. Historical lifecycle completion records describe past delivery; retirement is a later accepted change, not deletion of that history.
