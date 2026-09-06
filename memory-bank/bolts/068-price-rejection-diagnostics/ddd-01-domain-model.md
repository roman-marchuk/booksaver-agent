---
stage: model
bolt: 068-price-rejection-diagnostics
created: 2026-09-06T21:00:00Z
---

# Domain Model

Price observation contains trusted-query comparison facts and untrusted observed offers. Evidence
validation and room equivalence are separate decisions. An evidence failure can have multiple
causes. Room match is evaluated only for evidence-qualified offers after query acceptance.

The diagnostic record describes those decisions; it cannot authorize acceptance. Each offer has
an ordinal, failed predicates, room comparison state, and selection state. Room hints are closed
lexical attributes; absence means not mentioned, not disproven. The trace belongs to the existing
booking/check owner. No new repository or data authority is introduced.
