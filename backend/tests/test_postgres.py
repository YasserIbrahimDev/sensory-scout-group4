import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database import SessionLocal
from app.main import app
from app.models import Venue
from app.seed import seed_data

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("RUN_POSTGRES_TESTS") != "1",
        reason="Requires a migrated/seeded PostgreSQL development database",
    ),
]


def test_postgres_seed_is_repeatable():
    with SessionLocal() as db:
        seed_data(db)
        assert all(n == 0 for n in seed_data(db).values())


def test_postgres_details_and_readiness():
    with SessionLocal() as db:
        venue_id = db.scalar(select(Venue.id).where(Venue.slug == "willow-reading-room"))
    with TestClient(app) as client:
        assert client.get("/api/v1/health/ready").status_code == 200
        response = client.get(f"/api/v1/places/{venue_id}")
        assert response.status_code == 200
        assert response.json()["is_sample"] is True
