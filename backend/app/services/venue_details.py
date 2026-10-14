from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import Rating, Review, Venue
from app.schemas import AccessibilitySummary, SensorySummary, VenueDetail, VenueSummary


def build_venue_detail(db: Session, venue: Venue) -> VenueDetail:
    ratings = db.execute(
        select(
            func.count(Rating.id),
            func.avg(Rating.noise_rating),
            func.avg(Rating.light_rating),
            func.avg(Rating.crowd_rating),
            func.count(Rating.noise_rating),
            func.count(Rating.light_rating),
            func.count(Rating.crowd_rating),
        )
        .join(Review, Rating.review_id == Review.id)
        .where(Review.venue_id == venue.id)
    ).one()
    reports = db.execute(
        select(
            func.count(Review.id),
            func.count(case((Review.wheelchair_accessible.is_(True), 1))),
            func.count(case((Review.wheelchair_accessible.is_(False), 1))),
            func.count(case((Review.wheelchair_accessible.is_(None), 1))),
        ).where(Review.venue_id == venue.id)
    ).one()
    averages = [None if value is None else round(float(value), 2) for value in ratings[1:4]]
    return VenueDetail(
        **VenueSummary.model_validate(venue).model_dump(),
        slug=venue.slug,
        description=venue.description,
        latitude=venue.latitude,
        longitude=venue.longitude,
        external_map_provider=venue.external_map_provider,
        external_map_id=venue.external_map_id,
        created_at=venue.created_at,
        updated_at=venue.updated_at,
        review_count=reports[0],
        sensory_summary=SensorySummary(
            ratings_count=ratings[0],
            noise_rating=averages[0],
            light_rating=averages[1],
            crowd_rating=averages[2],
            noise_count=ratings[4],
            light_count=ratings[5],
            crowd_count=ratings[6],
        ),
        accessibility_summary=AccessibilitySummary(
            accessible_reports=reports[1],
            inaccessible_reports=reports[2],
            unknown_reports=reports[3],
        ),
    )
