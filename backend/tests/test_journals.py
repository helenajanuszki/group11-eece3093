#region Creation
def test_journal_creation_success(client, student_token):
    res = client.post("/journal", json={
        "date": "2000-01-01",
        "mood": 1,
        "content": "What would you do if you weren't afraid?"
    }, headers=student_token)

    assert res.status_code == 201
    data = res.get_json()
    assert data["mood"] == 1
    assert data["date"] == "2000-01-01"
    assert data["content"] == "What would you do if you weren't afraid?"
    assert data["user_id"] is not None

def test_journal_creation_no_mood(client, student_token):
    res = client.post("/journal", json={
        "date": "2000-01-01",
        "content": "Carpe diem, sieze the day, I can't compromise"
    }, headers=student_token)

    assert res.status_code == 400

def test_journal_creation_no_date(client, student_token):
    res = client.post("/journal", json={
        "mood": 1,
        "content": "I'll see you soon but I'll talk to you sooner"
    }, headers=student_token)

    assert res.status_code == 400

def test_journal_creation_no_data(client, student_token):
    res = client.post("/journal", json={}, headers=student_token)

    assert res.status_code == 400

def test_journal_creation_no_auth(client):
    res = client.post("/journal", json={
        "date": "2000-01-01",
        "mood": 1,
        "content": "Taking up time with the silly silly games we play"
    })

    assert res.status_code == 401

def test_journal_creation_invalid_mood(client, student_token):
    res = client.post("/journal", json={
        "date": "2000-01-01",
        "mood": 999,
        "content": "The Spiderman is having you for dinner tonight"
    }, headers=student_token)

    assert res.status_code == 400

def test_journal_creation_invalid_date_format(client, student_token):
        res = client.post("/journal", json={
        "date": "September 25, 1890",
        "mood": 1,
        "content": "When evening falls she'll run to me"}, headers=student_token)

        assert res.status_code == 400
#endregion

#region Reading
def test_get_journal_success(client, student_token):
    res = client.get("/journal", headers=student_token)
    
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_get_journal_empty(client, student_token):
    res = client.get("/journal", headers=student_token)
    
    assert res.status_code == 200
    assert res.get_json() == []

def test_get_after_creation(client, student_token):
    post = client.post("/journal", json={
        "date": "2000-01-01",
        "mood": 1,
        "content": "Now tell my momma I love her, but this what I like"
    }, headers=student_token)

    res = client.get("/journal", headers=student_token)
    
    assert res.status_code == 200
    data = res.get_json()
    assert data[0]["date"] == "2000-01-01"
    assert len(data) == 1
    assert data[0]["mood"] == 1

def test_get_entry_not_found(client, student_token):
    res = client.get("/journal/999", headers=student_token)
    
    assert res.status_code == 404

def test_get_entry_wrong_user(client, student_token, other_user_entry, app):
    res = client.get(f"/journal/{other_user_entry}", headers=student_token)
    
    assert res.status_code == 403

def test_get_specific_entry(client, student_token, existing_journal_entry):
    res = client.get(f"/journal/{existing_journal_entry}", headers=student_token)

    assert res.status_code == 200
#endregion

#region Editing
def test_edit_entry_success(client, student_token, existing_journal_entry):
    res = client.put(f"/journal/{existing_journal_entry}", json={
        "mood": 5,
        "content": "Land where you stay forever"}, headers=student_token)
    
    assert res.status_code == 200
    assert res.get_json()["mood"] == 5
    assert res.get_json()["content"] == "Land where you stay forever"

def test_edit_entry_not_found(client, student_token):
    res = client.put("/journal/999", json={"mood": 3}, headers=student_token)
    
    assert res.status_code == 404

def test_edit_entry_wrong_user(client, student_token, other_user_entry, app):
    res = client.put(f"/journal/{other_user_entry}", json={"mood": 3}, headers=student_token)
    
    assert res.status_code == 403

#region Deleting
def test_delete_success(client, student_token, existing_journal_entry):
    res = client.delete(f"/journal/{existing_journal_entry}", headers=student_token)

    assert res.status_code == 204

def test_delete_entry_not_found(client, student_token):
    res = client.delete("/journal/999", headers=student_token)

    assert res.status_code == 404

def test_delete_wrong_user(client, student_token, other_user_entry):
    res = client.delete(f"/journal/{other_user_entry}", headers=student_token)
    
    assert res.status_code == 403
#endregion