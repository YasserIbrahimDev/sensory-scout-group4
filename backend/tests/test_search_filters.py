from sqlalchemy import func, select

from app.models import Venue
from app.seed import seed_data


def test_search_name_and_city(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"q": "Denton North"})
    assert result.status_code == 200
    assert [v["slug"] for v in result.json()["items"]] == ["denton-north-library"]
    assert client.get("/api/v1/places", params={"city": "DENTON"}).json()["total_items"] == 37


def test_category_filter(client, db):
    seed_data(db)
    result = client.get("/api/v1/places", params={"category": "LIBRARY"}).json()
    expected_count = db.scalar(
        select(func.count()).select_from(Venue).where(Venue.category == "library")
    )
    assert result["total_items"] == expected_count
    assert len(result["items"]) == expected_count
    assert all(v["category"] == "library" for v in result["items"])


def test_unrated_venues_do_not_match_sensory_filters(client, db):
    seed_data(db)
    venue = Venue(
        slug="unreviewed-test-place",
        name="Unreviewed Test Place",
        category="community",
        description="Test fixture venue without ratings.",
        address="1 Test Lane",
        city="Denton",
        is_sample=True,
    )
    db.add(venue)
    db.commit()
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
    result = client.get(
        "/api/v1/places",
        params={"city": "Denton", "page_size": 3, "page": 2},
    ).json()
    assert result["total_items"] == 37
    assert result["page"] == 2
    assert len(result["items"]) == 3
