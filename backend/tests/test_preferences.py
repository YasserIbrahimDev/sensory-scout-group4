import pytest
from sqlalchemy import select

from app.models import SensoryProfile, User
from app.seed import seed_data
from app.services.preferences import Preferences, get_preferences, save_preferences


def test_read_existing_profile(db):
    seed_data(db)
    user = db.scalar(select(User).where(User.email == "scout.one@example.invalid"))
    assert get_preferences(db, user) == Preferences(1, 2, 1)


def test_save_updates_only_current_user_and_survives_reload(db):
    seed_data(db)
    first = db.scalar(select(User).where(User.email == "scout.one@example.invalid"))
    second = db.scalar(select(User).where(User.email == "scout.two@example.invalid"))
    before = get_preferences(db, second)
    save_preferences(db, first, Preferences(4, None, 3))
    db.commit()
    db.expire_all()
    assert get_preferences(db, first) == Preferences(4, None, 3)
    assert get_preferences(db, second) == before


def test_missing_profile_is_created_once(db):
    user = User(name="New User", email="new@example.invalid", password_hash="!disabled")
    db.add(user)
    db.commit()
    assert get_preferences(db, user) == Preferences()
    save_preferences(db, user, Preferences(2, 3, 4))
    save_preferences(db, user, Preferences(1, 2, 3))
    db.commit()
    assert get_preferences(db, user) == Preferences(1, 2, 3)
    profiles = db.scalars(
        select(SensoryProfile).where(SensoryProfile.user_id == user.id)
    ).all()
    assert len(profiles) == 1


@pytest.mark.parametrize("value", [0, 6, -1, 1.5, True, "3"])
def test_invalid_values_rejected(value):
    with pytest.raises(ValueError):
        Preferences(noise=value)


def test_invalid_payload_does_not_write(db):
    seed_data(db)
    user = db.scalar(select(User).where(User.email == "scout.one@example.invalid"))
    with pytest.raises(TypeError):
        save_preferences(db, user, {"noise": 5})
    assert get_preferences(db, user) == Preferences(1, 2, 1)
