from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Timestamped:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class User(Timestamped, Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("email = lower(email)", name="ck_users_lowercase_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class SensoryProfile(Timestamped, Base):
    __tablename__ = "sensory_profiles"
    __table_args__ = (
        CheckConstraint(
            "pref_noise IS NULL OR pref_noise BETWEEN 1 AND 5", name="ck_profiles_noise"
        ),
        CheckConstraint(
            "pref_light IS NULL OR pref_light BETWEEN 1 AND 5", name="ck_profiles_light"
        ),
        CheckConstraint(
            "pref_crowd IS NULL OR pref_crowd BETWEEN 1 AND 5", name="ck_profiles_crowd"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    pref_noise: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pref_light: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pref_crowd: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Venue(Timestamped, Base):
    __tablename__ = "venues"
    __table_args__ = (
        UniqueConstraint("external_map_provider", "external_map_id", name="uq_venues_map_ref"),
        CheckConstraint(
            "latitude IS NULL OR latitude BETWEEN -90 AND 90", name="ck_venues_latitude"
        ),
        CheckConstraint(
            "longitude IS NULL OR longitude BETWEEN -180 AND 180", name="ck_venues_longitude"
        ),
        CheckConstraint(
            "(latitude IS NULL AND longitude IS NULL) OR "
            "(latitude IS NOT NULL AND longitude IS NOT NULL)",
            name="ck_venues_coordinate_pair",
        ),
        CheckConstraint(
            "(external_map_provider IS NULL AND external_map_id IS NULL) OR "
            "(external_map_provider IS NOT NULL AND external_map_id IS NOT NULL)",
            name="ck_venues_map_pair",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(String(240), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    external_map_provider: Mapped[str | None] = mapped_column(String(40), nullable=True)
    external_map_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    is_sample: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Review(Timestamped, Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    wheelchair_accessible: Mapped[bool | None] = mapped_column(Boolean, nullable=True)


class Rating(Timestamped, Base):
    __tablename__ = "ratings"
    __table_args__ = (
        CheckConstraint(
            "noise_rating IS NULL OR noise_rating BETWEEN 1 AND 5", name="ck_ratings_noise"
        ),
        CheckConstraint(
            "light_rating IS NULL OR light_rating BETWEEN 1 AND 5", name="ck_ratings_light"
        ),
        CheckConstraint(
            "crowd_rating IS NULL OR crowd_rating BETWEEN 1 AND 5", name="ck_ratings_crowd"
        ),
        CheckConstraint(
            "noise_rating IS NOT NULL OR light_rating IS NOT NULL OR crowd_rating IS NOT NULL",
            name="ck_ratings_not_empty",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    noise_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    light_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    crowd_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ReviewVote(Timestamped, Base):
    __tablename__ = "review_votes"
    __table_args__ = (UniqueConstraint("review_id", "user_id", name="uq_review_votes_user_review"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    review_id: Mapped[int] = mapped_column(
        ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    is_upvote: Mapped[bool] = mapped_column(Boolean, nullable=False)


class SavedPlace(Base):
    __tablename__ = "saved_places"
    __table_args__ = (UniqueConstraint("user_id", "venue_id", name="uq_saved_places_user_venue"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
