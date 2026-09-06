"""Pure normalization for scalar values returned by Browser Use providers."""

from __future__ import annotations


def normalize_provider_scalar(value: object) -> object:
    """Coerce provider scalars to the string shapes used by typed submissions."""

    if value is None:
        return "unknown"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return value if isinstance(value, str) else "unknown"


def normalize_provider_tri_state(value: object) -> str:
    """Normalize common provider truthy/falsy spellings to a closed string state."""

    normalized = str(normalize_provider_scalar(value)).strip().casefold()
    if normalized in {"true", "yes", "visible", "present", "1"}:
        return "true"
    if normalized in {"false", "no", "not_visible", "absent", "0"}:
        return "false"
    return "unknown"


def provider_tri_state(value: object) -> bool | None:
    """Map a provider scalar to a boolean only when its meaning is explicit."""

    normalized = normalize_provider_tri_state(value)
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    return None
