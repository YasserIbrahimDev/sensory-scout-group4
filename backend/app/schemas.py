from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SensorySummary(BaseModel):
    ratings_count: int
    noise_rating: float | None
    light_rating: float | None
    crowd_rating: float | None
    noise_count: int
    light_count: int
    crowd_count: int


class AccessibilitySummary(BaseModel):
    accessible_reports: int
    inaccessible_reports: int
    unknown_reports: int


class VenueSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    address: str
    city: str
    image_url: str | None
    is_sample: bool


class VenueDetail(VenueSummary):
    slug: str
    description: str
    latitude: float | None
    longitude: float | None
    external_map_provider: str | None
    external_map_id: str | None
    created_at: datetime
    updated_at: datetime
    review_count: int
    sensory_summary: SensorySummary
    accessibility_summary: AccessibilitySummary


class PaginatedVenues(BaseModel):
    """Robert and Soma share this response for listing and sensory filtering."""

    items: list[VenueDetail]
    total_items: int
    page: int
    page_size: int
    total_pages: int
    has_previous: bool
    has_next: bool
