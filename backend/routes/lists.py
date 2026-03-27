from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import TodoList, Task, User

todo_bp = Blueprint("lists", __name__)

@todo_bp.route("/lists", methods=["POST"])
@jwt_required()
def create_list():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
    lists = TodoList.query.filter_by(user_id=user_id).all()

    return jsonify([todo_list.to_json() for todo_list in lists]), 200

@todo_bp.route("/lists/<int:id>", methods=["GET"])
@jwt_required()
def get_list(id):
    user_id = get_jwt_identity()
    todo_list = db.session.get(TodoList, id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404

    if user_id != str(todo_list.user_id):
        return jsonify({"ERROR": "Forbidden"}), 403
    
    return jsonify(todo_list.to_json_with_tasks()), 200

@todo_bp.route("/lists/<int:id>", methods=["PUT"])
@jwt_required()
def edit_list(id):
    todo_list = db.session.get(TodoList, id)
    if not todo_list:
        return jsonify({"ERROR": "Todo list not found"}), 404

    user_id = get_jwt_identity()
    if user_id != str(todo_list.user_id):
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
    
    user_id = get_jwt_identity()
    if user_id != str(todo_list.user_id):
        return jsonify({"ERROR": "Forbidden"}), 403

    if todo_list.is_default:
        return jsonify({"ERROR": "Cannot delete default list"}), 400
    
    db.session.delete(todo_list)
    db.session.commit()

    return "", 204
