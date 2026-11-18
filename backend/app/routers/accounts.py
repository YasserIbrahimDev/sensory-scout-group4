"""Authenticated account and personalized Sensory Scout endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_session, hash_password, issue_token, verify_password
from app.database import get_db
from app.models import AuthSession, SavedPlace, SensoryProfile, User, UserSettings, Venue
from app.schemas import DemoPreferences, RecommendedVenue, VenueDetail
from app.services.preferences import Preferences, get_preferences, save_preferences
from app.services.recommendations import rank_venues
from app.services.venue_details import build_venue_detail

router = APIRouter(tags=["authenticated users"])


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class SettingsPayload(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    locationAccess: bool = False


class PreferencesResponse(BaseModel):
    preferences: DemoPreferences


class RecommendationsResponse(BaseModel):
    items: list[RecommendedVenue]


@router.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    email = str(payload.email).strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    db.refresh(user)
    return TokenResponse(access_token=issue_token(db, user))


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.scalar(select(User).where(User.email == str(payload.email).strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=issue_token(db, user))


@router.post("/auth/logout", status_code=204)
def logout(session: Annotated[AuthSession, Depends(get_session)], db: Annotated[Session, Depends(get_db)]):
    db.delete(session)
    db.commit()


@router.get("/users/me", response_model=UserResponse)
def me(user: Annotated[User, Depends(get_current_user)]):
    return UserResponse(id=user.id, name=user.name, email=user.email)


@router.get("/users/me/preferences", response_model=PreferencesResponse)
def read_preferences(user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prefs = get_preferences(db, user)
    return PreferencesResponse(preferences=DemoPreferences(noise=prefs.noise, lighting=prefs.lighting, crowd=prefs.crowd))


@router.put("/users/me/preferences", response_model=PreferencesResponse)
def write_preferences(payload: DemoPreferences, user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    prefs = save_preferences(db, user, Preferences(noise=payload.noise, lighting=payload.lighting, crowd=payload.crowd))
    db.commit()
    return PreferencesResponse(preferences=DemoPreferences(noise=prefs.noise, lighting=prefs.lighting, crowd=prefs.crowd))


@router.get("/users/me/recommendations", response_model=RecommendationsResponse)
def recommendations(user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)], limit: Annotated[int, Query(ge=1, le=100)] = 3):
    profile = db.scalar(select(SensoryProfile).where(SensoryProfile.user_id == user.id))
    if profile is None:
        return RecommendationsResponse(items=[])
    items = []
    for result in rank_venues(db, profile, limit=limit):
        venue = db.get(Venue, result.venue_id)
        if venue is not None:
            items.append(RecommendedVenue(venue=build_venue_detail(db, venue), score=result.score, reason=result.reason))
    return RecommendationsResponse(items=items)


@router.get("/users/me/favorites", response_model=list[VenueDetail])
def favorites(user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    venues = db.scalars(select(Venue).join(SavedPlace, SavedPlace.venue_id == Venue.id).where(SavedPlace.user_id == user.id).order_by(SavedPlace.saved_at.desc(), SavedPlace.id.desc())).all()
    return [build_venue_detail(db, venue) for venue in venues]


@router.put("/users/me/favorites/{place_id}", status_code=204)
def add_favorite(place_id: Annotated[int, Path(ge=1)], user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    if db.get(Venue, place_id) is None:
        raise HTTPException(status_code=404, detail="Place not found")
    if db.scalar(select(SavedPlace.id).where(SavedPlace.user_id == user.id, SavedPlace.venue_id == place_id)) is None:
        db.add(SavedPlace(user_id=user.id, venue_id=place_id))
        db.commit()


@router.delete("/users/me/favorites/{place_id}", status_code=204)
def remove_favorite(place_id: Annotated[int, Path(ge=1)], user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    saved = db.scalar(select(SavedPlace).where(SavedPlace.user_id == user.id, SavedPlace.venue_id == place_id))
    if saved is not None:
        db.delete(saved)
        db.commit()


@router.get("/users/me/settings", response_model=SettingsPayload)
def read_settings(user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    row = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id))
    return SettingsPayload(locationAccess=row.location_access if row else False)


@router.put("/users/me/settings", response_model=SettingsPayload)
def write_settings(payload: SettingsPayload, user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]):
    row = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id))
    if row is None:
        db.add(UserSettings(user_id=user.id, location_access=payload.locationAccess))
    else:
        row.location_access = payload.locationAccess
    db.commit()
    return payload
