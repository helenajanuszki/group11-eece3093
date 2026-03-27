from models import TaskPriority

#region Creating List
def test_list_creation_success(client, student_token):
    res = client.post("/lists", json = {
        "name": "List",
        "description": "List",
    }, headers=student_token)

    assert res.status_code == 201
    assert res.get_json()["name"] == "List"
    assert res.get_json()["description"] == "List"

def test_list_creation_no_data(client, student_token):
    res = client.post("/lists", json = {}, headers=student_token)

    assert res.status_code == 400

def test_list_creation_no_name(client, student_token):
    res = client.post("/lists", json = {
        "description": "I've been through the desert on a horse with no name",
    }, headers=student_token)

    assert res.status_code == 400
#endregion

#region Reading List
def test_list_get_all_success(client, student_token):
    res = client.get("/lists", headers=student_token)

    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_default_list_created_on_register(client, other_user_list):
    res = client.get("/lists", headers=other_user_list["token"])
    data = res.get_json()

    assert len(data) == 2
    assert data[0]["is_default"] == True

def test_get_list_success(client, other_user_list):
    res = client.get(f"/lists/{other_user_list["id"]}", headers=other_user_list["token"])
    data = res.get_json()

    assert res.status_code == 200
    assert data["name"] == "Test"

def test_get_list_invalid_user(client, student_token, other_user_list):
    res = client.get(f"/lists/{other_user_list["id"]}", headers=student_token)

    assert res.status_code == 403
#endregion

#region Editing List
def test_edit_list_success(client, other_user_list):
    res = client.put(f"/lists/{other_user_list["id"]}", json = {
        "name": "NewName",
        "description": "NewDesc"
    }, headers=other_user_list["token"])

    assert res.status_code == 200
    data = res.get_json()
    assert data["name"] == "NewName"
    assert data["description"] == "NewDesc"

def test_edit_default_list(client, other_user_list):
    res = client.get("/lists", headers=other_user_list["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break
    
    res = client.put(f"/lists/{default["id"]}", json = {
        "name": "NewName",
    }, headers=other_user_list["token"])

    assert res.status_code == 400

def test_edit_forbidden(client, student_token, other_user_list):
    res = client.put(f"/lists/{other_user_list["id"]}", json = {
        "name": "NewName",
        "description": "NewDesc"
    }, headers=student_token)

    assert res.status_code == 403

def test_edit_no_data(client, other_user_list):
    res = client.put(f"/lists/{other_user_list["id"]}", json = {}, headers=other_user_list["token"])

    assert res.status_code == 400
#endregion

#region Deleting List
def test_delete_success(client, other_user_list):
    res = client.delete(f"lists/{other_user_list["id"]}", headers=other_user_list["token"])

    assert res.status_code == 204

def test_delete_forbidden(client, other_user_list, student_token):
    res = client.delete(f"lists/{other_user_list["id"]}", headers=student_token)

    assert res.status_code == 403

def test_delete_default_list(client, other_user_list):
    res = client.get("/lists", headers=other_user_list["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break
    
    res = client.delete(f"/lists/{default["id"]}", headers=other_user_list["token"])

    assert res.status_code == 400
#endregion

#region Creating Task
def test_task_creation_success(client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
            "title": "Newtitle",
            "description": "NewDesc",
            "due_date": "2000-01-01T11:59:15",
            "priority": TaskPriority.high.value,
        }, headers=other_user_list["token"])
    
    assert res.status_code == 201

def test_task_creation_forbidden(client, student_token, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
        "title": "Newtitle",
        "description": "NewDesc",
        "due_date": "2000-01-01",
        "priority": TaskPriority.high.value,
    }, headers=student_token)
    
    assert res.status_code == 403

def test_task_creation_no_data(client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {}, 
                      headers=other_user_list["token"])

    assert res.status_code == 400

def test_task_creation_list_not_found(client, other_user_list):
    res = client.post("/lists/999/tasks", json = {
        "title": "Newtitle",
        "description": "NewDesc",
        "due_date": "2000-01-01",
        "priority": TaskPriority.high.value,
    }, headers=other_user_list["token"])

    assert res.status_code == 404

def test_task_creation_no_title(client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
        "description": "NewDesc",
        "due_date": "2000-01-01",
        "priority": TaskPriority.high.value,
    }, headers=other_user_list["token"])

    assert res.status_code == 400

def test_task_creation_bad_date(client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
        "title": "Newtitle",
        "description": "NewDesc",
        "due_date": "September 1, 1985",
        "priority": TaskPriority.high.value,
    }, headers=other_user_list["token"])

    assert res.status_code == 400

def test_task_creation_bad_priority(client, other_user_list):
    res = client.post(f"/lists/{other_user_list['id']}/tasks", json = {
        "title": "Newtitle",
        "description": "NewDesc",
        "due_date": "2000-01-01",
        "priority": "ASAP",
    }, headers=other_user_list["token"])

    assert res.status_code == 400
#endregion

#region Reading Task
def test_get_task_success(client, other_user_task):
    res = client.get(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", 
                      headers=other_user_task["token"])

    assert res.status_code == 200

