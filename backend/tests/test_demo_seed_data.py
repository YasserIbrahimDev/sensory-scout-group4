from sqlalchemy import func, select

from app.models import Rating, Review, Venue
from app.seed import seed_data
from app.services.venue_details import build_venue_detail


def test_all_seed_venues_have_unique_demo_map_positions(db):
    seed_data(db)
    venues = db.scalars(select(Venue)).all()
    assert len(venues) == 16
    assert len({(v.latitude, v.longitude) for v in venues}) == 16
    for venue in venues:
        assert venue.is_sample
        assert -90 <= venue.latitude <= 90
        assert -180 <= venue.longitude <= 180
        if venue.city == "Sample City":
            assert "synthetic map-test positions" in venue.description


def test_denton_assessments_are_synthetic_and_accessibility_unknown(db):
    counts = seed_data(db)
    assert counts["reviews"] == 16 and counts["ratings"] == 16
    for venue in db.scalars(select(Venue).where(Venue.city == "Denton")):
        detail = build_venue_detail(db, venue)
        assert detail.review_count == 1
        assert detail.sensory_summary.ratings_count == 1
        assert detail.accessibility_summary.unknown_reports == 1
        review = db.scalar(select(Review).where(Review.venue_id == venue.id))
        assert "Synthetic sensory assessment" in review.comment
        assert review.wheelchair_accessible is None
    unrated = db.scalar(select(Venue).where(Venue.slug == "new-venue"))
    assert build_venue_detail(db, unrated).sensory_summary.noise_rating is None


def test_backfill_requires_opt_in_and_preserves_edits_and_non_sample_venues(db):
    seed_data(db)
    missing = db.scalar(select(Venue).where(Venue.slug == "willow-reading-room"))
    edited = db.scalar(select(Venue).where(Venue.slug == "cedar-cafe"))
    real = db.scalar(select(Venue).where(Venue.slug == "meadow-park"))
    missing.latitude = missing.longitude = None
    missing.description = "Teammate description"
    edited.latitude, edited.longitude = 33.3, -97.3
    real.latitude = real.longitude = None
    real.is_sample = False
    db.commit()
    seed_data(db)
    assert missing.latitude is None
    counts = seed_data(db, update_sample_locations=True)
    assert all(n == 0 for n in counts.values())
    db.refresh(missing)
    assert float(missing.latitude) == 33.2102
    assert missing.description.startswith("Teammate description")
    assert "synthetic" in missing.description
    assert float(edited.latitude) == 33.3
    assert real.latitude is None
    description = missing.description
    seed_data(db, update_sample_locations=True)
    assert missing.description == description
    assert db.scalar(select(func.count()).select_from(Review)) == 16


def test_reseed_preserves_existing_synthetic_rating_edits(db):
    seed_data(db)
    venue = db.scalar(select(Venue).where(Venue.slug == "denton-public-library"))
    rating = db.scalar(select(Rating).join(Review).where(Review.venue_id == venue.id))
    rating.noise_rating = 4
    db.commit()
    seed_data(db, update_sample_locations=True)
    db.refresh(rating)
    assert rating.noise_rating == 4
