from __future__ import annotations

import shlex
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _directives(filename: str) -> list[list[str]]:
    """Inspect active directives, excluding comments and joining continuation lines."""
    text = (ROOT / filename).read_text().replace("\\\n", " ")
    return [tokens for line in text.splitlines() if (tokens := shlex.split(line, comments=True))]


def test_image_contains_transient_remote_browser_dependencies() -> None:
    instructions = _directives("Dockerfile")
    dockerfile = "\n".join(" ".join(tokens) for tokens in instructions)
    assert [tokens for tokens in instructions if tokens[0] == "USER"][-1] == ["USER", "booksaver"]
    assert "CI=1" not in dockerfile
    for package in ("novnc", "websockify", "x11vnc", "xvfb"):
        assert package in dockerfile
    for module in ("rfb.js", "keyboard.js", "keysym.js", "keysymdef.js"):
        assert f"test -f /usr/share/novnc/core/{module}" in dockerfile or (
            f"test -f /usr/share/novnc/core/input/{module}" in dockerfile
        )


def test_image_reowns_browser_use_process_directories_after_root_import() -> None:
    instructions = _directives("Dockerfile")
    dockerfile = "\n".join(" ".join(tokens) for tokens in instructions)
    root_import = dockerfile.index("from browser_use import ActionResult")
    remove_build_state = dockerfile.index("rm -rf $BROWSER_USE_CONFIG_DIR $XDG_CACHE_HOME")
    unprivileged_runtime = dockerfile.index("USER booksaver")

    assert root_import < remove_build_state < unprivileged_runtime
    assert "install -d -o booksaver -g booksaver -m 0700" in dockerfile


def test_caddy_routes_websocket_without_access_log_configuration() -> None:
    directives = _directives("Caddyfile")
    assert directives[0] == ["{$BOOKSAVER_AUTH_DOMAIN}", "{"]
    assert ["@websockify", "path", "/websockify"] in directives
    assert {tuple(tokens[1:]) for tokens in directives if tokens[0] == "reverse_proxy"} == {
        ("booksaver:6080",),
        ("booksaver:8080",),
    }
    assert not any(tokens[0] == "log" for tokens in directives)