def test_get_task_forbidden(client, other_user_task, student_token):
    res = client.get(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", 
                    headers=student_token)
    
    assert res.status_code == 403

def test_get_task_list_not_found(client, other_user_task):
    res = client.get(f"/lists/999/tasks/{other_user_task['id']}", 
                    headers=other_user_task["token"])
    
    assert res.status_code == 404

def test_get_task_not_found(client, other_user_task):
    res = client.get(f"/lists/{other_user_task['list_id']}/tasks/999", 
                    headers=other_user_task["token"])
    
    assert res.status_code == 404

def test_get_task_wrong_list(client, other_user_task):
    res = client.get("/lists", headers=other_user_task["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break

    res = client.get(f"/lists/{default['id']}/tasks/{other_user_task['id']}", 
                    headers=other_user_task["token"])
    
    assert res.status_code == 400
#endregion

#region Editing Task
def test_edit_task_success(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value
    }, headers=other_user_task["token"])

    assert res.status_code == 200
    data = res.get_json()
    assert data["title"] == "NewTaskTitle"
    assert data["description"] == "NewTaskDesc"
    assert data["due_date"] == "2026-01-01T11:59:00"
    assert data["priority"] == TaskPriority.low.value 

def test_edit_task_forbidden(client, other_user_task, student_token):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value
    }, headers=student_token)

    assert res.status_code == 403

def test_edit_task_list_not_found(client, other_user_task):
    res = client.put(f"/lists/999/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value
    }, headers=other_user_task["token"])

    assert res.status_code == 404

def test_edit_task_not_found(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/999", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value
    }, headers=other_user_task["token"])

    assert res.status_code == 404

def test_edit_task_wrong_list(client, other_user_task):
    res = client.get("/lists", headers=other_user_task["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break

    res = client.put(f"/lists/{default['id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value
    }, headers=other_user_task["token"])

    assert res.status_code == 400

def test_edit_task_invalid_date(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "01-01-2026",
        "priority": TaskPriority.low.value
    }, headers=other_user_task["token"])

    assert res.status_code == 400

def test_edit_task_invalid_priority(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": "Critical"
    }, headers=other_user_task["token"])

    assert res.status_code == 400

def test_edit_task_list_switch_success(client, other_user_task):
    res = client.get("/lists", headers=other_user_task["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break

    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value,
        "todo_list_id": default["id"]
    }, headers=other_user_task["token"])
    get_res = client.get(f"/lists/{default['id']}", headers=other_user_task['token'])

    assert res.status_code == 200
    assert len(get_res.get_json()["tasks"]) == 1

def test_edit_task_forbidden_list_switch(client, other_user_task, student_token):
    res = client.post("/lists", json = {
        "name": "List",
        "description": "List",
    }, headers=student_token)
    invalid_list = res.get_json()
    
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}", json = {
        "title": "NewTaskTitle",
        "description": "NewTaskDesc",
        "due_date": "2026-01-01T11:59",
        "priority": TaskPriority.low.value,
        "todo_list_id": invalid_list["id"]
    }, headers=other_user_task["token"])

    assert res.status_code == 403
#endregion

#region Deleting Task
def test_delete_task_success(client, other_user_task):
    res = client.delete(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}",
                        headers=other_user_task["token"])
    
    assert res.status_code == 204

def test_delete_task_list_not_found(client, other_user_task):
    res = client.delete(f"/lists/999/tasks/{other_user_task['id']}",
                        headers=other_user_task["token"])
    
    assert res.status_code == 404

def test_delete_task_not_found(client, other_user_task):
    res = client.delete(f"/lists/{other_user_task['list_id']}/tasks/999",
                        headers=other_user_task["token"])
    
    assert res.status_code == 404

def test_delete_task_forbidden(client, other_user_task, student_token):
    res = client.delete(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}",
                        headers=student_token)
    
    assert res.status_code == 403

def test_delete_task_wrong_list(client, other_user_task):
    res = client.get("/lists", headers=other_user_task["token"])
    data = res.get_json()
    default = None
    for todo_list in data:
        if todo_list["is_default"]:
            default = todo_list
            break

    res = client.delete(f"/lists/{default['id']}/tasks/{other_user_task['id']}",
                        headers=other_user_task["token"])
    
    assert res.status_code == 400
#endregion

#region Completing Task
def test_complete_task_success(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}/complete",
                        headers=other_user_task["token"])
    
    assert res.status_code == 200

def test_complete_task_forbidden(client, other_user_task, student_token):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/{other_user_task['id']}/complete",
                        headers=student_token)
    
    assert res.status_code == 403

def test_complete_task_not_found(client, other_user_task):
    res = client.put(f"/lists/{other_user_task['list_id']}/tasks/999/complete",
                        headers=other_user_task["token"])
    
    assert res.status_code == 404

def test_complete_task_list_not_found(client, other_user_task):
    res = client.put(f"/lists/999/tasks/{other_user_task['id']}/complete",
                        headers=other_user_task["token"])
    
    assert res.status_code == 404
#endregion
