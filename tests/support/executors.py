"""Small deterministic executor fakes for application and coordinator tests."""

from __future__ import annotations

from collections.abc import Iterable

from booksaver.domain.browser_executor import (
    PriceExecutionRequest,
    PriceExecutionResult,
)
from booksaver.domain.inventory_executor import (
    InventoryExecutionRequest,
    InventoryExecutionResult,
)


class FakePriceBrowserExecutor:
    def __init__(self, results: Iterable[PriceExecutionResult]) -> None:
        self._results = list(results)
        self.requests: list[PriceExecutionRequest] = []

    def execute(self, request: PriceExecutionRequest) -> PriceExecutionResult:
        self.requests.append(request)
        if not self._results:
            raise RuntimeError("fake executor has no queued result")
        return self._results.pop(0)


class FakeInventoryBrowserExecutor:
    def __init__(self, results: Iterable[InventoryExecutionResult]) -> None:
        self._results = list(results)
        self.requests: list[InventoryExecutionRequest] = []

    def execute(self, request: InventoryExecutionRequest) -> InventoryExecutionResult:
        self.requests.append(request)
        if not self._results:
            raise RuntimeError("fake inventory executor has no queued result")
        return self._results.pop(0)
