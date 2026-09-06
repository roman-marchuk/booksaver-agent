from __future__ import annotations

from datetime import UTC, datetime

import pytest

from booksaver.domain.browser_resilience import (
    CodeVerificationReceipt,
    DiagnosisProvenance,
    DomStepId,
    EvidenceCategory,
    OperatorAction,
    PageState,
    PopupAdoptionReceipt,
    PopupAdoptionResult,
    PopupRefusalReason,
    TerminalBrowserDiagnosis,
    TerminalBrowserReason,
    provenance_for_terminal,
)
from booksaver.domain.check_result import (
    CheckResult,
    FailureCode,
    FailureReason,
    failure_code_for_terminal,
)
from booksaver.domain.model_policy import ModelStopReason

NOW = datetime(2026, 8, 13, tzinfo=UTC)


def test_code_verification_receipt_records_fresh_code_owned_proof() -> None:
    receipt = CodeVerificationReceipt(
        step_id=DomStepId.PRICE_CONTEXT_VERIFY,
        verified_state=PageState.PROPERTY,
        observation_id="observation-1",
        verified_at=NOW,
        verifier="trusted-context-verifier",
    )
    assert receipt.step_id is DomStepId.PRICE_CONTEXT_VERIFY
    assert receipt.verified_state is PageState.PROPERTY
    assert receipt.observation_id == "observation-1"
    assert receipt.verifier == "trusted-context-verifier"


def test_terminal_diagnosis_is_content_free_and_preserves_model_stop() -> None:
    diagnosis = TerminalBrowserDiagnosis(
        reason=TerminalBrowserReason.PROVIDER_RATE_LIMIT,
        step_id=DomStepId.PRICE_OFFER_EXTRACTION,
        provenance=DiagnosisProvenance.PROVIDER_STOP,
        confidence=1.0,
        evidence=frozenset(),
        operator_action=OperatorAction.RETRY_LATER,
        model_stop_reason=ModelStopReason.PROVIDER_RATE_LIMIT,
    )

    assert diagnosis.model_stop_reason is ModelStopReason.PROVIDER_RATE_LIMIT
    assert not hasattr(diagnosis, "detail")
    assert not hasattr(diagnosis, "url")
    assert not hasattr(diagnosis, "exception")

    check_result = CheckResult.failure(
        booking_id="booking-1",
        checked_at=NOW,
        reason=FailureReason(FailureCode.LLM_ERROR, "provider rate limited"),
        terminal_diagnosis=diagnosis,
    )
    assert check_result.terminal_diagnosis is diagnosis


@pytest.mark.parametrize(
    ("reason", "expected"),
    [
        (
            TerminalBrowserReason.PROVIDER_RATE_LIMIT,
            DiagnosisProvenance.PROVIDER_STOP,
        ),
        (TerminalBrowserReason.JOB_COST_LIMIT, DiagnosisProvenance.BUDGET_STOP),
        (
            TerminalBrowserReason.AUTHENTICATION_REQUIRED,
            DiagnosisProvenance.DETERMINISTIC,
        ),
        (
            TerminalBrowserReason.UNRESOLVED_AMBIGUITY,
            DiagnosisProvenance.POLICY_STOP,
        ),
    ],
)
def test_terminal_provenance_uses_shared_taxonomy(
    reason: TerminalBrowserReason, expected: DiagnosisProvenance
) -> None:
    assert provenance_for_terminal(reason) is expected


@pytest.mark.parametrize(
    ("terminal", "failure"),
    [
        (TerminalBrowserReason.PROVIDER_RATE_LIMIT, FailureCode.PROVIDER_RATE_LIMIT),
        (TerminalBrowserReason.DAILY_COST_LIMIT, FailureCode.DAILY_COST_LIMIT),
        (TerminalBrowserReason.TIME_LIMIT, FailureCode.TIME_LIMIT),
        (TerminalBrowserReason.UNRESOLVED_AMBIGUITY, FailureCode.DOM_AMBIGUITY),
        (
            TerminalBrowserReason.CODE_MAINTENANCE_REQUIRED,
            FailureCode.DOM_MAINTENANCE_REQUIRED,
        ),
    ],
)
def test_terminal_reason_maps_to_specific_failure_code(
    terminal: TerminalBrowserReason, failure: FailureCode
) -> None:
    assert failure_code_for_terminal(terminal) is failure


def test_maintenance_diagnosis_requires_model_provenance_and_guidance() -> None:
    with pytest.raises(ValueError, match="only a model diagnosis"):
        TerminalBrowserDiagnosis(
            reason=TerminalBrowserReason.CODE_MAINTENANCE_REQUIRED,
            step_id=DomStepId.INVENTORY_EXTRACTION,
            provenance=DiagnosisProvenance.DETERMINISTIC,
            confidence=1.0,
            evidence=frozenset(),
            operator_action=OperatorAction.MAINTAIN_CODE,
            code_maintenance_required=True,
        )

    diagnosis = TerminalBrowserDiagnosis(
        reason=TerminalBrowserReason.CODE_MAINTENANCE_REQUIRED,
        step_id=DomStepId.INVENTORY_EXTRACTION,
        provenance=DiagnosisProvenance.OPUS_DIAGNOSED,
        confidence=0.88,
        evidence=frozenset({EvidenceCategory.UNSUPPORTED_PAGE_STRUCTURE}),
        operator_action=OperatorAction.MAINTAIN_CODE,
        code_maintenance_required=True,
    )
    assert diagnosis.code_maintenance_required


def test_popup_adoption_result_is_exactly_receipt_or_refusal() -> None:
    receipt = PopupAdoptionReceipt(
        step_id=DomStepId.PRICE_PROPERTY_OPEN,
        observation_id="popup-observation-1",
        page_id="popup-page-1",
        adopted_at=NOW,
    )
    adopted = PopupAdoptionResult(receipt=receipt)
    refused = PopupAdoptionResult(refusal_reason=PopupRefusalReason.MULTIPLE_OPENED)

    assert adopted.is_adopted
    assert not refused.is_adopted

    with pytest.raises(ValueError, match="exactly one"):
        PopupAdoptionResult()
    with pytest.raises(ValueError, match="exactly one"):
        PopupAdoptionResult(
            receipt=receipt,
            refusal_reason=PopupRefusalReason.PROTECTED_DESTINATION,
        )
