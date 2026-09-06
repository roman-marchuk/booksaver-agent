from dataclasses import replace
from decimal import Decimal

import pytest

from booksaver.domain.browser_executor import (
    AllInEvidence,
    EvidenceCompleteness,
    ObservedOffer,
    RefundabilityEvidence,
    observed_offer_rejection_reasons,
)
from booksaver.domain.value_objects import Money


def _complete_offer() -> ObservedOffer:
    return ObservedOffer(
        room_label="Standard King Room",
        total=Money(Decimal("301.00"), "USD"),
        all_in=AllInEvidence.EXPLICIT,
        refundability=RefundabilityEvidence.EXPLICIT_REFUNDABLE,
        refundability_text="Free cancellation until 23 November",
        completeness=EvidenceCompleteness.COMPLETE,
    )


def test_complete_offer_has_no_rejection_reasons() -> None:
    assert observed_offer_rejection_reasons(_complete_offer(), "USD") == ()


@pytest.mark.parametrize(
    ("offer", "expected"),
    [
        (
            replace(_complete_offer(), completeness=EvidenceCompleteness.INCOMPLETE),
            "incomplete_evidence",
        ),
        (
            replace(_complete_offer(), completeness=EvidenceCompleteness.CONFLICTING),
            "incomplete_evidence",
        ),
        (replace(_complete_offer(), all_in=AllInEvidence.UNKNOWN), "all_in_not_explicit"),
        (replace(_complete_offer(), all_in=AllInEvidence.CONFLICTING), "all_in_not_explicit"),
        (
            replace(_complete_offer(), refundability=RefundabilityEvidence.EXPLICIT_NONREFUNDABLE),
            "refundability_not_explicit",
        ),
        (
            replace(_complete_offer(), refundability=RefundabilityEvidence.UNKNOWN),
            "refundability_not_explicit",
        ),
        (
            replace(_complete_offer(), refundability=RefundabilityEvidence.CONFLICTING),
            "refundability_not_explicit",
        ),
        (replace(_complete_offer(), refundability_text=None), "refundability_text_missing"),
        (
            replace(_complete_offer(), total=Money(Decimal("301.00"), "EUR")),
            "currency_mismatch",
        ),
    ],
)
def test_each_failed_evidence_gate_is_identified(offer: ObservedOffer, expected: str) -> None:
    assert observed_offer_rejection_reasons(offer, "USD") == (expected,)


def test_simultaneous_failures_return_all_codes_without_observed_content() -> None:
    offer = replace(
        _complete_offer(),
        room_label="Sensitive visible room content",
        total=Money(Decimal("123.45"), "EUR"),
        completeness=EvidenceCompleteness.CONFLICTING,
        all_in=AllInEvidence.UNKNOWN,
        refundability=RefundabilityEvidence.EXPLICIT_NONREFUNDABLE,
        refundability_text=None,
    )
    assert observed_offer_rejection_reasons(offer, "USD") == (
        "incomplete_evidence",
        "all_in_not_explicit",
        "refundability_not_explicit",
        "refundability_text_missing",
        "currency_mismatch",
    )
