from models import User

def test_register_success(client):
    res = client.post("/auth/register", json={
        "username": "newstudent",
        "email": "new@test.com",
        "password": "password123"
    })

    assert res.status_code == 201
    data = res.get_json()
    assert data["email"] == "new@test.com"
    assert data["username"] == "newstudent"
    assert data["role"] == "student"
    assert "password" not in data

def test_register_missing_email(client):
    res = client.post("/auth/register", json={
        "username": "newstudent",
        "password": "password123"
    })

    assert res.status_code == 400

def test_register_missing_password(client):
    res = client.post("/auth/register", json={
        "username": "newstudent",
        "email": "new@test.com"
    })

    assert res.status_code == 400

def test_register_missing_username(client):
    res = client.post("/auth/register", json={
        "email": "new@test.com",
        "password": "password123"
    })

    assert res.status_code == 400

def test_register_duplicate_email(client, existing_user):
    res = client.post("/auth/register", json={
        "username": "anotherstudent",
        "email": "student@test.com",
        "password": "password123"
    })

    assert res.status_code == 409

def test_register_with_phone_number(client):
    res = client.post("/auth/register", json={
        "username": "newstudent",
        "email": "new@test.com",
        "password": "password123",
        "phone_number": "555-1234"
    })

    assert res.status_code == 201
    assert res.get_json()["phone_number"] == "555-1234"

def test_register_without_phone_number(client):
    res = client.post("/auth/register", json={
        "username": "newstudent",
        "email": "new@test.com",
        "password": "password123"
    })

    assert res.status_code == 201

def test_register_empty_body(client):
    res = client.post("/auth/register", json={})

    assert res.status_code == 400

def test_register_no_body(client):
    res = client.post("/auth/register")

    assert res.status_code == 400

#region Login
def test_login_success(client, existing_user):
    res = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "password123"
    })

    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == "student@test.com"
    assert "password" not in data["user"]

def test_login_wrong_password(client, existing_user):
    res = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "wrongpassword"
    })

    assert res.status_code == 401

def test_login_wrong_email(client, existing_user):
    res = client.post("/auth/login", json={
        "email": "wrong@test.com",
        "password": "password123"
    })

    assert res.status_code == 401

def test_login_missing_password(client):
    res = client.post("/auth/login", json={
        "email": "student@test.com"
    })

    assert res.status_code == 400

def test_login_missing_email(client):
    res = client.post("/auth/login", json={
        "password": "password123"
    })

    assert res.status_code == 400

def test_login_empty_body(client):
    res = client.post("/auth/login", json={})

    assert res.status_code == 400

def test_login_no_body(client):
    res = client.post("/auth/login")

    assert res.status_code == 400

def test_login_returns_valid_token(client, existing_user):
    res = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "password123"
    })

    token = res.get_json().get("token")
    assert token is not None
    assert len(token) > 0