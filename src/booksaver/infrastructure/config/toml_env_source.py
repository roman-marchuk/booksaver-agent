from __future__ import annotations

import os
import tomllib
from pathlib import Path
from typing import Any

DEFAULT_CONFIG_PATH = Path.home() / ".booksaver" / "config.toml"


class TomlEnvConfigSource:
    def __init__(self, config_path: Path | None = None) -> None:
        env_path = os.environ.get("BOOKSAVER_CONFIG")
        self._path = config_path or (Path(env_path) if env_path else DEFAULT_CONFIG_PATH)

    def read(self) -> dict[str, Any]:
        if not self._path.exists():
            raise FileNotFoundError(
                f"Config file not found: {self._path}\n"
                "Run 'booksaver init' to create one."
            )
        with open(self._path, "rb") as f:
            return tomllib.load(f)
