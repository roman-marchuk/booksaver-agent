"""US-020/021/022: BookingComSearchMonitor with the agent, traces, and snapshots."""

from __future__ import annotations

from datetime import UTC, datetime

from booksaver.domain.agent import (
    AgentAction,
    AgentActionType,
    AgentSettings,
    CheckTrace,
    ElementInfo,
    TraceKind,
)
from booksaver.domain.check_result import CheckOutcome, ExtractionMethod, FailureCode
from booksaver.domain.models import Booking
from booksaver.domain.user_session import UserSessionMetadata, UserSessionSnapshot
from booksaver.domain.value_objects import Platform
from booksaver.monitor.failure_tracker import FailureTracker
from booksaver.monitor.search_check_job import BookingComSearchMonitor
from booksaver.monitor.trace import SnapshotWriter

from .fakes import (
    FakeAgentBrain,
    FakeCheckHistoryRepository,
    FakeInteractiveBrowser,
    make_booking,
)

_PROPERTY_URL = (
    "https://www.booking.com/hotel/test.html"
    "?checkin=2026-09-01&checkout=2026-09-05&group_adults=2"
)

_ROOM_TABLE = "Standard Double\n€ 350.00\nFree cancellation"


class FakeCheckTraceRepository:
    def __init__(self) -> None:
        self.traces: list[CheckTrace] = []

    def add(self, trace: CheckTrace) -> None:
        self.traces.append(trace)

    def get(self, check_id: str) -> CheckTrace | None:
        return next((t for t in self.traces if t.check_id == check_id), None)


def _happy_browser() -> FakeInteractiveBrowser:
    browser = FakeInteractiveBrowser(titles=["Hotel Test"], page_text=_ROOM_TABLE)
    browser.property_url = _PROPERTY_URL
    browser.elements = (ElementInfo(ref="e0", role="button", label="Close popup"),)
    return browser


def _monitor(
    browser: FakeInteractiveBrowser,
    brain: FakeAgentBrain | None = None,
    trace_repo: FakeCheckTraceRepository | None = None,
    snapshot_writer: SnapshotWriter | None = None,
    settings: AgentSettings | None = None,
) -> BookingComSearchMonitor:
    history = FakeCheckHistoryRepository()
    return BookingComSearchMonitor(
        browser=browser,
        check_history=history,
        failure_tracker=FailureTracker(history),
        llm=None,
        brain=brain,
        agent_settings=settings,
        trace_repo=trace_repo,
        snapshot_writer=snapshot_writer,
    )


def _run_authenticated(monitor: BookingComSearchMonitor, booking: Booking):
    snapshot = UserSessionSnapshot(
        metadata=UserSessionMetadata.imported(
            owner_user_id=7,
            platform=Platform.BOOKING_COM,
            imported_at=datetime.now(UTC),
            expires_at=None,
        ),
        cookies=b'[{"name":"session"}]',
    )
    return monitor.run_authenticated(booking, snapshot)


class TestAgentAssistedMarker:
    def test_agent_assisted_success_marked_agent(self):
        browser = _happy_browser()
        browser.fail_selectors = {"property-card"}

        def _fix(b: FakeInteractiveBrowser, action: AgentAction) -> None:
            b.fail_selectors.clear()
            b.present_selectors.add('[data-testid="property-card"]')

        browser.on_act = _fix
        brain = FakeAgentBrain([AgentAction(type=AgentActionType.CLICK, ref="e0")])
        monitor = _monitor(browser, brain=brain)
        result = _run_authenticated(monitor, make_booking())
        assert result.outcome is CheckOutcome.SUCCESS
        assert result.extraction_method is ExtractionMethod.AGENT

    def test_scripted_only_success_keeps_dom_method(self):
        monitor = _monitor(_happy_browser(), brain=FakeAgentBrain([]))
        result = _run_authenticated(monitor, make_booking())
        assert result.extraction_method is ExtractionMethod.DOM

    def test_without_brain_step_failures_stay_scripted_codes(self):
        browser = _happy_browser()
        browser.fail_selectors = {"property-card"}
        monitor = _monitor(browser, brain=None)
        result = _run_authenticated(monitor, make_booking())
        assert result.failure_reason.code is FailureCode.DOM_AMBIGUITY


class TestTracePersistence:
    def test_every_check_persists_a_trace(self):
        trace_repo = FakeCheckTraceRepository()
        monitor = _monitor(_happy_browser(), trace_repo=trace_repo)
        result = _run_authenticated(monitor, make_booking())
        [trace] = trace_repo.traces
        assert trace.check_id == result.check_id
        kinds = [e.kind for e in trace.events]
        assert kinds.count(TraceKind.JOURNEY_STEP) == 5  # all active steps recorded
        assert kinds[-1] is TraceKind.CHECK_RESULT

    def test_escalation_events_appear_in_trace(self):
        browser = _happy_browser()
        browser.fail_selectors = {"property-card"}

        def _fix(b: FakeInteractiveBrowser, action: AgentAction) -> None:
            b.fail_selectors.clear()
            b.present_selectors.add('[data-testid="property-card"]')

        browser.on_act = _fix
        trace_repo = FakeCheckTraceRepository()
        monitor = _monitor(
            browser,
            brain=FakeAgentBrain([AgentAction(type=AgentActionType.CLICK, ref="e0")]),
            trace_repo=trace_repo,
        )
        _run_authenticated(monitor, make_booking())
        kinds = {e.kind for e in trace_repo.traces[0].events}
        assert TraceKind.ESCALATION_STARTED in kinds
        assert TraceKind.AGENT_ACTION in kinds
        assert TraceKind.AGENT_RESULT in kinds

    def test_occupancy_missing_check_still_traced(self):
        trace_repo = FakeCheckTraceRepository()
        monitor = _monitor(_happy_browser(), trace_repo=trace_repo)
        _run_authenticated(monitor, make_booking(occupancy=None))
        [trace] = trace_repo.traces
        assert "occupancy_missing" in trace.events[-1].detail


class TestFailureSnapshots:
    def test_failed_check_writes_snapshot(self, tmp_path):
        browser = _happy_browser()
        browser.titles = ["Wrong Hotel"]  # ambiguous changed result structure
        writer = SnapshotWriter(tmp_path / "snapshots")
        monitor = _monitor(browser, snapshot_writer=writer)
        result = _run_authenticated(monitor, make_booking())
        assert result.outcome is CheckOutcome.FAILURE
        assert (tmp_path / "snapshots" / f"{result.check_id}.txt").exists()

    def test_successful_check_writes_no_snapshot(self, tmp_path):
        writer = SnapshotWriter(tmp_path / "snapshots")
        monitor = _monitor(_happy_browser(), snapshot_writer=writer)
        result = _run_authenticated(monitor, make_booking())
        assert result.outcome is CheckOutcome.SUCCESS
        assert not (tmp_path / "snapshots").exists()
