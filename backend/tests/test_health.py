from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.database import get_db
from app.main import app


def test_liveness(client):
    assert client.get("/api/v1/health/live").json() == {"status": "ok"}


def test_migrated_empty_database_is_ready(client):
    assert client.get("/api/v1/health/ready").json() == {"status": "ready"}


def test_failed_readiness_is_503_without_internal_details():
    class BrokenSession:
        def execute(self, *_args):
            raise OperationalError("query", {}, Exception("private connection details"))

    def broken_db():
        yield BrokenSession()

    app.dependency_overrides[get_db] = broken_db
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/health/ready")
            assert response.status_code == 503
            assert response.json() == {"detail": "Database is not ready"}
    finally:
        app.dependency_overrides.clear()
