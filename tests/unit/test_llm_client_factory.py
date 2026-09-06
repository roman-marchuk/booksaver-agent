"""Caller-scoped LLM construction, key isolation and adaptive capability contracts."""

from datetime import UTC, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from booksaver.domain.model_policy import (
    AdaptiveModelPortfolio,
    BrowserJobKind,
    ModelCostEstimator,
    ModelRole,
)
from booksaver.domain.models import Config
from booksaver.domain.value_objects import CheckInterval, DataDirectory, NotificationSettings
from booksaver.infrastructure.llm.client_factory import AnthropicLLMClientFactory


def _config() -> Config:
    return Config(
        check_interval=CheckInterval(duration=timedelta(hours=6)),
        data_directory=DataDirectory(path=Path("/tmp/booksaver-test")),
        notification_settings=NotificationSettings(),
        loaded_at=datetime.now(UTC),
    )


class _FakeUserRepo:
    def __init__(self, owner) -> None:
        self._owner = owner

    def get_owner_of_booking(self, booking_id: str):
        return self._owner

    def get_by_id(self, user_id: int):
        if self._owner is not None and self._owner.user_id == user_id:
            return self._owner
        return None


class _FakeKeyStore:
    def __init__(self, plaintext: str | None = None, raise_error: bool = False) -> None:
        self._plaintext = plaintext
        self._raise = raise_error
        self.decrypt_calls = 0

    def decrypt(self, ciphertext: bytes) -> str:
        self.decrypt_calls += 1
        if self._raise:
            from booksaver.domain.errors import SecretKeyError

            raise SecretKeyError("boom")
        assert self._plaintext is not None
        return self._plaintext


def _user(encrypted_key: bytes | None, *, active: bool = True):
    from booksaver.domain.user import User, UserAccessState, UserRole

    return User(
        user_id=1,
        telegram_user_id=42,
        role=UserRole.USER,
        access_state=(UserAccessState.ACTIVE if active else UserAccessState.REVOKED),
        created_at=datetime.now(UTC),
        encrypted_key=encrypted_key,
    )


@pytest.mark.parametrize(
    "method, adapter",
    [("for_booking", "AnthropicExtractor"), ("agent_brain_for_booking", "AnthropicAgentBrain")],
)
@pytest.mark.parametrize(
    "owner_key, personal_key, scoped, expected_key",
    [
        ("owner-key", None, True, "owner-key"),
        ("owner-key", "personal-key", True, "personal-key"),
        (None, "personal-key", True, "personal-key"),
        (None, None, True, None),
        ("owner-key", None, False, "owner-key"),
    ],
    ids=["owner", "personal-preferred", "personal-only", "unfunded", "owner-without-repository"],
)
def test_booking_adapter_receives_exact_key_and_model(
    monkeypatch, method, adapter, owner_key, personal_key, scoped, expected_key
):
    from booksaver.infrastructure.llm import anthropic_adapter

    from .monitor.fakes import make_booking

    monkeypatch.delenv("BOOKSAVER_LLM_API_KEY", raising=False)
    created = SimpleNamespace(role="navigation_agent")
    constructor = Mock(return_value=created)
    monkeypatch.setattr(anthropic_adapter, adapter, constructor)
    keys = _FakeKeyStore(plaintext=personal_key)
    users = _FakeUserRepo(_user(b"encrypted-personal" if personal_key else None))
    config = _config()
    factory = AnthropicLLMClientFactory(
        config, api_key=owner_key, user_repo=users if scoped else None, key_store=keys
    )

    result = getattr(factory, method)(make_booking())

    if expected_key is None:
        assert result is None
        constructor.assert_not_called()
    else:
        assert result is created
        constructor.assert_called_once_with(
            api_key=expected_key, model=config.agent_settings.primary_model
        )
    assert keys.decrypt_calls == int(scoped and personal_key is not None)


class TestHybridBilling:
    """US-027: booking -> owning user -> personal key, else owner key."""

    def test_invalid_personal_key_raises_user_key_invalid_error(self):
        import pytest

        from booksaver.domain.errors import UserKeyInvalidError

        from .monitor.fakes import make_booking

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=b"ciphertext")),
            key_store=_FakeKeyStore(raise_error=True),
        )

        with pytest.raises(UserKeyInvalidError):
            factory.for_booking(make_booking())

    def test_stored_personal_key_without_key_store_never_uses_owner_key(self):
        import pytest

        from booksaver.domain.errors import UserKeyInvalidError

        from .monitor.fakes import make_booking

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=b"ciphertext")),
            key_store=None,
        )

        with pytest.raises(UserKeyInvalidError, match="key store is unavailable"):
            factory.for_booking(make_booking())


