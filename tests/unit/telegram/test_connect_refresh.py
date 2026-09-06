from unittest.mock import Mock

import pytest

from booksaver.daemon.check_coordinator import ImmediateAdmission, InventoryCompletion
from booksaver.domain.account_sync import (
    InventoryCompleteness,
    SynchronizationFailureCode,
    SynchronizationReport,
    SynchronizationTrigger,
)
from booksaver.infrastructure.telegram.connect_refresh import start_post_connect_refresh


def report(completeness, *, count=1, failure=None):
    return SynchronizationReport(
        run_id="test-refresh",
        completeness=completeness,
        discovered=count,
        eligible=count,
        ineligible=0,
        failure_code=failure,
        failure_detail="INTERNAL DETAIL MUST NOT BE SHOWN",
    )


@pytest.mark.parametrize(
    "completeness", [InventoryCompleteness.COMPLETE, InventoryCompleteness.INCOMPLETE]
)
def test_fast_completion_is_after_progress_and_reports_success(completeness):
    coordinator = Mock()
    messages = []

    def immediate(user_id, callback, *, trigger):
        assert user_id == 42
        assert trigger is SynchronizationTrigger.CONNECT
        assert len(messages) == 1
        callback(InventoryCompletion(report(completeness)))
        return ImmediateAdmission.ACCEPTED

    coordinator.request_inventory.side_effect = immediate
    start_post_connect_refresh(42, coordinator, lambda user, text: messages.append((user, text)))
    assert len(messages) == 2
    assert "wait for the result" in messages[0][1]
    assert "1 found, 1 eligible" in messages[1][1]
    assert "Send /checknow" in messages[1][1]
    assert "retry" not in messages[1][1]
    assert "INTERNAL DETAIL" not in messages[1][1]
    assert ("Other saved reservations were kept" in messages[1][1]) is (
        completeness is InventoryCompleteness.INCOMPLETE
    )


@pytest.mark.parametrize(
    "result",
    [
        None,
        report(InventoryCompleteness.INCOMPLETE, count=0),
        report(
            InventoryCompleteness.INCOMPLETE,
            failure=SynchronizationFailureCode.EXTRACTION_AMBIGUOUS,
        ),
        report(
            InventoryCompleteness.FAILED, count=0, failure=SynchronizationFailureCode.AUTH_REQUIRED
        ),
    ],
)
def test_incomplete_or_failed_refresh_is_not_mislabeled_success(result):
    coordinator = Mock()
    coordinator.request_inventory.return_value = ImmediateAdmission.ACCEPTED
    messages = []
    start_post_connect_refresh(42, coordinator, lambda _, text: messages.append(text))
    callback = coordinator.request_inventory.call_args.args[1]
    callback(InventoryCompletion(result))
    assert "could not be completed" in messages[-1]
    assert "Send /bookings to retry" in messages[-1]
    assert "INTERNAL DETAIL" not in messages[-1]
    assert "Send /checknow" not in messages[-1]


@pytest.mark.parametrize(
    "admission, expected",
    [
        (ImmediateAdmission.BUSY, "not started or queued"),
        (ImmediateAdmission.STOPPING, "shutting down"),
    ],
)
def test_declined_refresh_describes_actual_admission(admission, expected):
    coordinator = Mock()
    coordinator.request_inventory.return_value = admission
    messages = []
    start_post_connect_refresh(42, coordinator, lambda _, text: messages.append(text))
    assert len(messages) == 2
    assert expected in messages[-1]
    coordinator.request_inventory.assert_called_once()
