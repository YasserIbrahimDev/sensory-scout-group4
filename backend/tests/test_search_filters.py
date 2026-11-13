from sqlalchemy import select

from app.models import Venue
from app.seed import seed_data


def test_search_name_and_city(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"q": "Willow"})
    assert result.status_code == 200
    assert [v["slug"] for v in result.json()["items"]] == ["willow-reading-room"]
    assert client.get("/api/v1/places", params={"city": "SAMPLE CITY"}).json()["total_items"] == 10


def test_category_filter(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"category": "LIBRARY"}).json()
    assert result["total_items"] == 2
    assert all(v["category"] == "library" for v in result["items"])


def test_unrated_venues_do_not_match_sensory_filters(client, db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "new-venue"))
    for key in ("max_noise", "min_light", "max_light", "max_crowd"):
        result = client.get("/api/v1/places", params={key: 5})
        assert result.status_code == 200
        assert venue.id not in {v["id"] for v in result.json()["items"]}


def test_no_match_returns_empty_page(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"q": "no such venue xyz"}).json()
    assert result["total_items"] == 0
    assert result["items"] == []
    assert result["total_pages"] == 0


def test_invalid_filter_values(client):
    for params in ({"max_noise": 0}, {"max_crowd": 6}, {"min_light": 5, "max_light": 2}):
        assert client.get("/api/v1/places", params=params).status_code == 422


def test_filtered_pagination(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"city": "Sample City", "page_size": 3, "page": 2}).json()
    assert result["total_items"] == 10
    assert result["page"] == 2
    assert len(result["items"]) == 3
