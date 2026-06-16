from __future__ import annotations


class BookSaverError(Exception):
    pass


class ConfigValidationError(BookSaverError):
    def __init__(self, errors: list[str]) -> None:
        self.errors = errors
        super().__init__("\n".join(errors))


class BookingRejectedError(BookSaverError):
    def __init__(self, reason: str) -> None:
        self.reason = reason
        super().__init__(reason)


class LocalPathViolation(BookSaverError):
    def __init__(self, path: str, data_dir: str) -> None:
        self.path = path
        self.data_dir = data_dir
        super().__init__(f"Path '{path}' is not under data directory '{data_dir}'")
