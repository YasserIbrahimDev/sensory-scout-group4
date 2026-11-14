"""Persistence helpers for the authenticated user's sensory preferences.

Callers MUST resolve the user from a verified authentication context.
Never accept a client-supplied user ID as proof of identity.
No public API is exposed until the team implements authentication.
"""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SensoryProfile, User


@dataclass(frozen=True)
class Preferences:
    noise: int | None = None
    lighting: int | None = None
    crowd: int | None = None

    def __post_init__(self) -> None:
        for name in ("noise", "lighting", "crowd"):
            value = getattr(self, name)
            if value is not None and (type(value) is not int or not 1 <= value <= 5):
                raise ValueError(f"{name} must be an integer from 1 to 5 or None")


def get_preferences(db: Session, authenticated_user: User) -> Preferences:
    """Return persisted preferences or an unset profile without writing."""
    profile = db.scalar(
        select(SensoryProfile).where(SensoryProfile.user_id == authenticated_user.id)
    )
    if profile is None:
        return Preferences()
    return Preferences(profile.pref_noise, profile.pref_light, profile.pref_crowd)


def save_preferences(
    db: Session, authenticated_user: User, preferences: Preferences
) -> Preferences:
    """Upsert only the authenticated user's profile; caller owns the transaction."""
    if not isinstance(preferences, Preferences):
        raise TypeError("preferences must be a validated Preferences instance")
    profile = db.scalar(
        select(SensoryProfile).where(SensoryProfile.user_id == authenticated_user.id)
    )
    if profile is None:
        profile = SensoryProfile(user_id=authenticated_user.id)
        db.add(profile)
    profile.pref_noise = preferences.noise
    profile.pref_light = preferences.lighting
    profile.pref_crowd = preferences.crowd
    db.flush()
    return preferences
