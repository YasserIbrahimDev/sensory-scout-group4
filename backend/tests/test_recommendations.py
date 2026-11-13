"""Unit/integration coverage for backend recommendation ranking."""
from sqlalchemy import select

from app.models import SensoryProfile, Venue
from app.seed import seed_data
from app.services.recommendations import rank_venues


def test_no_preferences_returns_no_recommendations(db):
    seed_data(db)
    profile = db.scalar(select(SensoryProfile).where(SensoryProfile.pref_noise.is_(None)))
    assert rank_venues(db, profile) == []


def test_missing_ratings_never_count_as_matches(db):
    seed_data(db)
    profile = db.scalar(select(SensoryProfile).where(SensoryProfile.pref_noise == 1))
    results = rank_venues(db, profile, limit=100)
    unreviewed = db.scalar(select(Venue).where(Venue.slug == "new-venue"))
    assert unreviewed.id not in [result.venue_id for result in results]
    assert all(result.reason and result.score > 0 for result in results)


def test_ranking_is_deterministic_and_limited(db):
    seed_data(db)
    profile = db.scalar(select(SensoryProfile).where(SensoryProfile.pref_noise == 1))
    first = rank_venues(db, profile, limit=2)
    second = rank_venues(db, profile, limit=2)
    assert first == second
    assert len(first) <= 2


def test_invalid_limit_is_rejected(db):
    seed_data(db)
    profile = db.scalar(select(SensoryProfile).where(SensoryProfile.pref_noise == 1))
    for limit in (0, 101):
        try:
            rank_venues(db, profile, limit=limit)
        except ValueError:
            pass
        else:
            raise AssertionError("Expected invalid limit to raise ValueError")
