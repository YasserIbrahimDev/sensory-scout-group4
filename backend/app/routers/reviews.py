from typing import Annotated

from fastapi import APIRouter, Depends, Path
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Review, User

router = APIRouter(prefix="/places", tags=["reviews"])


class ReviewItem(BaseModel):
    id: str
    placeId: str
    author: str
    rating: int | None
    date: str
    text: str


@router.get("/{place_id}/reviews", response_model=list[ReviewItem])
def list_place_reviews(
    place_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
):
    rows = db.execute(
        select(Review, User)
        .join(User, User.id == Review.user_id)
        .where(Review.venue_id == place_id, Review.comment.is_not(None))
        .order_by(Review.created_at.desc(), Review.id.desc())
    ).all()
    result = []
    for review, user in rows:
        name_parts = user.name.split()
        author = name_parts[0] + (
            f" {name_parts[-1][0]}." if len(name_parts) > 1 else ""
        )
        result.append(
            ReviewItem(
                id=str(review.id),
                placeId=str(place_id),
                author=author,
                rating=review.overall_rating,
                date=review.created_at.date().isoformat(),
                text=review.comment or "",
            )
        )
    return result
