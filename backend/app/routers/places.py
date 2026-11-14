from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Rating, Review, Venue
from app.schemas import PaginatedVenues, VenueDetail
from app.services.venue_details import build_venue_detail

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=PaginatedVenues)
def list_places(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 12,
    q: str | None = Query(default=None, max_length=160),
    category: str | None = Query(default=None, max_length=60),
    city: str | None = Query(default=None, max_length=100),
    max_noise: int | None = Query(default=None, ge=1, le=5),
    min_light: int | None = Query(default=None, ge=1, le=5),
    max_light: int | None = Query(default=None, ge=1, le=5),
    max_crowd: int | None = Query(default=None, ge=1, le=5),
) -> PaginatedVenues:
    if min_light is not None and max_light is not None and min_light > max_light:
        raise HTTPException(status_code=422, detail="min_light exceeds max_light")

    statement = select(Venue)
    if q and q.strip():
        term = f"%{q.strip()}%"
        statement = statement.where(
            Venue.name.ilike(term) | Venue.address.ilike(term)
            | Venue.city.ilike(term) | Venue.category.ilike(term)
        )
    if category and category.strip():
        statement = statement.where(func.lower(Venue.category) == category.strip().lower())
    if city and city.strip():
        statement = statement.where(func.lower(Venue.city) == city.strip().lower())

    # NULL averages never match a sensory filter.
    if any(v is not None for v in (max_noise, min_light, max_light, max_crowd)):
        averages = (
            select(
                Review.venue_id.label("venue_id"),
                func.avg(Rating.noise_rating).label("noise"),
                func.avg(Rating.light_rating).label("light"),
                func.avg(Rating.crowd_rating).label("crowd"),
            )
            .join(Rating, Rating.review_id == Review.id)
            .group_by(Review.venue_id)
            .subquery()
        )
        statement = statement.join(averages, averages.c.venue_id == Venue.id)
        if max_noise is not None:
            statement = statement.where(averages.c.noise <= max_noise)
        if min_light is not None:
            statement = statement.where(averages.c.light >= min_light)
        if max_light is not None:
            statement = statement.where(averages.c.light <= max_light)
        if max_crowd is not None:
            statement = statement.where(averages.c.crowd <= max_crowd)

    total_items = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    if total_items == 0:
        return PaginatedVenues(
            items=[], total_items=0, page=1, page_size=page_size, total_pages=0,
            has_previous=False, has_next=False,
        )
    total_pages = (total_items + page_size - 1) // page_size
    page = min(page, total_pages)
    venues = db.scalars(
        statement.order_by(Venue.name.asc(), Venue.id.asc())
        .offset((page - 1) * page_size).limit(page_size)
    ).all()
    return PaginatedVenues(
        items=[build_venue_detail(db, venue) for venue in venues],
        total_items=total_items, page=page, page_size=page_size,
        total_pages=total_pages, has_previous=page > 1, has_next=page < total_pages,
    )


@router.get("/{place_id}", response_model=VenueDetail)
def get_place(
    place_id: Annotated[int, Path(ge=1)],
    db: Annotated[Session, Depends(get_db)],
) -> VenueDetail:
    venue = db.get(Venue, place_id)
    if venue is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return build_venue_detail(db, venue)
