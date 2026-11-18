"""API-level Sprint 2 integration checks using a real SQLAlchemy test database.

These are automated integration tests, not a browser or deployed PostgreSQL smoke test.
"""
from app.config import Settings, get_settings
from app.main import app
from app.seed import seed_data


def test_sprint2_search_map_details_and_recommendation_flow(client, db):
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=True)
    seed_data(db)

    listing = client.get("/api/v1/places", params={"page": 1, "page_size": 100})
    assert listing.status_code == 200
    items = listing.json()["items"]
    assert items
    mapped = next((v for v in items if v.get("latitude") is not None and v.get("longitude") is not None), None)
    assert mapped is not None, "Expected seeded map-ready venues with coordinates"

    details = client.get(f"/api/v1/places/{mapped['id']}")
    assert details.status_code == 200
    assert details.json()["id"] == mapped["id"]
    assert details.json()["latitude"] is not None

    searched = client.get("/api/v1/places", params={"q": mapped["name"], "page_size": 100})
    assert searched.status_code == 200
    assert any(item["id"] == mapped["id"] for item in searched.json()["items"])

    categorized = client.get("/api/v1/places", params={"category": mapped["category"], "page_size": 100})
    assert categorized.status_code == 200
    assert all(item["category"] == mapped["category"] for item in categorized.json()["items"])

    filtered = client.get("/api/v1/places", params={"max_noise": 3})
    assert filtered.status_code == 200
    assert all(
        item["sensory_summary"]["noise_rating"] is not None
        and item["sensory_summary"]["noise_rating"] <= 3
        for item in filtered.json()["items"]
    )

    before = client.get("/api/v1/demo/recommendations")
    assert before.status_code == 200
    assert before.json()["items"] == []

    saved = client.put("/api/v1/demo/preferences", json={"noise": 1, "lighting": 2, "crowd": 1})
    assert saved.status_code == 200
    after = client.get("/api/v1/demo/recommendations", params={"limit": 3})
    assert after.status_code == 200
    assert len(after.json()["items"]) <= 3
    assert all(item["reason"] for item in after.json()["items"])


def test_demo_endpoints_unavailable_when_disabled(client):
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=False)
    for path in ("/api/v1/demo/preferences", "/api/v1/demo/recommendations", "/api/v1/demo/favorites", "/api/v1/demo/settings"):
        assert client.get(path).status_code == 404
