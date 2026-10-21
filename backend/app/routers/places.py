from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Venue
from app.schemas import PaginatedVenues, VenueDetail
from app.services.venue_details import build_venue_detail

router = APIRouter(prefix="/places", tags=["places"])

# Robert adds GET "" for listing. Soma extends that SAME route with search/filters.
# Sensory values come from ratings joined through reviews, not the venue table.
@router.get("", response_model=PaginatedVenues)
def list_places(
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 12,
) -> PaginatedVenues:
    total_items = db.scalar(select(func.count()).select_from(Venue)) or 0

    if total_items == 0:
        return PaginatedVenues(
            items=[],
            total_items=0,
            page=1,
            page_size=page_size,
            total_pages=0,
            has_previous=False,
            has_next=False,
        )

    total_pages = (total_items + page_size - 1) // page_size
    page = min(page, total_pages)

    venues = db.scalars(
        select(Venue)
        .order_by(Venue.name.asc(), Venue.id.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return PaginatedVenues(
        items=[build_venue_detail(db, venue) for venue in venues],
        total_items=total_items,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_previous=page > 1,
        has_next=page < total_pages,
    )

@router.get("/{place_id}", response_model=VenueDetail)
def get_place(
    place_id: Annotated[int, Path(ge=1)], db: Annotated[Session, Depends(get_db)]
) -> VenueDetail:
    venue = db.get(Venue, place_id)
    if venue is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return build_venue_detail(db, venue)
