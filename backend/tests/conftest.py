import pytest
from config import create_app, db as test_db
from models import User, Role, JournalEntry, TaskPriority, Reminder
from werkzeug.security import generate_password_hash
from datetime import date, datetime

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

@pytest.fixture
def other_user_task(app, client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
        "title": "Test",
        "description": "Testing",
        "due_date": "2000-01-01T11:59",
        "priority": TaskPriority.medium.value,
    }, headers=other_user_list["token"])

    return {
        "id": res.get_json()["id"],
        "list_id": other_user_list["id"],
        "token": other_user_list["token"]
    }

@pytest.fixture
def admin_user(app):
    admin = User(
        username="testadmin",
        email="admin@test.com",
        password=generate_password_hash("password123"),
        role=Role.admin
    )
    test_db.session.add(admin)
    test_db.session.commit()
    return admin

@pytest.fixture
def admin_token(client, admin_user):
    res = client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "password123"
    })
    return {"Authorization": f"Bearer {res.get_json()['token']}"}

@pytest.fixture
def other_admin_user(app):
    admin = User(
        username="othertestadmin",
        email="otheradmin@test.com",
        password=generate_password_hash("password123"),
        role=Role.admin
    )
    test_db.session.add(admin)
    test_db.session.commit()
    return admin

@pytest.fixture
def other_admin_token(client, other_admin_user):
    res = client.post("/auth/login", json={
        "email": "otheradmin@test.com",
        "password": "password123"
    })
    return {"Authorization": f"Bearer {res.get_json()['token']}"}

@pytest.fixture
def admin_reminder(app, admin_user):
    reminder = Reminder(
        title = "Test",
        description = "Test Reminder",
        due_date = datetime(2026, 12, 25, 11, 59, 0),
        creator = admin_user.id,
        recipients = []
    )

    test_db.session.add(reminder)
    test_db.session.commit()

    return reminder.id