class TestExplicitUserRoleResolution:
    def test_builds_versioned_navigation_brain_for_active_user(self):
        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None)),
        )

        brain = factory.agent_brain_for_user(1)

        assert brain is not None
        assert brain.provider == "anthropic"
        assert brain.role == "navigation_agent"
        assert brain.model == _config().agent_settings.model
        assert brain.prompt_version == "booking-browser-recovery-v5"

    def test_builds_positive_inventory_interpreter_for_active_user(self):
        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None)),
        )

        interpreter = factory.inventory_interpreter_for_user(1)

        assert interpreter is not None
        assert interpreter.provider == "anthropic"
        assert interpreter.role == "inventory_interpreter"
        assert interpreter.prompt_version == "booking-inventory-interpretation-v1"

    def test_user_scoped_capabilities_fail_closed_for_unknown_or_revoked_user(self):
        revoked_factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None, active=False)),
        )

        assert revoked_factory.agent_brain_for_user(1) is None
        assert revoked_factory.inventory_interpreter_for_user(1) is None
        assert revoked_factory.agent_brain_for_user(999) is None

    def test_explicit_user_resolution_requires_user_repository(self):
        factory = AnthropicLLMClientFactory(_config(), api_key="sk-owner-key")

        assert factory.agent_brain_for_user(1) is None
        assert factory.inventory_interpreter_for_user(1) is None

    def test_role_mismatch_is_rejected(self):
        import pytest

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None)),
        )

        with pytest.raises(ValueError, match="Unsupported agent role"):
            factory.agent_brain_for_user(1, "inventory_interpreter")
        with pytest.raises(ValueError, match="Unsupported inventory interpreter role"):
            factory.inventory_interpreter_for_user(1, "navigation_agent")

    def test_personal_key_error_applies_to_inventory_interpreter(self):
        import pytest

        from booksaver.domain.errors import UserKeyInvalidError

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=b"ciphertext")),
            key_store=_FakeKeyStore(raise_error=True),
        )

        with pytest.raises(UserKeyInvalidError):
            factory.inventory_interpreter_for_user(1)

    def test_missing_key_store_fails_closed_for_all_user_scoped_roles(self):
        import pytest

        from booksaver.domain.errors import UserKeyInvalidError

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=b"ciphertext")),
            key_store=None,
        )

        with pytest.raises(UserKeyInvalidError, match="key store is unavailable"):
            factory.agent_brain_for_user(1)
        with pytest.raises(UserKeyInvalidError, match="key store is unavailable"):
            factory.inventory_interpreter_for_user(1)

    def test_booking_brain_wrapper_delegates_to_explicit_owner(self):
        from .monitor.fakes import make_booking

        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None, active=False)),
        )

        assert factory.agent_brain_for_booking(make_booking()) is None


class TestAdaptiveCallerBinding:
    def test_job_identity_and_role_proxies_do_not_decrypt_personal_key(self):
        from booksaver.application.model_policy import BrowserJobCostBudget

        class _Ledger:
            def reserve_call(self, _request):
                raise AssertionError("deterministic setup must not reserve model spend")

            def reconcile_call(self, _request):
                raise AssertionError("deterministic setup must not reconcile model spend")

            def list_attempts(self, _job_id):
                return ()

        key_store = _FakeKeyStore(plaintext="sk-personal-key")
        factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=b"ciphertext")),
            key_store=key_store,
        )

        key_ref = factory.caller_key_ref_for_user(1)
        assert key_ref is not None
        budget = BrowserJobCostBudget(
            job_id="check-now-test",
            job_kind=BrowserJobKind.CHECK_NOW,
            caller_key_ref=key_ref,
            ledger=_Ledger(),
            estimator=ModelCostEstimator(),
        )
        runtime = factory.adaptive_runtime_for_user(1, budget)
        assert runtime is not None

        runtime.agent_brain()
        runtime.inventory_interpreter()
        runtime.extractor()
        runtime.page_state_resolver()

        assert key_store.decrypt_calls == 0

    def test_page_classifier_rejects_non_classification_profile(self):
        import pytest

        bound = factory = AnthropicLLMClientFactory(
            _config(),
            api_key="sk-owner-key",
            user_repo=_FakeUserRepo(_user(encrypted_key=None)),
        ).bind_for_user(1)
        assert bound is not None
        profile = AdaptiveModelPortfolio().primary(
            ModelRole.EXTRACTION,
            "booking-offer-extraction-v1",
        )

        with pytest.raises(ValueError, match="classification profile"):
            factory.page_classifier(profile)
