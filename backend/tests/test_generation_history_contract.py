import base64
import json
import os
from types import SimpleNamespace
from uuid import UUID

import pytest

os.environ.setdefault("SUPABASE_URL", "http://127.0.0.1:54321")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test-secret-key")

from fastapi import HTTPException  # noqa: E402
from storage3.exceptions import StorageException  # noqa: E402

from app.routers import generations  # noqa: E402
from app.routers.generations import (  # noqa: E402
    PROMPT_EXCERPT_LENGTH,
    _build_detail_response,
    _build_history_item,
    _build_prompt_excerpt,
    _build_public_image_url,
    _decode_cursor,
    _encode_cursor,
)


@pytest.mark.parametrize(
    ("prompt", "expected_unchanged"),
    [
        ("hello", True),
        ("x", True),
    ],
)
def test_prompt_excerpt_shorter_than_limit_unchanged(prompt, expected_unchanged):
    result = _build_prompt_excerpt(prompt)
    assert (result == prompt) == expected_unchanged


def test_prompt_excerpt_exact_limit_unchanged():
    prompt = "x" * PROMPT_EXCERPT_LENGTH
    assert _build_prompt_excerpt(prompt) == prompt


def test_prompt_excerpt_over_limit_truncated_with_ellipsis():
    excerpt = _build_prompt_excerpt("a" * 200)
    assert len(excerpt) == PROMPT_EXCERPT_LENGTH
    assert excerpt.endswith("…")


def test_prompt_excerpt_trims_trailing_whitespace_before_ellipsis():
    prompt = "a" * 119 + "   b"
    excerpt = _build_prompt_excerpt(prompt)
    assert len(excerpt) == PROMPT_EXCERPT_LENGTH
    assert excerpt.endswith("…")


@pytest.mark.parametrize(
    ("image_path", "expected"),
    [
        ("brands/abc/generations/123.png", str),
        (None, type(None)),
        ("", type(None)),
    ],
)
def test_public_image_url_from_path(image_path, expected):
    result = _build_public_image_url(image_path)
    assert isinstance(result, expected)
    if expected is str:
        assert "brand-assets/brands/abc/generations/123.png" in result


def test_cursor_round_trip_preserves_values():
    created_at = "2026-06-07T12:30:00Z"
    row_id = "00000000-0000-0000-0000-000000000001"
    decoded_at, decoded_id = _decode_cursor(_encode_cursor(created_at, row_id))
    assert decoded_at == "2026-06-07T12:30:00+00:00"
    assert decoded_id == row_id


@pytest.mark.parametrize(
    ("label", "bad_cursor"),
    [
        ("bad_base64", "not-valid-base64!!!"),
        ("missing_keys", base64.urlsafe_b64encode(json.dumps({"wrong": 1}).encode()).decode()),
        ("not_json", base64.urlsafe_b64encode(b"not json").decode()),
        ("non_string_created_at", base64.urlsafe_b64encode(json.dumps({"c": 1, "i": "00000000-0000-0000-0000-000000000001"}).encode()).decode()),
        ("non_string_id", base64.urlsafe_b64encode(json.dumps({"c": "2026-06-07T12:30:00Z", "i": 1}).encode()).decode()),
        ("invalid_datetime", base64.urlsafe_b64encode(json.dumps({"c": "not-a-date", "i": "00000000-0000-0000-0000-000000000001"}).encode()).decode()),
        ("invalid_uuid", base64.urlsafe_b64encode(json.dumps({"c": "2026-06-07T12:30:00Z", "i": "not-a-uuid"}).encode()).decode()),
    ],
)
def test_decode_malformed_cursor_returns_400(label, bad_cursor):
    with pytest.raises(HTTPException) as exc_info:
        _decode_cursor(bad_cursor)
    assert exc_info.value.status_code == 400


def _sample_row(**overrides):
    base = {
        "id": "00000000-0000-0000-0000-000000000001",
        "prompt": "A modern minimal office with natural light and desk plants",
        "provider": "openai",
        "model": "gpt-image-2",
        "platform_preset": "instagram_post",
        "width": 1080,
        "height": 1080,
        "logo_mode": "none",
        "status": "succeeded",
        "image_path": "brands/aaa/generations/00000000-0000-0000-0000-000000000001.png",
        "error_code": None,
        "error_message": None,
        "created_at": "2026-06-07T12:30:00Z",
        "completed_at": "2026-06-07T12:30:15Z",
        "provider_request_id": "req_abc",
    }
    base.update(overrides)
    return base


