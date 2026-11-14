"""Deterministic recommendation ranking over reported venue sensory averages.

This service does not authenticate users or mutate preferences. Callers must
load a profile belonging to the authenticated user before using it.
Missing sensory reports never count as matches.
"""
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import SensoryProfile, Venue
from app.services.venue_details import build_venue_detail


@dataclass(frozen=True)
class RankedVenue:
    venue_id: int
    score: int
    reason: str


def rank_venues(db: Session, profile: SensoryProfile, limit: int = 3) -> list[RankedVenue]:
    """Return venues with at least one exact match and no strong conflicts.

    Ratings and preferences use the same 1–5 scale. A one-level difference
    is tolerated, but never counted as an exact match. Missing data incurs
    a ranking penalty and cannot independently qualify a venue.
    """
    if not 1 <= limit <= 100:
        raise ValueError("limit must be between 1 and 100")
    chosen = {
        "noise": profile.pref_noise,
        "lighting": profile.pref_light,
        "crowd": profile.pref_crowd,
    }
    chosen = {key: value for key, value in chosen.items() if value is not None}
    if not chosen:
        return []

    results: list[tuple[int, int, int, str, RankedVenue]] = []
    for venue in db.scalars(select(Venue).order_by(Venue.name, Venue.id)):
        summary = build_venue_detail(db, venue).sensory_summary
        observed = {
            "noise": summary.noise_rating,
            "lighting": summary.light_rating,
            "crowd": summary.crowd_rating,
        }
        matches: list[str] = []
        unknown = 0
        near = 0
        conflict = False
        for key, preferred in chosen.items():
            value = observed[key]
            if value is None:
                unknown += 1
            elif abs(value - preferred) < 0.5:
                matches.append(key)
            elif abs(value - preferred) <= 1.0:
                near += 1
            else:
                conflict = True
                break
        if conflict or not matches:
            continue
        score = 100 * len(matches) - 10 * unknown - 5 * near
        reason = "Matches your " + ", ".join(matches) + " preference" + ("s" if len(matches) > 1 else "")
        if unknown:
            reason += "; some sensory ratings are not reported"
        results.append((-len(matches), unknown, near, venue.name, RankedVenue(venue.id, score, reason)))
    results.sort(key=lambda item: (item[0], item[1], item[2], item[3], item[4].venue_id))
    return [item[4] for item in results[:limit]]
