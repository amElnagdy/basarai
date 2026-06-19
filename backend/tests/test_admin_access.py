import pytest
from fastapi import HTTPException

from app.core.auth import User, get_current_admin_user, is_admin_email


def test_is_admin_email_matches_allow_list_case_insensitively(monkeypatch):
    monkeypatch.setattr("app.core.auth.settings.ADMIN_EMAILS", "Op@Example.com")

    assert is_admin_email("op@example.com") is True
    assert is_admin_email("other@example.com") is False


@pytest.mark.parametrize(
    "admin_emails",
    [
        pytest.param("", id="empty"),
        pytest.param(None, id="unset"),
    ],
)
def test_empty_or_unset_allow_list_denies_everyone(monkeypatch, admin_emails):
    monkeypatch.setattr("app.core.auth.settings.ADMIN_EMAILS", admin_emails)

    assert is_admin_email("op@example.com") is False
    assert is_admin_email("other@example.com") is False


def test_get_current_admin_user_denies_non_operator(monkeypatch):
    monkeypatch.setattr("app.core.auth.settings.ADMIN_EMAILS", "op@example.com")
    user = User(id="u1", email="nope@example.com", access_token="t")

    with pytest.raises(HTTPException) as exc:
        get_current_admin_user(user=user)

    assert exc.value.status_code == 403
    assert exc.value.detail["error"]["code"] == "FORBIDDEN"


def test_get_current_admin_user_returns_operator(monkeypatch):
    monkeypatch.setattr("app.core.auth.settings.ADMIN_EMAILS", "op@example.com")
    user = User(id="u1", email="op@example.com", access_token="t")

    assert get_current_admin_user(user=user) == user
