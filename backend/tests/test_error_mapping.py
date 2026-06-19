import httpx

from app.services.error_mapping import ERROR_USER_MESSAGES, classify_provider_error


def _status_error(code: int, body: str = "") -> httpx.HTTPStatusError:
    request = httpx.Request("POST", "https://example.com/")
    response = httpx.Response(code, content=body.encode(), request=request)
    return httpx.HTTPStatusError(message=f"HTTP {code}", request=request, response=response)


def test_all_error_codes_have_messages():
    expected_codes = {
        "INVALID_KEY", "RATE_LIMITED", "CONTENT_POLICY", "TIMEOUT",
        "NETWORK", "EMPTY_RESPONSE", "PROVIDER_CLIENT_ERROR", "PROVIDER_SERVER_ERROR",
    }
    assert expected_codes.issubset(ERROR_USER_MESSAGES.keys())


def test_timeout_exception():
    exc = httpx.TimeoutException("timed out")
    code, msg = classify_provider_error(exc)
    assert code == "TIMEOUT"
    assert msg == ERROR_USER_MESSAGES["TIMEOUT"]


def test_connect_error_is_network():
    exc = httpx.ConnectError("connection refused")
    code, _ = classify_provider_error(exc)
    assert code == "NETWORK"


def test_401_is_invalid_key():
    code, _ = classify_provider_error(_status_error(401))
    assert code == "INVALID_KEY"


def test_429_is_rate_limited():
    code, _ = classify_provider_error(_status_error(429))
    assert code == "RATE_LIMITED"


def test_400_with_policy_body_is_content_policy():
    code, _ = classify_provider_error(_status_error(400, '{"error": "content policy violation"}'))
    assert code == "CONTENT_POLICY"


def test_400_without_policy_keyword_is_client_error():
    code, _ = classify_provider_error(_status_error(400, '{"error": "invalid parameter"}'))
    assert code == "PROVIDER_CLIENT_ERROR"


def test_500_is_server_error():
    code, _ = classify_provider_error(_status_error(500))
    assert code == "PROVIDER_SERVER_ERROR"


def test_unknown_exception_falls_back_to_server_error():
    code, _ = classify_provider_error(RuntimeError("who knows"))
    assert code == "PROVIDER_SERVER_ERROR"


def test_messages_never_leak_exception_detail():
    exc = _status_error(500, "this should not leak to users")
    _, msg = classify_provider_error(exc)
    assert "this should not leak" not in msg
