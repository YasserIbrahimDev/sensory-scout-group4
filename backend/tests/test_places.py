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
