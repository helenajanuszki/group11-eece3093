#region Creating
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

#region Reading
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

#region Editing
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

#region Deleting
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