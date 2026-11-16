from sqlalchemy import select

from app.config import Settings, get_settings
from app.main import app
from app.models import SensoryProfile, User
from app.seed import seed_data


def enable_demo_api(enabled: bool = True):
    app.dependency_overrides[get_settings] = lambda: Settings(demo_mode_enabled=enabled)


def test_demo_routes_are_hidden_when_disabled(client):
    enable_demo_api(False)
    response = client.get("/api/v1/demo/preferences")
    assert response.status_code == 404


def test_preferences_are_read_saved_and_persisted(client, db):
    enable_demo_api()
    read_response = client.get("/api/v1/demo/preferences")
    assert read_response.status_code == 200
    assert read_response.json()["preferences"] == {
        "noise": None,
        "lighting": None,
        "crowd": None,
    }

    save_response = client.put(
        "/api/v1/demo/preferences",
        json={"noise": 1, "lighting": 2, "crowd": 1},
    )
    assert save_response.status_code == 200
    assert save_response.json()["preferences"] == {
        "noise": 1,
        "lighting": 2,
        "crowd": 1,
    }

    demo_user = db.scalar(
        select(User).where(User.email == "sensory-scout-demo@example.invalid")
    )
    profile = db.scalar(
        select(SensoryProfile).where(SensoryProfile.user_id == demo_user.id)
    )
    assert (profile.pref_noise, profile.pref_light, profile.pref_crowd) == (1, 2, 1)


def test_invalid_preference_payload_is_rejected_without_overwriting(client):
    enable_demo_api()
    client.put(
        "/api/v1/demo/preferences",
        json={"noise": 2, "lighting": 2, "crowd": 2},
    )
    response = client.put(
        "/api/v1/demo/preferences",
        json={"noise": True, "lighting": 6, "unexpected": 3},
    )
    assert response.status_code == 422
    current = client.get("/api/v1/demo/preferences").json()["preferences"]
    assert current == {"noise": 2, "lighting": 2, "crowd": 2}


def test_recommendations_return_ranked_venue_details(client, db):
    enable_demo_api()
    seed_data(db)
    client.put(
        "/api/v1/demo/preferences",
        json={"noise": 1, "lighting": 2, "crowd": 1},
    )
    response = client.get("/api/v1/demo/recommendations", params={"limit": 5})
    assert response.status_code == 200
    payload = response.json()
    assert payload["demo_user"] == "Sensory Scout Development Demo"
    assert len(payload["items"]) <= 5
    assert all(item["venue"]["id"] > 0 for item in payload["items"])
    assert all(item["reason"] and item["score"] > 0 for item in payload["items"])


def test_recommendations_empty_until_preferences_are_saved(client):
    enable_demo_api()
    response = client.get("/api/v1/demo/recommendations")
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_recommendation_limit_is_validated(client):
    enable_demo_api()
    response = client.get("/api/v1/demo/recommendations", params={"limit": 0})
    assert response.status_code == 422


def test_demo_identity_does_not_reuse_an_enabled_account(client, db):
    enable_demo_api()
    db.add(
        User(
            name="Existing Account",
            email="sensory-scout-demo@example.invalid",
            password_hash="not-the-demo-marker",
        )
    )
    db.commit()
    response = client.get("/api/v1/demo/preferences")
    assert response.status_code == 409
