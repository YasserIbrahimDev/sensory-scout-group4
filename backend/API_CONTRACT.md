# Sensory Scout API Contract

Base URL for local development:

http://localhost:8000/api/v1

Responses use JSON. Place IDs are positive integers.

## 1. Get place details — implemented

### Request

GET /places/{place_id}

| Parameter | Location | Type | Required | Rule |
| --- | --- | --- | --- | --- |
| place_id | URL path | integer | Yes | Greater than or equal to 1 |

No request body or authentication token is required by the current endpoint.

Example:

GET http://localhost:8000/api/v1/places/1

### Success response

Status: 200 OK

Example values are illustrative; timestamps and IDs depend on the database.

```json
{
  "id": 1,
  "name": "Sample Willow Reading Room",
  "category": "library",
  "address": "1 Example Lane (fictional address)",
  "city": "Sample City",
  "image_url": null,
  "is_sample": true,
  "slug": "willow-reading-room",
  "description": "Fictional venue for testing Sensory Scout. Not a real destination.",
  "latitude": null,
  "longitude": null,
  "external_map_provider": null,
  "external_map_id": null,
  "created_at": "2026-10-14T14:00:00Z",
  "updated_at": "2026-10-14T14:00:00Z",
  "review_count": 2,
  "sensory_summary": {
    "ratings_count": 2,
    "noise_rating": 1.5,
    "light_rating": 2.5,
    "crowd_rating": 1.5,
    "noise_count": 2,
    "light_count": 2,
    "crowd_count": 2
  },
  "accessibility_summary": {
    "accessible_reports": 2,
    "inaccessible_reports": 0,
    "unknown_reports": 0
  }
}
```

### Frontend response models

All properties below are included in the response. A nullable property is
present with null when its value is unknown; it is not an optional property.

```typescript
export interface SensorySummary {
  ratings_count: number;
  noise_rating: number | null;
  light_rating: number | null;
  crowd_rating: number | null;
  noise_count: number;
  light_count: number;
  crowd_count: number;
}

export interface AccessibilitySummary {
  accessible_reports: number;
  inaccessible_reports: number;
  unknown_reports: number;
}

export interface VenueDetail {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  image_url: string | null;
  is_sample: boolean;
  slug: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  external_map_provider: string | null;
  external_map_id: string | null;
  created_at: string;
  updated_at: string;
  review_count: number;
  sensory_summary: SensorySummary;
  accessibility_summary: AccessibilitySummary;
}
```

### Field meanings

- Dates are ISO 8601 strings in JSON.
- noise_rating, light_rating, and crowd_rating are averages from review ratings.
- The scale is 1–5: quiet to loud, dim to bright, and sparse to crowded.
- A higher score means greater intensity; it does not mean a better place.
- Averages are rounded to two decimal places.
- Each attribute count includes only ratings with a known value for that attribute.
- ratings_count counts rating records. review_count counts reviews, including
  reviews without a rating record.
- Null means unknown. Do not display null as zero.
- Crowd ratings describe reported conditions, not live occupancy.
- Accessibility counts represent reviewer reports. They are not a verified
  accessibility certification.
- Coordinates are either both available or both null.
- external_map_id identifies a venue within external_map_provider.
  It is not an API key.
- Display a placeholder when image_url is null.
- is_sample=true identifies fictional development data.

### Errors

404 Not Found:

```json
{
  "detail": "Place not found"
}
```

422 Unprocessable Entity:

Returned when the ID is not a positive integer. The detail property is an array
of validation errors, rather than the string used for a 404.

Example for a noninteger ID:

```json
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "place_id"],
      "msg": "Input should be a valid integer, unable to parse string as an integer",
      "input": "abc"
    }
  ]
}
```

The frontend should handle network failures and other unsuccessful HTTP
responses with a general retry message. Do not assume every error response
contains JSON or a string detail.

## 2. List and search places — planned

Robert implements the base listing endpoint. Soma adds search and sensory
filters to the same endpoint.

GET /places

This endpoint is not implemented in the current starter. The following query
parameters are proposed for team agreement before implementation.

### Proposed request model

```typescript
export interface PlaceSearchParams {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  city?: string;
  max_noise?: number;
  min_light?: number;
  max_light?: number;
  max_crowd?: number;
}
```

Send these as URL query parameters, not as a JSON body.

| Parameter | Proposed rule |
| --- | --- |
| page | Integer at least 1; default 1 |
| page_size | Integer from 1 to 100; default 12 |
| q | Text search across name, category, city, and address; maximum 100 characters |
| category | Exact category match, ignoring case |
| city | City substring match, ignoring case |
| max_noise | Maximum average noise rating, from 1 to 5 |
| min_light | Minimum average light rating, from 1 to 5 |
| max_light | Maximum average light rating, from 1 to 5 |
| max_crowd | Maximum average crowd rating, from 1 to 5 |

Examples:

GET /places?page=1&page_size=12

GET /places?q=reading&max_noise=2&max_crowd=2

GET /places?min_light=2&max_light=4

Omit unused filters. Do not send the strings "null" or "undefined".
Build the query with URLSearchParams so text is encoded correctly.

### Response model

The backend already defines this response model, but the listing route still
needs implementation.

```typescript
export interface PaginatedVenues {
  items: VenueDetail[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}
```

Each item uses the same VenueDetail model documented above.

Example of an empty response:

```json
{
  "items": [],
  "total_items": 0,
  "page": 1,
  "page_size": 12,
  "total_pages": 0,
  "has_previous": false,
  "has_next": false
}
```

### Proposed behavior

- Apply search and filters before counting results and paginating.
- total_items is the number of matching venues, not the current page length.
- Combine different filters with AND.
- Filter sensory values using averages calculated from ratings through reviews.
- Exclude unknown averages when the corresponding sensory filter is supplied.
- With no sensory filter, include unrated venues.
- Reject min_light greater than max_light with a validation error.
- Use stable ordering by name, then ID.
- Clamp a page beyond the last available page to the last page.
- For no matches, return page 1 and zero total pages.
- Return each venue once, even when it has multiple reviews.

## 3. Frontend integration

- Browse/results cards use items from the listing response.
- Clicking a card sends its actual id to GET /places/{place_id}.
- Show loading, empty, missing-place, and request-failure states.
- Render sensory values from sensory_summary.
- Render accessibility report counts from accessibility_summary.
- The current details response does not include review comments or a reviews list.
- Authentication, profile updates, reviews, votes, and saved-place endpoints
  are not available yet.

Implemented API schemas can be checked at:

http://localhost:8000/docs

Machine-readable OpenAPI schema:

http://localhost:8000/openapi.json

Update this contract whenever an agreed request or response changes.