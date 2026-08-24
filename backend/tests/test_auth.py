import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jwt import PyJWKClientConnectionError, PyJWKClientError

import app.core.auth as auth_mod
from app.config import settings
from app.core.auth import get_current_user

ISSUER = settings.CLERK_ISSUER
AZP = settings.CLERK_AUTHORIZED_PARTIES.split(",")[0].strip()
CLERK_SUB = "user_2abcTEST"
PROFILE_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
_MISSING = object()


@pytest.fixture
def private_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def patch_jwks(monkeypatch, private_key):
    class FakeSigningKey:
        key = private_key.public_key()

    monkeypatch.setattr(
        auth_mod._jwks_client,
        "get_signing_key_from_jwt",
        lambda _token: FakeSigningKey(),
    )
    return private_key


def make_token(private_key, algorithm="RS256", **overrides):
    now = int(time.time())
    payload = {
        "sub": CLERK_SUB,
        "email": "user@example.com",
        "iss": ISSUER,
        "azp": AZP,
        "iat": now,
        "nbf": now - 1,
        "exp": now + 3600,
    }
    for key, value in overrides.items():
        if value is _MISSING:
            payload.pop(key, None)
        else:
            payload[key] = value
    return jwt.encode(payload, private_key, algorithm=algorithm)


def _credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _call(token: str):
    return get_current_user(credentials=_credentials(token))


class FakeQuery:
    def __init__(self, owner):
        self._owner = owner
        self._op = None

    def table(self, _name):
        return self

    def select(self, *_args, **_kwargs):
        self._op = "select"
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def upsert(self, json, **kwargs):
        self._op = "upsert"
        self._owner.upsert_calls.append((json, kwargs))
        return self

    def execute(self):
        if self._op == "select":
            self._owner.select_count += 1
            data = (
                self._owner.first_select
                if self._owner.select_count == 1
                else self._owner.later_select
            )
            return SimpleNamespace(data=data)
        if self._op == "upsert":
            return SimpleNamespace(data=self._owner.upsert_result)
        return SimpleNamespace(data=None)


class FakeClient:
    def __init__(self, first_select, later_select=None, upsert_result=None):
        self.first_select = first_select
        self.later_select = later_select if later_select is not None else first_select
        self.upsert_result = upsert_result
        self.select_count = 0
        self.upsert_calls = []

    def table(self, name):
        return FakeQuery(self).table(name)


def _patch_profile(monkeypatch, client: FakeClient):
    monkeypatch.setattr(auth_mod, "get_service_client", lambda: client)


def test_valid_token_returns_internal_uuid(monkeypatch, patch_jwks, private_key):
    _patch_profile(
        monkeypatch,
        FakeClient(first_select=[{"user_id": PROFILE_ID}]),
    )
    user = _call(make_token(private_key))
    assert user.id == PROFILE_ID
    assert user.email == "user@example.com"
    assert not hasattr(user, "access_token") or "access_token" not in user.model_dump()


def test_missing_email_returns_401(patch_jwks, private_key):
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key, email=_MISSING))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_wrong_issuer_returns_401(patch_jwks, private_key):
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key, iss="https://other-issuer.example.com"))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_expired_token_returns_401(patch_jwks, private_key):
    now = int(time.time())
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key, iat=now - 120, nbf=now - 120, exp=now - 60))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_azp_missing_returns_401(patch_jwks, private_key):
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key, azp=_MISSING))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_azp_not_allowed_returns_401(patch_jwks, private_key):
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key, azp="https://evil.example"))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_supabase_shaped_es256_token_returns_401(monkeypatch):
    es_key = ec.generate_private_key(ec.SECP256R1())

    class FakeSigningKey:
        key = es_key.public_key()

    monkeypatch.setattr(
        auth_mod._jwks_client,
        "get_signing_key_from_jwt",
        lambda _token: FakeSigningKey(),
    )
    token = make_token(
        es_key,
        algorithm="ES256",
        aud="authenticated",
        iss="https://example.supabase.co/auth/v1",
        role="authenticated",
        azp=_MISSING,
    )
    with pytest.raises(HTTPException) as exc:
        _call(token)
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_jwks_unreachable_returns_5xx_not_401(monkeypatch, private_key):
    def boom(_token):
        raise PyJWKClientConnectionError("unable to fetch JWKS")

    monkeypatch.setattr(
        auth_mod._jwks_client,
        "get_signing_key_from_jwt",
        boom,
    )
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key))
    assert exc.value.status_code >= 500
    assert exc.value.status_code != 401
    assert exc.value.detail["error"]["code"] != "INVALID_TOKEN"


def test_profile_hit_returns_uuid(monkeypatch, patch_jwks, private_key):
    client = FakeClient(first_select=[{"user_id": PROFILE_ID}])
    _patch_profile(monkeypatch, client)
    user = _call(make_token(private_key))
    assert user.id == PROFILE_ID
    assert client.select_count == 1
    assert client.upsert_calls == []


def test_profile_miss_upserts_then_selects(monkeypatch, patch_jwks, private_key):
    client = FakeClient(
        first_select=[],
        later_select=[{"user_id": PROFILE_ID}],
        upsert_result=[{"user_id": PROFILE_ID, "clerk_user_id": CLERK_SUB}],
    )
    _patch_profile(monkeypatch, client)
    user = _call(make_token(private_key))
    assert user.id == PROFILE_ID
    assert client.select_count == 2
    assert len(client.upsert_calls) == 1
    payload, kwargs = client.upsert_calls[0]
    assert payload == {"clerk_user_id": CLERK_SUB}
    assert kwargs["on_conflict"] == "clerk_user_id"
    assert kwargs["ignore_duplicates"] is True


def test_profile_duplicate_winner_reselects_existing_row(
    monkeypatch, patch_jwks, private_key
):
    client = FakeClient(
        first_select=[],
        later_select=[{"user_id": PROFILE_ID}],
        upsert_result=[],
    )
    _patch_profile(monkeypatch, client)
    user = _call(make_token(private_key))
    assert user.id == PROFILE_ID
    assert client.select_count == 2
    assert len(client.upsert_calls) == 1
    _, kwargs = client.upsert_calls[0]
    assert kwargs["ignore_duplicates"] is True


def test_malformed_token_returns_401_not_500():
    # No JWKS patch: a malformed bearer must fail before any network/JWKS work.
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="garbage")
    with pytest.raises(HTTPException) as exc:
        get_current_user(creds)
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"


def test_unknown_kid_returns_401_not_503(monkeypatch, private_key):
    def raise_lookup(_token):
        raise PyJWKClientError('Unable to find a signing key that matches: "kid"')

    monkeypatch.setattr(
        auth_mod._jwks_client, "get_signing_key_from_jwt", raise_lookup
    )
    with pytest.raises(HTTPException) as exc:
        _call(make_token(private_key))
    assert exc.value.status_code == 401
    assert exc.value.detail["error"]["code"] == "INVALID_TOKEN"