def test_build_history_item_succeeded_has_image_no_error():
    item = _build_history_item(_sample_row())
    assert item.image_url is not None
    assert item.error_message is None
    assert len(item.prompt_excerpt) <= PROMPT_EXCERPT_LENGTH


def test_build_history_item_failed_exposes_error_message():
    item = _build_history_item(_sample_row(
        status="failed",
        image_path=None,
        error_code="RATE_LIMIT",
        error_message="Rate limit exceeded",
    ))
    assert item.image_url is None
    assert item.error_message == "Rate limit exceeded"


def test_build_history_item_missing_image_path_yields_null_url():
    assert _build_history_item(_sample_row(image_path=None)).image_url is None


def test_build_detail_response_succeeded_has_download_filename():
    detail = _build_detail_response(_sample_row(), "Test Brand")
    assert detail.image_url is not None
    assert detail.download_filename is not None
    assert detail.download_filename.endswith(".png")
    assert detail.provider_request_id == "req_abc"


def test_build_detail_response_failed_has_no_download():
    detail = _build_detail_response(_sample_row(
        status="failed",
        image_path=None,
        error_code="INTERNAL_ERROR",
        error_message="Something went wrong",
        completed_at="2026-06-07T12:30:05Z",
    ), "Test Brand")
    assert detail.image_url is None
    assert detail.download_filename is None
    assert detail.error_code == "INTERNAL_ERROR"


def test_build_detail_response_without_completed_at_omits_filename():
    assert _build_detail_response(_sample_row(completed_at=None), "Test Brand").download_filename is None


def test_build_detail_response_never_exposes_image_path():
    detail = _build_detail_response(_sample_row(), "Test Brand")
    assert not hasattr(detail, "image_path") or detail.model_fields.get("image_path") is None


def test_build_history_item_never_exposes_image_path():
    item = _build_history_item(_sample_row())
    assert "image_path" not in item.model_fields_set
    assert not hasattr(item, "image_path") or getattr(item, "image_path", None) is None


def test_build_detail_response_failed_with_missing_image():
    detail = _build_detail_response(_sample_row(
        status="failed",
        image_path=None,
        error_code="RATE_LIMIT",
        error_message="Rate limit exceeded",
        completed_at="2026-06-07T12:30:05Z",
    ), "Brand")
    assert detail.image_url is None
    assert detail.download_filename is None
    assert detail.error_code == "RATE_LIMIT"
    assert detail.error_message == "Rate limit exceeded"


class FakeStorageError(StorageException):
    def __init__(self, message: str, status: int = 500, code: str = "StorageError"):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code


class FakeStorageBucket:
    def __init__(self, fake_client):
        self.fake_client = fake_client

    def remove(self, paths):
        self.fake_client.storage_remove_calls.append(paths)
        if self.fake_client.storage_error is not None:
            raise self.fake_client.storage_error
        return [{"name": path} for path in paths]


class FakeStorage:
    def __init__(self, fake_client):
        self.fake_client = fake_client

    def from_(self, bucket_name):
        self.fake_client.storage_bucket_names.append(bucket_name)
        return FakeStorageBucket(self.fake_client)


class FakeQuery:
    def __init__(self, fake_client, table_name):
        self.fake_client = fake_client
        self.table_name = table_name
        self.operation = None
        self.filters = {}

    def select(self, _columns):
        self.operation = "select"
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def maybe_single(self):
        return self

    def execute(self):
        if self.table_name != "generations":
            return SimpleNamespace(data=None)
        if self.operation == "select":
            return SimpleNamespace(data=self.fake_client.generation_row)
        if self.operation == "delete":
            self.fake_client.deleted_generation_filters = self.filters
            return SimpleNamespace(data=[])
        return SimpleNamespace(data=None)


