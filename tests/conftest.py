import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch


@pytest.fixture
def mock_db():
    """Mock the database module for API tests without a real SQL Server."""
    with patch("app.database.db") as mock:
        mock.query = AsyncMock(return_value=[])
        mock.scalar = AsyncMock(return_value=0)
        mock.execute = AsyncMock(return_value=1)
        mock.execute_return_id = AsyncMock(return_value=1)
        yield mock


@pytest.fixture
async def client(mock_db):
    """Async test client for the FastAPI app."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
