from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import TodoList, Task, User, TaskPriority, TaskStatus, admin_students
from datetime import datetime
from permissions import admin_required, get_admin_student_relationship, is_assigned_task

todo_bp = Blueprint("lists", __name__)

#region Todo List
@todo_bp.route("/lists", methods=["POST"])
@jwt_required()
def create_list():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    
    if not data.get("name"):
        return jsonify({"ERROR": "Todo list must have a name"}), 400
    
    new_list = TodoList(
        name = data["name"],
        description = data.get("description"),
        user_id = user_id
    )
    db.session.add(new_list)
    db.session.commit()

    return jsonify(new_list.to_json()), 201

@todo_bp.route("/lists", methods=["GET"])
@jwt_required()
def get_all_lists():
    user_id = int(get_jwt_identity())
    lists = TodoList.query.filter_by(user_id=user_id).all()

    return jsonify([todo_list.to_json() for todo_list in lists]), 200

@todo_bp.route("/lists/assigned", methods=["GET"])
@jwt_required()
def get_assigned_lists():
    user_id = int(get_jwt_identity())

    rows = (
        db.session.query(
            TodoList,
            User.id.label("admin_id"),
            User.username.label("admin_username"),
        )
        .join(admin_students, admin_students.c.list_id == TodoList.id)
        .join(User, User.id == admin_students.c.admin_id)
        .filter(admin_students.c.student_id == user_id)
        .all()
    )

    result = []
    for todo_list, admin_id, admin_username in rows:
        item = todo_list.to_json()
        item["assigned_by"] = {
            "id": admin_id,
            "username": admin_username,
        }
        result.append(item)

    return jsonify(result), 200

