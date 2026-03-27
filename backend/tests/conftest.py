import pytest
from config import create_app, db as test_db
from models import User, Role, JournalEntry
from werkzeug.security import generate_password_hash
from datetime import date

@pytest.fixture
def app():
    app = create_app(test_config=True)
    with app.app_context():
        test_db.create_all()
        yield app
        test_db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def existing_user(app):
    user = User(
        username="teststudent",
        email="student@test.com",
        password=generate_password_hash("password123"),
        role=Role.student
    )
    test_db.session.add(user)
    test_db.session.commit()
    return user

@pytest.fixture
def student_token(client, existing_user):
    res = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "password123"
    })
    return {"Authorization": f"Bearer {res.get_json()['token']}"}

@pytest.fixture
def existing_journal_entry(app, existing_user):
    entry = JournalEntry(
        date=date(2000, 1, 1),
        mood=1,
        content="I'm a martian with an army of Spartans",
        user_id=existing_user.id
    )
    test_db.session.add(entry)
    test_db.session.commit()
    
    return entry.id

@pytest.fixture
def other_user_entry(app):
    other = User(
        username="other",
        email="other@test.com",
        password=generate_password_hash("password123"),
        role=Role.student
    )
    test_db.session.add(other)
    test_db.session.commit()

    entry = JournalEntry(
        date=date(2000, 1, 1),
        mood=3,
        content="Against the canvas of the night appears a curious celestial phenomenon",
        user_id=other.id
    )
    test_db.session.add(entry)
    test_db.session.commit()
    
    return entry.id

@pytest.fixture
def other_user_list(app, client):
    client.post("/auth/register", json={
        "username": "yetanotherstudent",
        "email": "anotherstudent@test.com",
        "password": "password123"
    })

    res = client.post("/auth/login", json={
        "email": "anotherstudent@test.com",
        "password": "password123"
    })
    token = {"Authorization": f"Bearer {res.get_json()['token']}"}

    post_res = client.post("/lists", json={
        "name": "Test",
        "description": "testing"
    }, headers=token)
    return {"id": post_res.get_json()["id"], "token": token}