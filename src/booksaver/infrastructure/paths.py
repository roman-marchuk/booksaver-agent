from __future__ import annotations

from pathlib import Path

from booksaver.domain.errors import LocalPathViolation
from booksaver.domain.value_objects import DataDirectory


def assert_local(target_path: Path, data_directory: DataDirectory) -> None:
    resolved = Path(target_path).expanduser().resolve()
    try:
        resolved.relative_to(data_directory.path)
    except ValueError:
        raise LocalPathViolation(str(resolved), str(data_directory.path))


def ensure_data_dir(data_directory: DataDirectory) -> Path:
    path = data_directory.path
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
    return path
