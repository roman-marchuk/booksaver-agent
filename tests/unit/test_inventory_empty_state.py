import asyncio
import json
from types import SimpleNamespace
from typing import Any

import pytest

import booksaver.infrastructure.browser.inventory_empty_state as empty_adapter
from booksaver.infrastructure.browser.inventory_empty_state import (
    explicit_empty_upcoming,
    observe_empty_upcoming,
)

ROOT = "https://secure.booking.com/mytrips.html"
EMPTY = (
    "Bookings & Trips Find a booking Active Past Canceled Where to next? "
    "You haven’t started any trips yet. Once you make a booking, it'll appear here."
)


def test_explicit_initial_empty_trips_is_recognized():
    assert explicit_empty_upcoming(ROOT, EMPTY)


@pytest.mark.parametrize("text", [
    "Bookings & Trips Active Loading", "", "No bookings", EMPTY + " 1 booking",
    EMPTY.replace("Bookings & Trips", "Search"), EMPTY.replace("Active", ""),
    "x" * 250_001,
])
def test_missing_or_contradictory_empty_evidence_is_not_accepted(text):
    assert not explicit_empty_upcoming(ROOT, text)


@pytest.mark.parametrize("url", [
    ROOT + "?trip_id=abc", ROOT + "?tab=past", ROOT + "#past",
    "https://secure.booking.com/confirmation.en-us.html", "https://example.com/mytrips.html",
])
def test_empty_claim_outside_initial_trips_page_is_not_accepted(url):
    assert not explicit_empty_upcoming(url, EMPTY)


def test_provider_cannot_claim_code_owned_empty_result():
    from booksaver.infrastructure.browser.agentic_inventory_executor import _terminal_status

    with pytest.raises(ValueError, match="cannot submit an observation"):
        _terminal_status("empty_upcoming")


def _rendered_session(response: object) -> tuple[Any, list[dict[str, Any]]]:
    reads: list[dict[str, Any]] = []

    async def evaluate(**kwargs: Any) -> object:
        reads.append(kwargs)
        return response

    async def ensure_session() -> str:
        return "qualified-current-page"

    async def get_current_page() -> Any:
        return SimpleNamespace(_ensure_session=ensure_session)

    return SimpleNamespace(
        get_current_page=get_current_page,
        cdp_client=SimpleNamespace(send=SimpleNamespace(Runtime=SimpleNamespace(evaluate=evaluate))),
    ), reads


def test_rendered_empty_read_uses_bounded_fixed_expression_without_logging_content(
    caplog: pytest.LogCaptureFixture,
) -> None:
    private_marker = "PRIVATE-PAGE-CONTENT-MUST-NOT-BE-LOGGED"
    session, reads = _rendered_session({"result": {"value": json.dumps({
        "url": ROOT, "text": EMPTY + " " + private_marker,
    })}})

    assert asyncio.run(observe_empty_upcoming(session)) is True

    assert len(reads) == 1
    assert reads[0]["session_id"] == "qualified-current-page"
    params = reads[0]["params"]
    assert params["returnByValue"] is True
    assert params["expression"] == (
        "JSON.stringify({url: location.href, "
        "text: (document.body?.innerText || '').slice(0, 250001)})"
    )
    assert private_marker not in caplog.text
    assert EMPTY not in caplog.text
    assert ROOT not in caplog.text


@pytest.mark.parametrize("response", [
    None,
    [],
    {},
    {"result": None},
    {"result": {"value": "PRIVATE-MALFORMED-JSON"}},
    {"result": {"value": "[]"}},
    {"result": {"value": json.dumps({"url": ROOT, "text": None})}},
    {"result": {"value": json.dumps({"url": ROOT + "?tab=past", "text": EMPTY})}},
    {"result": {"value": json.dumps({"url": ROOT, "text": EMPTY + " 2 bookings"})}},
    {"result": {"value": json.dumps({"url": ROOT, "text": EMPTY + "x" * 250_001})}},
])
def test_unusable_rendered_result_fails_closed_without_exposing_content(
    response: object, caplog: pytest.LogCaptureFixture,
) -> None:
    session, _reads = _rendered_session(response)

    assert asyncio.run(observe_empty_upcoming(session)) is False

    assert "PRIVATE" not in caplog.text
    assert EMPTY not in caplog.text
    assert ROOT not in caplog.text


def test_rendered_read_timeout_fails_closed_without_logging_exception(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture,
) -> None:
    session, _reads = _rendered_session({})

    async def timeout(awaitable: Any, *, timeout: float) -> Any:
        assert timeout == 5
        awaitable.close()
        raise TimeoutError("PRIVATE-PROVIDER-ERROR")

    monkeypatch.setattr(empty_adapter.asyncio, "wait_for", timeout)

    assert asyncio.run(observe_empty_upcoming(session)) is False
    assert "PRIVATE" not in caplog.text


@pytest.mark.parametrize("missing", [True, False])
def test_missing_or_unavailable_current_page_fails_closed(
    missing: bool, caplog: pytest.LogCaptureFixture,
) -> None:
    async def get_current_page() -> None:
        if missing:
            return None
        raise RuntimeError("PRIVATE-PAGE-ERROR")

    assert asyncio.run(observe_empty_upcoming(SimpleNamespace(
        get_current_page=get_current_page,
    ))) is False
    assert "PRIVATE" not in caplog.text


def test_copyright_and_zero_booking_label_do_not_contradict_empty_account():
    assert explicit_empty_upcoming(
        ROOT, EMPTY + " 0 bookings Copyright © 1996–2026 Booking.com™. All rights reserved."
    )
