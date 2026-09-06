from typing import Any

from booksaver.domain.mobile_web import MobileWebSettings
from booksaver.infrastructure.browser.playwright_adapter import new_mobile_context

PIXEL_7 = {
    "user_agent": "Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/149 Mobile Safari/537.36",
    "viewport": {"width": 412, "height": 839},
    "device_scale_factor": 2.625,
    "is_mobile": True,
    "has_touch": True,
    "default_browser_type": "chromium",
}


class FakeBrowser:
    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    def new_context(self, **options: Any) -> object:
        self.calls.append(options)
        return object()


def test_each_mobile_context_is_fresh_and_uses_complete_profile() -> None:
    browser = FakeBrowser()
    settings = MobileWebSettings.from_values(
        "android-chromium", "en-US", "America/Indiana/Indianapolis"
    )

    first = new_mobile_context(browser, settings, PIXEL_7)
    second = new_mobile_context(browser, settings, PIXEL_7)

    assert first is not second
    assert len(browser.calls) == 2
    assert browser.calls[0] == browser.calls[1]
    assert browser.calls[0]["is_mobile"] is True
    assert browser.calls[0]["has_touch"] is True
    assert browser.calls[0]["timezone_id"] == "America/Indiana/Indianapolis"
    assert "storage_state" not in browser.calls[0]
