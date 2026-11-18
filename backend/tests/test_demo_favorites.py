from sqlalchemy import select

from app.config import Settings, get_settings
from app.main import app
from app.models import SavedPlace, User, Venue
from app.seed import seed_data


def enable_demo():
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=True)


def test_favorites_disabled_without_demo_mode(client):
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=False)
    assert client.get("/api/v1/demo/favorites").status_code == 404


def test_favorites_add_list_remove_and_idempotency(client, db):
    enable_demo()
    seed_data(db)
    venue_id = db.scalar(select(Venue.id).order_by(Venue.id))
    path = f"/api/v1/demo/favorites/{venue_id}"
    assert client.get("/api/v1/demo/favorites").json() == []
    assert client.put(path).status_code == 204
    assert client.put(path).status_code == 204
    listed = client.get("/api/v1/demo/favorites")
    assert listed.status_code == 200
    assert [venue["id"] for venue in listed.json()] == [venue_id]
    demo = db.scalar(select(User).where(User.email == "sensory-scout-demo@example.invalid"))
    assert len(db.scalars(select(SavedPlace).where(SavedPlace.user_id == demo.id)).all()) == 1
    assert client.delete(path).status_code == 204
    assert client.delete(path).status_code == 204
    assert client.get("/api/v1/demo/favorites").json() == []


def test_favorites_unknown_venue_rejected(client):
    enable_demo()
    assert client.put("/api/v1/demo/favorites/999999").status_code == 404
    assert client.put("/api/v1/demo/favorites/0").status_code == 422


def test_favorites_do_not_include_other_users_saves(client, db):
    enable_demo()
    seed_data(db)
    assert client.get("/api/v1/demo/favorites").json() == []
    other = db.scalar(select(SavedPlace).limit(1))
    assert other is not None
    assert client.put(f"/api/v1/demo/favorites/{other.venue_id}").status_code == 204
    assert len(client.get("/api/v1/demo/favorites").json()) == 1
