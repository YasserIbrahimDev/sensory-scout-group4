import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Rating, Review, ReviewVote, SavedPlace, SensoryProfile, User, Venue

SEED_FILE = Path(__file__).resolve().parents[1] / "data" / "sample_data.json"

# Rename the original placeholder rows in place so their IDs and relationships survive.
LEGACY_SLUG_MAP = {
    "willow-reading-room": "denton-north-library",
    "cedar-cafe": "denton-south-library",
    "meadow-park": "patterson-appleton-arts-center",
    "market-square": "courthouse-square-museum",
    "evening-gallery": "historical-park",
    "community-lounge": "bayless-selby-house",
    "riverside-cafe": "quakertown-park",
    "busy-food-hall": "west-oak-coffee",
    "study-corner": "triptych-coffee",
}

# The old saved-place fixture pointed to the placeholder formerly used for Jupiter House.
# The current canonical venue record is harmony-coffee; keep the old placeholder untouched
# rather than creating or renaming a duplicate physical venue.
SAVED_PLACE_SLUG_ALIASES = {
    **LEGACY_SLUG_MAP,
    "new-venue": "harmony-coffee",
}


def _set_non_null_fields(model, values: dict) -> None:
    """Refresh fixture values without erasing existing data with JSON nulls."""
    for key, value in values.items():
        if value is not None:
            setattr(model, key, value)


def seed_data(db: Session) -> dict[str, int]:
    """Idempotently seed the synthetic prototype dataset while preserving linked records."""
    with SEED_FILE.open(encoding="utf-8") as file:
        data = json.load(file)

    counts = {name: 0 for name in data}
    users: dict[str, User] = {}
    venues: dict[str, Venue] = {}
    reviews: dict[str, Review] = {}

    # Fixture accounts use reserved .invalid addresses and disabled password hashes.
    for row in data["users"]:
        user = db.scalar(select(User).where(User.email == row["email"]))
        if user is None:
            user = User(**row, password_hash="!disabled-sample-account")
            db.add(user)
            db.flush()
            counts["users"] += 1
        users[user.email] = user

    for row in data["sensory_profiles"]:
        user_id = users[row["user_email"]].id
        profile = db.scalar(
            select(SensoryProfile).where(SensoryProfile.user_id == user_id)
        )
        profile_values = {k: v for k, v in row.items() if k != "user_email"}
        if profile is None:
            profile = SensoryProfile(user_id=user_id, **profile_values)
            db.add(profile)
            db.flush()
            counts["sensory_profiles"] += 1
        else:
            # Refresh preferences for the dedicated fixture accounts on repeat runs.
            _set_non_null_fields(profile, profile_values)

    for row in data["venues"]:
        target_slug = row["slug"]
        venue = db.scalar(select(Venue).where(Venue.slug == target_slug))

        if venue is None:
            legacy_slug = next(
                (old for old, new in LEGACY_SLUG_MAP.items() if new == target_slug),
                None,
            )
            if legacy_slug:
                venue = db.scalar(select(Venue).where(Venue.slug == legacy_slug))
                if venue is not None:
                    # Update in place; retain the existing primary key and all FKs.
                    _set_non_null_fields(venue, row)

        if venue is None:
            venue = Venue(**row)
            db.add(venue)
            db.flush()
            counts["venues"] += 1
        else:
            # Refresh existing fixture venue details, but never replace known values with null.
            _set_non_null_fields(venue, row)

        venues[target_slug] = venue
        venues[venue.slug] = venue

    for row in data["reviews"]:
        user_id = users[row["user_email"]].id
        venue = venues[row["venue_slug"]]
        review = db.scalar(
            select(Review)
            .where(Review.user_id == user_id, Review.venue_id == venue.id)
            .order_by(Review.id)
        )

        if review is None:
            review = Review(
                user_id=user_id,
                venue_id=venue.id,
                comment=row["comment"],
                overall_rating=row.get("overall_rating"),
                wheelchair_accessible=row.get("wheelchair_accessible"),
            )
            db.add(review)
            db.flush()
            counts["reviews"] += 1
        else:
            # These are dedicated fixture accounts; refresh only their fixture-owned reviews.
            review.comment = row["comment"]
            review.overall_rating = row.get("overall_rating")
            review.wheelchair_accessible = row.get("wheelchair_accessible")

        reviews[row["key"]] = review

    for row in data["ratings"]:
        review = reviews[row["review_key"]]
        rating = db.scalar(select(Rating).where(Rating.review_id == review.id))
        values = {
            k: v for k, v in row.items()
            if k != "review_key" and v is not None
        }
        if rating is None:
            rating = Rating(review_id=review.id, **values)
            db.add(rating)
            db.flush()
            counts["ratings"] += 1
        else:
            for key, value in values.items():
                setattr(rating, key, value)

    for row in data["review_votes"]:
        user_id = users[row["user_email"]].id
        review_id = reviews[row["review_key"]].id
        vote = db.scalar(
            select(ReviewVote).where(
                ReviewVote.user_id == user_id,
                ReviewVote.review_id == review_id,
            )
        )
        if vote is None:
            db.add(
                ReviewVote(
                    user_id=user_id,
                    review_id=review_id,
                    is_upvote=row["is_upvote"],
                )
            )
            db.flush()
            counts["review_votes"] += 1
        else:
            vote.is_upvote = row["is_upvote"]

    for row in data["saved_places"]:
        user_id = users[row["user_email"]].id
        slug = SAVED_PLACE_SLUG_ALIASES.get(row["venue_slug"], row["venue_slug"])
        venue = venues[slug]
        saved = db.scalar(
            select(SavedPlace).where(
                SavedPlace.user_id == user_id,
                SavedPlace.venue_id == venue.id,
            )
        )
        if saved is None:
            db.add(SavedPlace(user_id=user_id, venue_id=venue.id))
            db.flush()
            counts["saved_places"] += 1

    db.commit()
    return counts


def main() -> None:
    with SessionLocal() as db:
        counts = seed_data(db)
    print(f"Seed completed. Inserted records by table: {counts}")


if __name__ == "__main__":
    main()
