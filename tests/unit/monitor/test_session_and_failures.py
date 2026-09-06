from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from booksaver.domain.check_result import CheckResult, FailureCode, FailureReason
from booksaver.domain.session import SessionState
from booksaver.domain.value_objects import Platform
from booksaver.monitor.failure_tracker import FailureTracker

from .fakes import FakeCheckHistoryRepository

# ── SessionState ──────────────────────────────────────────────────────────────

def test_session_without_expiry_never_expires() -> None:
    session = SessionState.new(
        platform=Platform.BOOKING_COM,
        cookies=b"[]",
        authenticated_at=datetime.now(UTC),
    )
    assert session.is_expired() is False


def test_session_with_future_expiry_not_expired() -> None:
    session = SessionState.new(
        platform=Platform.BOOKING_COM,
        cookies=b"[]",
        authenticated_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    assert session.is_expired() is False


# ── FailureTracker ────────────────────────────────────────────────────────────

def _failure(booking_id: str) -> CheckResult:
    return CheckResult.failure(
        booking_id,
        datetime.now(UTC),
        FailureReason(code=FailureCode.NAVIGATION_ERROR, detail="test"),
    )


def test_warning_emitted_at_threshold() -> None:
    history = FakeCheckHistoryRepository()
    tracker = FailureTracker(history, threshold=3)

    for i in range(3):
        history.add(_failure("b-1"))
        warned = tracker.after_check("b-1", succeeded=False)

    assert warned is True  # third consecutive failure hits the threshold


def test_no_warning_below_threshold() -> None:
    history = FakeCheckHistoryRepository()
    tracker = FailureTracker(history, threshold=3)

    history.add(_failure("b-1"))
    assert tracker.after_check("b-1", succeeded=False) is False
    history.add(_failure("b-1"))
    assert tracker.after_check("b-1", succeeded=False) is False


def test_warning_emitted_only_once_per_streak() -> None:
    history = FakeCheckHistoryRepository()
    tracker = FailureTracker(history, threshold=2)

    history.add(_failure("b-1"))
    tracker.after_check("b-1", succeeded=False)
    history.add(_failure("b-1"))
    assert tracker.after_check("b-1", succeeded=False) is True   # threshold hit
    history.add(_failure("b-1"))
    assert tracker.after_check("b-1", succeeded=False) is False  # already warned


def test_success_resets_warning_state() -> None:
    history = FakeCheckHistoryRepository()
    tracker = FailureTracker(history, threshold=2)

    history.add(_failure("b-1"))
    tracker.after_check("b-1", succeeded=False)
    history.add(_failure("b-1"))
    assert tracker.after_check("b-1", succeeded=False) is True

    tracker.after_check("b-1", succeeded=True)  # success resets the streak

    history.add(_failure("b-1"))
    history.add(_failure("b-1"))
    # count_consecutive_failures only sees trailing failures, but the fake's
    # history still has the old ones; what matters is the tracker warns again
    assert tracker.after_check("b-1", succeeded=False) is True


def test_invalid_threshold_rejected() -> None:
    with pytest.raises(ValueError, match="threshold must be >= 1"):
        FailureTracker(FakeCheckHistoryRepository(), threshold=0)
