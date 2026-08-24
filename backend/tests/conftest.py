import os

import pytest
from fastapi.testclient import TestClient

# Set required env vars before importing the app
os.environ.setdefault("SUPABASE_URL", "http://127.0.0.1:54321")
os.environ.setdefault("SUPABASE_SECRET_KEY", "test-secret-key")
os.environ.setdefault("CLERK_ISSUER", "https://clerk.example.com")
os.environ.setdefault(
    "CLERK_AUTHORIZED_PARTIES",
    "http://localhost:3000,http://localhost:3001",
)

from app.main import app  # noqa: E402


@pytest.fixture
def client():
    return TestClient(app)
