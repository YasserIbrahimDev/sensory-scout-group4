"""Account isolation and authentication smoke tests using the existing SQLite fixture."""
from app.models import Venue


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
