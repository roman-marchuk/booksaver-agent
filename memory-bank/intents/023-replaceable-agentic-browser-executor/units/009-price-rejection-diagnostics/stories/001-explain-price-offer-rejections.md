---
id: 001-explain-price-offer-rejections
unit: 009-price-rejection-diagnostics
intent: 023-replaceable-agentic-browser-executor
status: complete
priority: must
created: 2026-09-06T21:00:00.000Z
assigned_bolt: 068-price-rejection-diagnostics
implemented: true
---

# US-174: Explain price offer rejections

As an operator I want an inspectable record of which evidence and matching rules rejected each
offer so I can diagnose false rejection before changing equivalence policy.

- Query rejection and executor terminal status remain distinguishable.
- Every failed offer-evidence predicate is recorded, not just the first.
- Room rejection/selection includes bounded, allowlisted comparison hints; no arbitrary labels.
- Successful and failed runs use the same versioned diagnostic structure.
- Telegram summarizes observed rejection accurately, without claiming no equivalent offer exists.
- No acceptance changes, new model calls, secrets, raw page data, or unbounded diagnostic output.
