import pytest
from config import create_app, db as test_db
from models import User
from werkzeug.security import generate_password_hash

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
        role="student"
    )
    test_db.session.add(user)
    test_db.session.commit()
    return user