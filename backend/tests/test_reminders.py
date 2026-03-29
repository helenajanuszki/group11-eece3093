#region Creating
def test_reminder_creation_success(client, admin_user, admin_token):
    res = client.post("/reminders", json={
        "title": "test",
        "description": "desc",
        "due_date": "2026-12-25T11:59:00",
        "creator": admin_user.id,
        "recipients": []
    }, headers=admin_token)

    assert res.status_code == 201

def test_reminder_creation_forbidden(client, existing_user, student_token):
    res = client.post("/reminders", json={
        "title": "test",
        "description": "desc",
        "due_date": "2026-12-25T11:59:00",
        "creator": existing_user.id,
        "recipients": []
    }, headers=student_token)

    assert res.status_code == 403

def test_reminder_creation_no_data(client, admin_token):
    res = client.post("/reminders", json={}, headers=admin_token)

    assert res.status_code == 400

def test_reminder_creation_no_title(client, admin_user, admin_token):
    res = client.post("/reminders", json={
        "description": "desc",
        "due_date": "2026-12-25T11:59:00",
        "creator": admin_user.id,
        "recipients": []
    }, headers=admin_token)

    assert res.status_code == 400

def test_reminder_creation_invalid_date_time(client, admin_user, admin_token):
    res = client.post("/reminders", json={
        "title": "test",
        "description": "desc",
        "due_date": "2026-12-25T",
        "creator": admin_user.id,
        "recipients": []
    }, headers=admin_token)

    assert res.status_code == 400

def test_reminder_creation_invalid_recipients_type(client, admin_user, admin_token):
    res = client.post("/reminders", json={
        "title": "test",
        "description": "desc",
        "due_date": "2026-12-25T11:59:00",
        "creator": admin_user.id,
        "recipients": "1, 2, 4"
    }, headers=admin_token)

    assert res.status_code == 400
#endregion

#region Reading
def test_get_reminders_student_success(client, student_token):
    res = client.get("/reminders", headers=student_token)

    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_get_reminders_admin_success(client, admin_token):
    res = client.get("/reminders", headers=admin_token)

    assert res.status_code == 200
    assert isinstance(res.get_json(), list)
#endregion

#region Editing
def test_edit_reminder_success(client, admin_token, admin_reminder):
    res = client.put(f"/reminders/{admin_reminder}", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T11:59:00",
        "recipients": [1, 2]
    }, headers=admin_token)

    assert res.status_code == 200

def test_edit_reminder_student_forbidden(client, admin_reminder, student_token):
    res = client.put(f"/reminders/{admin_reminder}", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T11:59:00",
        "recipients": [1, 2]
    }, headers=student_token)

    assert res.status_code == 403

def test_edit_reminder_admin_forbidden(client, admin_reminder, other_admin_token):
    res = client.put(f"/reminders/{admin_reminder}", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T11:59:00",
        "recipients": [1, 2]
    }, headers=other_admin_token)

    assert res.status_code == 403

def test_edit_reminder_no_data(client, admin_token, admin_reminder):
    res = client.put(f"/reminders/{admin_reminder}", json = {}, headers=admin_token)

    assert res.status_code == 400

def test_edit_reminder_not_found(client, admin_token):
    res = client.put(f"/reminders/999", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T11:59:00",
        "recipients": [1, 2]
    }, headers=admin_token)

    assert res.status_code == 404

def test_edit_reminder_invalid_date_time(client, admin_token, admin_reminder):
    res = client.put(f"/reminders/{admin_reminder}", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T",
        "recipients": [1, 2]
    }, headers=admin_token)

    assert res.status_code == 400

def test_edit_reminder_invalid_recipients_type(client, admin_token, admin_reminder):
    res = client.put(f"/reminders/{admin_reminder}", json = {
        "title": "titleChange",
        "description": "descChange",
        "due_date": "2027-01-01T11:59:00",
        "recipients": "1, 2, 4"
    }, headers=admin_token)

    assert res.status_code == 400
#endregion

#region Deleting
def test_delete_reminder_success(client, admin_token, admin_reminder):
    res = client.delete(f"/reminders/{admin_reminder}", headers = admin_token)

    assert res.status_code == 204

def test_delete_reminder_student_forbidden(client, student_token, admin_reminder):
    res = client.delete(f"/reminders/{admin_reminder}", headers = student_token)

    assert res.status_code == 403

def test_delete_reminder_admin_forbidden(client, other_admin_token, admin_reminder):
    res = client.delete(f"/reminders/{admin_reminder}", headers = other_admin_token)

    assert res.status_code == 403

def test_delete_reminder_not_found(client, admin_token):
    res = client.delete(f"/reminders/999", headers = admin_token)

    assert res.status_code == 404
#endregion