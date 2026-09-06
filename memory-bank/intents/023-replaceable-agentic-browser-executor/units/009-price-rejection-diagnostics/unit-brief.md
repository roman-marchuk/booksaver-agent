---
unit: 009-price-rejection-diagnostics
intent: 023-replaceable-agentic-browser-executor
status: complete
created: 2026-09-06T21:00:00.000Z
---

# Price Rejection Diagnostics

US-174: expose code-owned reasons for rejected price observations without changing acceptance.
The user authorized AI-DLC, merge, and VPS deployment for diagnostics before semantic matching.

## Requirements and context

Browser Use observations -> existing query/offer validation -> room matching -> selection ->
owner-scoped check trace and concise Telegram failure. Record success as well as failure so runs
can be compared. Preserve query validation, room rules, cheapest-offer selection, safety, and cost.

Evidence includes terminal status, query rejection, counts, per-offer failed predicates, room
comparison outcome, normalized-equality/suffix flags, and allowlisted room words. Do not persist
arbitrary room labels, page text, cookies, screenshots, URLs, provider prose, or model reasoning.
Attributes are lexical diagnostic hints, not new semantic facts or acceptance authority.
Cap diagnostic offers and disclose truncation; do not cap validation itself.

## Plan

One story US-174, Bolt 068. Domain model -> technical design -> implementation -> tests.
Existing ADR-036 validation and ADR-043 executor authority remain. No new provider/schema/model.
Test all evidence rejection predicates, multiple simultaneous failures, success/mismatch traces,
bounded output and hostile label privacy. Operations tests the installed image and live replay.
