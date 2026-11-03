import pytest
from sqlalchemy import func, select

from app.models import Rating, Review, Venue
from app.seed import seed_data


def test_details_aggregate_ratings_and_reports(client, db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "willow-reading-room"))
    response = client.get(f"/api/v1/places/{venue.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Sample Willow Reading Room"
    assert isinstance(body["id"], int)
    assert body["review_count"] == 2
    assert body["sensory_summary"]["noise_rating"] == 1.5
    assert body["sensory_summary"]["crowd_rating"] == 1.5
    assert body["sensory_summary"]["ratings_count"] == 2
    assert body["accessibility_summary"]["accessible_reports"] == 2
    assert body["is_sample"] is True
    assert body["latitude"] is None and body["image_url"] is None
    assert "password_hash" not in body


def test_unknown_place_is_404(client):
    assert client.get("/api/v1/places/99999").status_code == 404


@pytest.mark.parametrize("identifier", ["0", "-1", "not-an-integer", "1.5"])
def test_invalid_id_is_422(client, identifier):
    assert client.get(f"/api/v1/places/{identifier}").status_code == 422


def test_unreviewed_place_is_unknown_not_zero(client, db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "new-venue"))
    body = client.get(f"/api/v1/places/{venue.id}").json()
    assert body["review_count"] == 0
    assert body["sensory_summary"]["noise_rating"] is None
    assert body["sensory_summary"]["ratings_count"] == 0
    assert body["accessibility_summary"]["accessible_reports"] == 0


def test_partial_rating_averages_ignore_null(client, db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "cedar-cafe"))
    review = db.scalar(select(Review).where(Review.venue_id == venue.id))
    rating = db.scalar(select(Rating).where(Rating.review_id == review.id))
    rating.light_rating = None
    db.commit()
    summary = client.get(f"/api/v1/places/{venue.id}").json()["sensory_summary"]
    assert summary["light_rating"] is None
    assert summary["light_count"] == 0
    assert summary["noise_rating"] == 3


def test_conflicting_accessibility_reports_are_not_collapsed(client, db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "willow-reading-room"))
    reviews = db.scalars(select(Review).where(Review.venue_id == venue.id)).all()
    reviews[0].wheelchair_accessible = False
    db.commit()
    reports = client.get(f"/api/v1/places/{venue.id}").json()["accessibility_summary"]
    assert reports == {"accessible_reports": 1, "inaccessible_reports": 1, "unknown_reports": 0}


def test_seeding_twice_preserves_counts_and_edits(db):
    counts = seed_data(db)
    assert counts["venues"] == 10 and counts["users"] == 3
    venue = db.scalar(select(Venue).where(Venue.slug == "willow-reading-room"))
    venue.description = "Edited by teammate"
    db.commit()
    assert all(n == 0 for n in seed_data(db).values())
    assert db.scalar(select(func.count()).select_from(Venue)) == 10
    db.refresh(venue)
    assert venue.description == "Edited by teammate"

# Robert's Sprint 1 place listing tests



def test_list_places_returns_seeded_data(client, db):
    seed_data(db)

    response = client.get("/api/v1/places")
    assert response.status_code == 200

    body = response.json()
    assert body["total_items"] == 10
    assert body["page"] == 1
    assert body["page_size"] == 12
    assert body["total_pages"] == 1
    assert body["has_previous"] is False
    assert body["has_next"] is False
    assert len(body["items"]) == 10

    place = body["items"][0]
    assert "id" in place
    assert "name" in place
    assert "category" in place
    assert "city" in place
    assert "sensory_summary" in place
    assert "accessibility_summary" in place


def test_list_places_pagination(client, db):
    seed_data(db)

    first = client.get("/api/v1/places?page=1&page_size=3")
    second = client.get("/api/v1/places?page=2&page_size=3")

    assert first.status_code == 200
    assert second.status_code == 200

    first_body = first.json()
    second_body = second.json()

    assert len(first_body["items"]) == 3
    assert first_body["total_items"] == 10
    assert first_body["total_pages"] == 4
    assert first_body["has_previous"] is False
    assert first_body["has_next"] is True

    assert second_body["page"] == 2
    assert second_body["has_previous"] is True
    assert second_body["has_next"] is True

    first_ids = {item["id"] for item in first_body["items"]}
    second_ids = {item["id"] for item in second_body["items"]}
    assert first_ids.isdisjoint(second_ids)


def test_list_places_final_page(client, db):
    seed_data(db)

    response = client.get("/api/v1/places?page=4&page_size=3")
    assert response.status_code == 200

    body = response.json()
    assert body["page"] == 4
    assert len(body["items"]) == 1
    assert body["has_previous"] is True
    assert body["has_next"] is False


def test_list_places_clamps_page(client, db):
    seed_data(db)

    response = client.get("/api/v1/places?page=999&page_size=3")
    assert response.status_code == 200

    body = response.json()
    assert body["page"] == 4
    assert len(body["items"]) == 1


def test_list_places_empty_database(client):
    response = client.get("/api/v1/places")
    assert response.status_code == 200

    body = response.json()
    assert body["items"] == []
    assert body["total_items"] == 0
    assert body["page"] == 1
    assert body["total_pages"] == 0
    assert body["has_previous"] is False
    assert body["has_next"] is False


@pytest.mark.parametrize(
    "query",
    [
        "page=0",
        "page=-1",
        "page=abc",
        "page_size=0",
        "page_size=101",
        "page_size=abc",
    ],
)
def test_list_places_invalid_pagination(client, query):
    response = client.get(f"/api/v1/places?{query}")
    assert response.status_code == 422


def test_list_places_stable_ordering(client, db):
    seed_data(db)

    response = client.get("/api/v1/places")
    assert response.status_code == 200

    items = response.json()["items"]
    actual_order = [(item["name"], item["id"]) for item in items]

    assert actual_order == sorted(actual_order)


def test_list_places_matches_details(client, db):
    seed_data(db)

    listing = client.get("/api/v1/places").json()
    place = listing["items"][0]

    response = client.get(f"/api/v1/places/{place['id']}")
    assert response.status_code == 200
    assert place == response.json()
