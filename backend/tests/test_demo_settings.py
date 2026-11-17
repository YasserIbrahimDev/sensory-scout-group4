from sqlalchemy import select

from app.config import Settings, get_settings
from app.main import app
from app.models import User, UserSettings


def enable_demo(enabled=True):
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=enabled)


def test_settings_disabled_by_default(client):
    enable_demo(False)
    assert client.get("/api/v1/demo/settings").status_code == 404


def test_settings_default_update_and_persist(client, db):
    enable_demo()
    assert client.get("/api/v1/demo/settings").json() == {"locationAccess": False}
    response = client.put("/api/v1/demo/settings", json={"locationAccess": True})
    assert response.status_code == 200
    assert response.json() == {"locationAccess": True}
    assert client.get("/api/v1/demo/settings").json() == {"locationAccess": True}
    user = db.scalar(select(User).where(User.email == "sensory-scout-demo@example.invalid"))
    row = db.scalar(select(UserSettings).where(UserSettings.user_id == user.id))
    assert row.location_access is True
    assert client.put("/api/v1/demo/settings", json={"locationAccess": False}).status_code == 200
    assert client.get("/api/v1/demo/settings").json() == {"locationAccess": False}


def test_settings_reject_invalid_payload(client):
    enable_demo()
    for payload in ({"locationAccess": "true"}, {"locationAccess": 1}, {"locationAccess": True, "extra": 1}):
        assert client.put("/api/v1/demo/settings", json=payload).status_code == 422
    assert client.get("/api/v1/demo/settings").json() == {"locationAccess": False}
