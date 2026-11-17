import argparse
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Rating, Review, ReviewVote, SavedPlace, SensoryProfile, User, Venue

SEED_FILE = Path(__file__).resolve().parents[1] / "data" / "sample_data.json"


def seed_data(db: Session, *, update_sample_locations: bool = False) -> dict[str, int]:
    """Seed connected fixtures once, preserving existing records and teammate edits."""
    with SEED_FILE.open(encoding="utf-8") as file:
        data = json.load(file)
    counts = {name: 0 for name in data}
    users, venues, reviews = {}, {}, {}
    # All fixture accounts are disabled; no public demo credentials or login route.
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
        if db.scalar(select(SensoryProfile.id).where(SensoryProfile.user_id == user_id)) is None:
            db.add(
                SensoryProfile(
                    user_id=user_id, **{k: v for k, v in row.items() if k != "user_email"}
                )
            )
            db.flush()
            counts["sensory_profiles"] += 1
    for row in data["venues"]:
        venue = db.scalar(select(Venue).where(Venue.slug == row["slug"]))
        if venue is None:
            venue = Venue(**row)
            db.add(venue)
            db.flush()
            counts["venues"] += 1
        elif (
            update_sample_locations
            and venue.is_sample
            and row["is_sample"]
            and venue.latitude is None
            and venue.longitude is None
            and row.get("latitude") is not None
            and row.get("longitude") is not None
        ):
            # Explicitly backfill only missing sample coordinates, never edited positions.
            venue.latitude = row["latitude"]
            venue.longitude = row["longitude"]
            if row["description"].startswith("Fictional venue"):
                note = "Coordinates are synthetic map-test positions, not a real destination."
                if note not in venue.description:
                    venue.description = f"{venue.description} {note}"
        venues[venue.slug] = venue
    for row in data["reviews"]:
        user_id, venue_id = users[row["user_email"]].id, venues[row["venue_slug"]].id
        review = db.scalar(
            select(Review)
            .where(Review.user_id == user_id, Review.venue_id == venue_id)
            .order_by(Review.id)
        )
        if review is None:
            review = Review(
                user_id=user_id,
                venue_id=venue_id,
                comment=row["comment"],
                wheelchair_accessible=row["wheelchair_accessible"],
            )
            db.add(review)
            db.flush()
            counts["reviews"] += 1
        reviews[row["key"]] = review
    for row in data["ratings"]:
        review_id = reviews[row["review_key"]].id
        if db.scalar(select(Rating.id).where(Rating.review_id == review_id)) is None:
            db.add(
                Rating(review_id=review_id, **{k: v for k, v in row.items() if k != "review_key"})
            )
            db.flush()
            counts["ratings"] += 1
    for row in data["review_votes"]:
        user_id, review_id = users[row["user_email"]].id, reviews[row["review_key"]].id
        if (
            db.scalar(
                select(ReviewVote.id).where(
                    ReviewVote.user_id == user_id, ReviewVote.review_id == review_id
                )
            )
            is None
        ):
            db.add(ReviewVote(user_id=user_id, review_id=review_id, is_upvote=row["is_upvote"]))
            db.flush()
            counts["review_votes"] += 1
    for row in data["saved_places"]:
        user_id, venue_id = users[row["user_email"]].id, venues[row["venue_slug"]].id
        if (
            db.scalar(
                select(SavedPlace.id).where(
                    SavedPlace.user_id == user_id, SavedPlace.venue_id == venue_id
                )
            )
            is None
        ):
            db.add(SavedPlace(user_id=user_id, venue_id=venue_id))
            db.flush()
            counts["saved_places"] += 1
    db.commit()
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Insert Sensory Scout development fixtures.")
    parser.add_argument(
        "--update-sample-locations",
        action="store_true",
        help="Also fill missing coordinates on existing sample venues; preserve edited positions.",
    )
    args = parser.parse_args()
    with SessionLocal() as db:
        counts = seed_data(db, update_sample_locations=args.update_sample_locations)
    print(f"Inserted records by table: {counts}. Existing rows and edits preserved.")
    if args.update_sample_locations:
        print("Missing sample locations filled where available; existing coordinates preserved.")


if __name__ == "__main__":
    main()
