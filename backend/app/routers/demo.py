"""Development-only API for the single configured Sensory Scout demo user.

This router is deliberately not an authentication system. The identity is
resolved exclusively from server configuration; clients cannot supply a user ID.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import SensoryProfile, User, Venue
from app.schemas import (
    DemoPreferences,
    DemoPreferencesResponse,
    DemoRecommendationsResponse,
    RecommendedVenue,
)
from app.services.preferences import Preferences, get_preferences, save_preferences
from app.services.recommendations import rank_venues
from app.services.venue_details import build_venue_detail

router = APIRouter(prefix="/demo", tags=["development demo"])
DEMO_PASSWORD_MARKER = "!disabled-demo-account"


def get_demo_user(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """Resolve or create the one server-configured demo identity."""
    if not settings.demo_mode_enabled:
        raise HTTPException(status_code=404, detail="Not found")

    email = settings.demo_user_email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is not None:
        if user.password_hash != DEMO_PASSWORD_MARKER:
            raise HTTPException(
                status_code=409,
                detail="Configured demo identity conflicts with an existing account",
            )
        return user

    user = User(
        name=settings.demo_user_name,
        email=email,
        password_hash=DEMO_PASSWORD_MARKER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/preferences", response_model=DemoPreferencesResponse)
def read_demo_preferences(
    user: Annotated[User, Depends(get_demo_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DemoPreferencesResponse:
    preferences = get_preferences(db, user)
    return DemoPreferencesResponse(
        demo_user=user.name,
        preferences=DemoPreferences(
            noise=preferences.noise,
            lighting=preferences.lighting,
            crowd=preferences.crowd,
        ),
    )


@router.put("/preferences", response_model=DemoPreferencesResponse)
def update_demo_preferences(
    payload: DemoPreferences,
    user: Annotated[User, Depends(get_demo_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DemoPreferencesResponse:
    preferences = Preferences(
        noise=payload.noise,
        lighting=payload.lighting,
        crowd=payload.crowd,
    )
    saved = save_preferences(db, user, preferences)
    db.commit()
    return DemoPreferencesResponse(
        demo_user=user.name,
        preferences=DemoPreferences(
            noise=saved.noise,
            lighting=saved.lighting,
            crowd=saved.crowd,
        ),
    )


@router.get("/recommendations", response_model=DemoRecommendationsResponse)
def read_demo_recommendations(
    user: Annotated[User, Depends(get_demo_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=100)] = 3,
) -> DemoRecommendationsResponse:
    profile = db.scalar(
        select(SensoryProfile).where(SensoryProfile.user_id == user.id)
    )
    if profile is None:
        return DemoRecommendationsResponse(demo_user=user.name, items=[])

    ranked = rank_venues(db, profile, limit=limit)
    items = []
    for recommendation in ranked:
        venue = db.get(Venue, recommendation.venue_id)
        if venue is not None:
            items.append(
                RecommendedVenue(
                    venue=build_venue_detail(db, venue),
                    score=recommendation.score,
                    reason=recommendation.reason,
                )
            )
    return DemoRecommendationsResponse(demo_user=user.name, items=items)
