---
stage: design
bolt: 068-price-rejection-diagnostics
created: 2026-09-06T21:02:00Z
---

# Technical Design

Extract the existing five offer predicates into a pure reason-list function used both by validation
and diagnostics, preserving acceptance exactly. Query validation keeps its existing first-failure
decision. Add a versioned structured price_validation trace event through TraceRecorder.

The monitor records executor status, validation rejection, candidate totals, failed evidence
predicates per observed offer, room comparison results and selection exclusions. Match decisions
are recorded from the actual policy invocation, never a second semantic evaluation.

Use a closed room-vocabulary projection (category, beds, accessibility, view/facility terms) and
safe equality/normalization flags. No labels, arbitrary tokens, hashes of private text, amounts,
dates, property names, URLs, refundability prose, sessions, or model reasoning. Vocabulary words
are hints; they are not interpreted semantic attributes and are never used to accept offers.
Bound per-offer records to 20 and include omitted count, leaving actual validation unbounded.

User failure summaries distinguish missing complete price/refundability evidence from room
mismatch and state that this check could not verify a match. Existing trace CLI remains the
operator inspection mechanism; no new Telegram admin exposure or provider calls.

ADR analysis: existing executor evidence, trace privacy, and validation policies suffice; no new
architecture. Test privacy with malicious room/refundability text and provider detail sentinels.
