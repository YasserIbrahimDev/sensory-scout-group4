from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Venue
from app.schemas import VenueDetail
from app.services.venue_details import build_venue_detail

router = APIRouter(prefix="/places", tags=["places"])

# Robert adds GET "" for listing. Soma extends that SAME route with search/filters.
# Sensory values come from ratings joined through reviews, not the venue table.


@router.get("/{place_id}", response_model=VenueDetail)
def get_place(
    place_id: Annotated[int, Path(ge=1)], db: Annotated[Session, Depends(get_db)]
) -> VenueDetail:
    venue = db.get(Venue, place_id)
    if venue is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return build_venue_detail(db, venue)
