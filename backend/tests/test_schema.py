import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, delete, event, func, select
from sqlalchemy.exc import IntegrityError

from app.database import Base
from app.models import Rating, Review, ReviewVote, SavedPlace, SensoryProfile, User, Venue
from app.seed import seed_data


@pytest.mark.parametrize(
    "values",
    [
        {"latitude": 91, "longitude": 0},
        {"latitude": 0, "longitude": 181},
        {"latitude": 25, "longitude": None},
        {"external_map_provider": "google"},
    ],
)
def test_invalid_venue_values_rejected(db, values):
    db.add(
        Venue(
            slug="invalid",
            name="Invalid",
            category="cafe",
            description="Sample",
            address="Sample",
            city="Sample",
            is_sample=True,
            **values,
        )
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


@pytest.mark.parametrize("field", ["pref_noise", "pref_light", "pref_crowd"])
@pytest.mark.parametrize("value", [0, 6])
def test_invalid_preferences_rejected(db, field, value):
    seed_data(db)
    profile = db.scalar(select(SensoryProfile).order_by(SensoryProfile.id))
    setattr(profile, field, value)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


@pytest.mark.parametrize("field", ["noise_rating", "light_rating", "crowd_rating"])
@pytest.mark.parametrize("value", [0, 6])
def test_invalid_ratings_rejected(db, field, value):
    seed_data(db)
    rating = db.scalar(select(Rating).order_by(Rating.id))
    setattr(rating, field, value)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_empty_rating_rejected(db):
    seed_data(db)
    rating = db.scalar(select(Rating).order_by(Rating.id))
    rating.noise_rating = rating.light_rating = rating.crowd_rating = None
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


@pytest.mark.parametrize(
    "model,fields",
    [
        (SensoryProfile, ["user_id"]),
        (Rating, ["review_id"]),
        (SavedPlace, ["user_id", "venue_id"]),
        (ReviewVote, ["user_id", "review_id", "is_upvote"]),
    ],
)
def test_duplicate_relation_rejected(db, model, fields):
    seed_data(db)
    existing = db.scalar(select(model).order_by(model.id))
    kwargs = {field: getattr(existing, field) for field in fields}
    if model is Rating:
        kwargs["noise_rating"] = 2
    db.add(model(**kwargs))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_foreign_keys_reject_orphan(db):
    db.add(SavedPlace(user_id=999, venue_id=999))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_deleting_user_cascades_dependents(db):
    seed_data(db)
    user = db.scalar(select(User).where(User.email == "scout.one@example.invalid"))
    review_ids = list(db.scalars(select(Review.id).where(Review.user_id == user.id)))
    db.execute(delete(User).where(User.id == user.id))
    db.commit()
    assert (
        db.scalar(
            select(func.count())
            .select_from(SensoryProfile)
            .where(SensoryProfile.user_id == user.id)
        )
        == 0
    )
    assert (
        db.scalar(select(func.count()).select_from(SavedPlace).where(SavedPlace.user_id == user.id))
        == 0
    )
    assert (
        db.scalar(select(func.count()).select_from(Rating).where(Rating.review_id.in_(review_ids)))
        == 0
    )


def test_migration_matches_models_and_can_downgrade():
    engine = create_engine("sqlite://")

    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, _record):
        connection.execute("PRAGMA foreign_keys=ON")

    config = Config("alembic.ini")
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
        assert compare_metadata(MigrationContext.configure(connection), Base.metadata) == []
        assert len(Base.metadata.tables) == 7
        command.downgrade(config, "base")
    engine.dispose()