class FakeSupabaseClient:
    def __init__(self, generation_row, storage_error=None):
        self.generation_row = generation_row
        self.storage_error = storage_error
        self.storage = FakeStorage(self)
        self.storage_bucket_names = []
        self.storage_remove_calls = []
        self.deleted_generation_filters = None

    def table(self, table_name):
        return FakeQuery(self, table_name)


async def _delete_generation_with_fake_client(monkeypatch, fake_client):
    monkeypatch.setattr(generations, "get_service_client", lambda: fake_client)
    monkeypatch.setattr(
        generations,
        "_get_brand_or_404",
        lambda brand_id, user_id: {"id": str(brand_id), "name": "Test Brand"},
    )
    await generations.delete_generation(
        UUID("10000000-0000-0000-0000-000000000001"),
        UUID("00000000-0000-0000-0000-000000000001"),
        current_user=SimpleNamespace(id="user-1"),
    )


@pytest.mark.asyncio
async def test_delete_generation_removes_image_before_row(monkeypatch):
    fake_client = FakeSupabaseClient(_sample_row())
    await _delete_generation_with_fake_client(monkeypatch, fake_client)

    assert fake_client.storage_remove_calls == [[fake_client.generation_row["image_path"]]]
    assert fake_client.deleted_generation_filters == {
        "id": "00000000-0000-0000-0000-000000000001",
        "brand_id": "10000000-0000-0000-0000-000000000001",
    }


@pytest.mark.asyncio
async def test_delete_generation_failed_row_skips_storage(monkeypatch):
    fake_client = FakeSupabaseClient(_sample_row(status="failed", image_path=None))
    await _delete_generation_with_fake_client(monkeypatch, fake_client)

    assert fake_client.storage_remove_calls == []
    assert fake_client.deleted_generation_filters is not None


@pytest.mark.asyncio
async def test_delete_generation_already_missing_image_deletes_row(monkeypatch):
    fake_client = FakeSupabaseClient(
        _sample_row(),
        storage_error=FakeStorageError("Object not found", status=404, code="NotFound"),
    )
    await _delete_generation_with_fake_client(monkeypatch, fake_client)

    assert fake_client.storage_remove_calls == [[fake_client.generation_row["image_path"]]]
    assert fake_client.deleted_generation_filters is not None


@pytest.mark.asyncio
async def test_delete_generation_storage_failure_keeps_row(monkeypatch):
    fake_client = FakeSupabaseClient(
        _sample_row(),
        storage_error=FakeStorageError("Storage unavailable", status=500),
    )

    with pytest.raises(HTTPException) as exc_info:
        await _delete_generation_with_fake_client(monkeypatch, fake_client)

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail["error"]["code"] == "STORAGE_DELETE_FAILED"
    assert fake_client.deleted_generation_filters is None


async def _get_detail_with_fake_client(monkeypatch, fake_client):
    monkeypatch.setattr(generations, "get_service_client", lambda: fake_client)
    monkeypatch.setattr(
        generations,
        "_get_brand_or_404",
        lambda brand_id, user_id: {"id": str(brand_id), "name": "Test Brand"},
    )
    return await generations.get_generation_detail(
        UUID("10000000-0000-0000-0000-000000000001"),
        UUID("00000000-0000-0000-0000-000000000001"),
        current_user=SimpleNamespace(id="user-1"),
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("non_terminal_status", ["pending", "processing"])
async def test_get_generation_detail_non_terminal_returns_404(monkeypatch, non_terminal_status):
    # Regression for the detail-endpoint 500: a non-terminal row must 404 rather
    # than reach GenerationDetailResponse (whose status enum only allows
    # succeeded/failed) and raise a Pydantic ValidationError -> unhandled 500.
    fake_client = FakeSupabaseClient(_sample_row(status=non_terminal_status, image_path=None))

    with pytest.raises(HTTPException) as exc_info:
        await _get_detail_with_fake_client(monkeypatch, fake_client)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail["error"]["code"] == "GENERATION_NOT_FOUND"


@pytest.mark.asyncio
async def test_get_generation_detail_succeeded_returns_payload(monkeypatch):
    fake_client = FakeSupabaseClient(_sample_row())

    detail = await _get_detail_with_fake_client(monkeypatch, fake_client)

    assert detail.status == "succeeded"
    assert detail.id == "00000000-0000-0000-0000-000000000001"
    assert detail.image_url is not None
