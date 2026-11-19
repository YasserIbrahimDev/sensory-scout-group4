import json

from sqlalchemy import func, select

from app.models import Rating, Review, Venue
from app.seed import SEED_FILE, seed_data


def test_map_fixture_locations_and_sources():
    data = json.loads(SEED_FILE.read_text())
    sources = json.loads((SEED_FILE.parent / 'venue_location_sources.json').read_text())
    venues = {v['slug']: v for v in data['venues']}
    assert len(venues) == 37
    assert len(sources['locations']) == 31
    for venue in venues.values():
        assert 33.1 < venue['latitude'] < 33.35
        assert -97.25 < venue['longitude'] < -97.0
        assert 'street address not verified' not in venue['address']
    for row in sources['locations']:
        assert row['latitude'] == venues[row['slug']]['latitude']
        assert row['longitude'] == venues[row['slug']]['longitude']
        assert row['coordinate_source']
    assert len(data['reviews']) == len(data['ratings']) == 111
    for a, b in [('historical-park', 'bayless-selby-house'),
                 ('historical-park', 'quakertown-house-museum'),
                 ('patterson-appleton-arts-center', 'greater-denton-arts-council'),
                 ('north-lakes-park', 'north-lakes-park-trail')]:
        assert (venues[a]['latitude'], venues[a]['longitude']) == (venues[b]['latitude'], venues[b]['longitude'])
    assert 'pause in operations' in venues['explorium-childrens-museum']['description']


def test_seed_backfills_locations_preserving_ids_and_counts(client, db):
    seed_data(db)
    venues = db.scalars(select(Venue)).all()
    ids = {v.slug: v.id for v in venues}
    for venue in venues:
        venue.latitude = venue.longitude = None
    db.commit()
    assert all(n == 0 for n in seed_data(db).values())
    db.expire_all()
    venues = db.scalars(select(Venue)).all()
    assert {v.slug: v.id for v in venues} == ids
    assert all(v.latitude is not None and v.longitude is not None for v in venues)
    assert db.scalar(select(func.count()).select_from(Review)) == 111
    assert db.scalar(select(func.count()).select_from(Rating)) == 111
    response = client.get('/api/v1/places?page_size=100')
    assert response.status_code == 200
    assert response.json()['total_items'] == 37
    assert all(v['latitude'] is not None and v['longitude'] is not None for v in response.json()['items'])
    assert all(n == 0 for n in seed_data(db).values())
