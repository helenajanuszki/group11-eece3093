def test_get_students_success(client, admin_token):
    res = client.get("/admin/users", headers=admin_token)
    
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_get_students_no_auth(client):
    res = client.get("/admin/users")
    
    assert res.status_code == 401

def test_get_students_forbidden(client, student_token):
    res = client.get("/admin/users", headers=student_token)
    
    assert res.status_code == 403

def test_get_student_success(client, admin_token, admin_user, existing_user, app):
    client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    res = client.get(f"/admin/users/{existing_user.id}", headers=admin_token)
    
    assert res.status_code == 200

def test_get_student_not_found(client, admin_token):
    res = client.get("/admin/users/999", headers=admin_token)
    
    assert res.status_code == 404

def test_get_student_forbidden(client, admin_token, other_admin_token, existing_user, app):
    client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    res = client.get(f"/admin/users/{existing_user.id}", headers=other_admin_token)
    
    assert res.status_code == 403

def test_assign_student_success(client, admin_token, existing_user):
    res = client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    
    assert res.status_code == 200

def test_assign_student_not_found(client, admin_token):
    res = client.put("/admin/users/999/assign", headers=admin_token)
    
    assert res.status_code == 404

def test_assign_student_already_assigned(client, admin_token, existing_user):
    client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    res = client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    
    assert res.status_code == 400

def test_assign_admin_forbidden(client, admin_token, other_admin_user):
    res = client.put(f"/admin/users/{other_admin_user.id}/assign", headers=admin_token)
    
    assert res.status_code == 400

def test_assign_task_success(client, admin_token, existing_user, app):
    client.put(f"/admin/users/{existing_user.id}/assign", headers=admin_token)
    res = client.post("/tasks", json={
        "title": "Assignment 1",
        "user_id": existing_user.id,
        "due_date": "2026-12-25T11:59"
    }, headers=admin_token)
    
    assert res.status_code == 201

def test_assign_task_unrelated_student(client, admin_token, existing_user):
    res = client.post("/tasks", json={
        "title": "Assignment 1",
        "user_id": existing_user.id,
        "due_date": "2026-12-25T11:59"
    }, headers=admin_token)
    
    assert res.status_code == 403

def test_assign_student_forbidden(client, student_token, existing_user):
    res = client.put(f"/admin/users/{existing_user.id}/assign", headers=student_token)
    
    assert res.status_code == 403

def test_get_student_detail_forbidden(client, student_token, existing_user):
    res = client.get(f"/admin/users/{existing_user.id}", headers=student_token)
    
    assert res.status_code == 403

def test_assign_task_student_forbidden(client, student_token, existing_user):
    res = client.post("/tasks", json={
        "title": "Assignment 1",
        "user_id": existing_user.id,
        "due_date": "2026-12-25T11:59"
    }, headers=student_token)
    
    assert res.status_code == 403