@todo_bp.route("/lists/<int:id>", methods=["GET"])
@jwt_required()
def get_list(id):
    user_id = int(get_jwt_identity())
    todo_list = db.session.get(TodoList, id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404

    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    return jsonify(todo_list.to_json_with_tasks()), 200

@todo_bp.route("/lists/<int:id>", methods=["PUT"])
@jwt_required()
def edit_list(id):
    todo_list = db.session.get(TodoList, id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404

    user_id = int(get_jwt_identity())
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403 
    
    if todo_list.is_default:
        return jsonify({"ERROR": "Cannot edit default list"}), 400
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    if data.get("name") is not None:
        todo_list.name = data["name"]
    if data.get("description") is not None:
        todo_list.description = data["description"]
    
    db.session.commit()

    return jsonify(todo_list.to_json()), 200

@todo_bp.route("/lists/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_list(id):
    todo_list = db.session.get(TodoList, id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    user_id = int(get_jwt_identity())
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403

    if todo_list.is_default:
        return jsonify({"ERROR": "Cannot delete default list"}), 400
    
    db.session.delete(todo_list)
    db.session.commit()

    return "", 204
#endregion

#region Tasks
@todo_bp.route("/lists/<int:list_id>/tasks", methods=["POST"])
@jwt_required()
def create_task(list_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    user_id = int(get_jwt_identity())

    todo_list = db.session.get(TodoList, list_id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    if not data.get("title"):
        return jsonify({"ERROR": "Task must have a title"}), 400
    
    due = None
    if data.get("due_date") is not None:
        try:
            due = datetime.fromisoformat(data.get("due_date"))
            due = due.replace(second=0, microsecond=0)
        except ValueError:
            return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DDTHH:MM"}), 400
    
    priority = data.get("priority")
    if priority:
        try:
            priority = TaskPriority(priority)
        except ValueError:
            return jsonify({"ERROR": "Invalid priority"}), 400
    else:
        priority = TaskPriority.low
    
    new_task = Task(
        title = data.get("title"),
        description = data.get("description"),
        due_date = due,
        status = TaskStatus.incomplete,
        priority = priority,
        user_id = user_id,
        todo_list_id = list_id
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify(new_task.to_json()), 201
    
@todo_bp.route("/lists/<int:list_id>/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(list_id, task_id):
    user_id = int(get_jwt_identity())

    todo_list = db.session.get(TodoList, list_id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"ERROR": "Task not found"}), 404
    if task.todo_list_id != list_id:
        return jsonify({"ERROR": "Task does not belong to list"}), 400

    return jsonify(task.to_json()), 200

@todo_bp.route("/lists/<int:list_id>/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def edit_task(list_id, task_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)

    todo_list = db.session.get(TodoList, list_id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"ERROR": "Task not found"}), 404
    if task.todo_list_id != list_id:
        return jsonify({"ERROR": "Task does not belong to list"}), 400

    assigned_task = is_assigned_task(task)
    is_admin = current_user.is_admin()

    if assigned_task and not is_admin:
        non_status_fields = {"title", "description", "due_date", "priority", "todo_list_id"}
        if any(field in data for field in non_status_fields):
            return jsonify({"ERROR": "Can only change status for admin-assigned tasks"}), 403

    if data.get("title") is not None:
        task.title = data["title"]

    if data.get("description") is not None:
        task.description = data["description"]

    if data.get("due_date") is not None:
        try:
            due = datetime.fromisoformat(data.get("due_date"))
            due = due.replace(second=0, microsecond=0)
        except ValueError:
            return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DDTHH:MM"}), 400
        else:
            if due != task.due_date:
                task.due_date = due
    
    priority = data.get("priority")
    if priority:
        try:
            priority = TaskPriority(priority)
        except ValueError:
            return jsonify({"ERROR": "Invalid priority"}), 400
        else:
            task.priority = priority

    if data.get("status") is not None:
        try:
            task.status = TaskStatus(data["status"])
        except ValueError:
            return jsonify({"ERROR": "Invalid status"}), 400
    
    todo_list_id = data.get("todo_list_id")
    if todo_list_id:
        todo_list = db.session.get(TodoList, todo_list_id)
        if not todo_list:
            return jsonify({"ERROR": "Todo list not found"}), 404

        if user_id != todo_list.user_id:
            return jsonify({"ERROR": "Forbidden"}), 403 
        
        task.todo_list_id = todo_list_id

    db.session.commit()

    return jsonify(task.to_json()), 200

@todo_bp.route("/lists/<int:list_id>/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(list_id, task_id):
    user_id = int(get_jwt_identity())
    current_user = db.session.get(User, user_id)

    todo_list = db.session.get(TodoList, list_id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"ERROR": "Task not found"}), 404
    if task.todo_list_id != list_id:
        return jsonify({"ERROR": "Task does not belong to list"}), 400

    if is_assigned_task(task) and not current_user.is_admin():
        if task.status != TaskStatus.complete:
            return jsonify({"ERROR": "Admin-assigned tasks can only be deleted when complete"}), 403

    db.session.delete(task)
    db.session.commit()

    return "", 204

@todo_bp.route("/lists/<int:list_id>/tasks/<int:task_id>/complete", methods=["PUT"])
@jwt_required()
def task_complete(list_id, task_id):
    user_id = int(get_jwt_identity())

    todo_list = db.session.get(TodoList, list_id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404
    
    if user_id != todo_list.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({"ERROR": "Task not found"}), 404
    if task.todo_list_id != list_id:
        return jsonify({"ERROR": "Task does not belong to list"}), 400

    task.status = TaskStatus.complete

    db.session.commit()

    return jsonify(task.to_json()), 200

@todo_bp.route("/admin/tasks", methods=["POST"])
@todo_bp.route("/tasks", methods=["POST"])
@jwt_required()
@admin_required
def assign_task():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400

    admin_id = int(get_jwt_identity())

    if not data.get("title"):
        return jsonify({"ERROR": "Task must have a title"}), 400

    due = None
    if data.get("due_date") is not None:
        try:
            due = datetime.fromisoformat(data["due_date"])
            due = due.replace(second=0, microsecond=0)
        except ValueError:
            return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DDTHH:MM"}), 400

    priority = TaskPriority.low
    if data.get("priority"):
        try:
            priority = TaskPriority(data["priority"])
        except ValueError:
            return jsonify({"ERROR": "Invalid priority"}), 400

    target_ids = set()
    if data.get("all_students") is True:
        rows = (
            db.session.query(admin_students.c.student_id)
            .filter(admin_students.c.admin_id == admin_id)
            .all()
        )
        target_ids = {int(r.student_id) for r in rows}
    elif isinstance(data.get("user_ids"), list):
        try:
            target_ids = {int(x) for x in data["user_ids"]}
        except (TypeError, ValueError):
            return jsonify({"ERROR": "user_ids must be a list of integers"}), 400
    elif data.get("user_id") is not None:
        try:
            target_ids = {int(data["user_id"])}
        except (TypeError, ValueError):
            return jsonify({"ERROR": "user_id must be an integer"}), 400
    else:
        return jsonify({"ERROR": "Provide one of: user_id, user_ids, all_students=true"}), 400

    if not target_ids:
        return jsonify({"ERROR": "No students selected"}), 400

    created_tasks = []

    for student_id in target_ids:
        assigned_user = db.session.get(User, student_id)
        if not assigned_user:
            continue

        relationship = get_admin_student_relationship(admin_id, assigned_user.id)
        if not relationship:
            continue

        dedicated_list = db.session.get(TodoList, relationship.list_id)
        if not dedicated_list:
            continue

        new_task = Task(
            title=data["title"],
            description=data.get("description"),
            due_date=due,
            status=TaskStatus.incomplete,
            priority=priority,
            user_id=assigned_user.id,
            todo_list_id=dedicated_list.id
        )
        db.session.add(new_task)
        created_tasks.append(new_task)

    if not created_tasks:
        return jsonify({"ERROR": "No valid assigned students found"}), 400

    db.session.commit()

    payload = [t.to_json() for t in created_tasks]
    if len(payload) == 1:
        return jsonify(payload[0]), 201
    return jsonify({"count": len(payload), "tasks": payload}), 201
#endregion