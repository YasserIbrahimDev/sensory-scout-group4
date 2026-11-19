"""Account isolation and authentication smoke tests using the existing SQLite fixture."""
from sqlalchemy import select

from app.models import Venue
from app.seed import seed_data

def test_register_login_logout_and_account_isolation(client, db):
    a = {"name": "Alice", "email": "alice@example.com", "password": "correct horse battery staple"}
    b = {"name": "Bob", "email": "bob@example.com", "password": "different long password 123"}
    assert client.get("/api/v1/users/me").status_code == 401
    first = client.post("/api/v1/auth/register", json=a)
    assert first.status_code == 201, first.text
    token_a = first.json()["access_token"]
    assert token_a
    assert client.post("/api/v1/auth/register", json=a).status_code == 409
    second = client.post("/api/v1/auth/register", json=b)
    assert second.status_code == 201, second.text
    token_b = second.json()["access_token"]
    headers_a = {"Authorization": "Bearer " + token_a}
    headers_b = {"Authorization": "Bearer " + token_b}

    assert client.get("/api/v1/users/me", headers=headers_a).json()["email"] == a["email"]
    assert client.get("/api/v1/users/me", headers=headers_b).json()["email"] == b["email"]
    assert client.post("/api/v1/auth/login", json={"email": a["email"], "password": "wrong"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": a["email"], "password": a["password"]}).status_code == 200

    assert client.put("/api/v1/users/me/settings", headers=headers_a, json={"locationAccess": True}).status_code == 200
    assert client.get("/api/v1/users/me/settings", headers=headers_b).json() == {"locationAccess": False}
    assert client.put("/api/v1/users/me/preferences", headers=headers_a, json={"noise": 2, "lighting": 3, "crowd": 1}).status_code == 200
    assert client.get("/api/v1/users/me/preferences", headers=headers_b).json()["preferences"]["noise"] is None

    assert client.post("/api/v1/auth/logout", headers=headers_a).status_code == 204
    assert client.get("/api/v1/users/me", headers=headers_a).status_code == 401
    assert client.get("/api/v1/users/me", headers=headers_b).status_code == 200


def test_disabled_fixture_accounts_cannot_log_in(client):
    assert client.post("/api/v1/auth/login", json={
        "email": "missing@example.com", "password": "some password"
    }).status_code == 401


def test_reject_weak_password_and_invalid_email(client):
    assert client.post("/api/v1/auth/register", json={
        "name": "Alice", "email": "invalid", "password": "short"
    }).status_code == 422

def test_favorites_are_private_and_persist_after_login(client, db):
    seed_data(db)
    venue_id = db.scalar(select(Venue.id).order_by(Venue.id).limit(1))
    assert venue_id is not None

    alice = {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "correct horse battery staple",
    }
    bob = {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "different long password 123",
    }

    alice_registration = client.post("/api/v1/auth/register", json=alice)
    bob_registration = client.post("/api/v1/auth/register", json=bob)
    assert alice_registration.status_code == 201, alice_registration.text
    assert bob_registration.status_code == 201, bob_registration.text

    alice_token = alice_registration.json()["access_token"]
    bob_token = bob_registration.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    favorites = "/api/v1/users/me/favorites"
    saved = client.put(f"{favorites}/{venue_id}", headers=alice_headers)
    assert saved.status_code == 204, saved.text

    bob_favorites = client.get(favorites, headers=bob_headers)
    assert bob_favorites.status_code == 200, bob_favorites.text
    assert bob_favorites.json() == []

    logout = client.post("/api/v1/auth/logout", headers=alice_headers)
    assert logout.status_code == 204, logout.text

    login = client.post(
        "/api/v1/auth/login",
        json={"email": alice["email"], "password": alice["password"]},
    )
    assert login.status_code == 200, login.text

    new_token = login.json()["access_token"]
    alice_favorites = client.get(
        favorites, headers={"Authorization": f"Bearer {new_token}"}
    )
    assert alice_favorites.status_code == 200, alice_favorites.text
    assert [venue["id"] for venue in alice_favorites.json()] == [venue_id]
