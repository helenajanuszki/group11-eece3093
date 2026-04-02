from permissions import admin_required, get_admin_student_relationship
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import User, Role, TodoList, admin_students

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    users = admin.students
    return jsonify([user.to_json() for user in users]), 200

@admin_bp.route("/admin/users/<int:id>", methods=["GET"])
@jwt_required()
@admin_required
def get_user(id):
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404

    relationship = get_admin_student_relationship(admin_id, user.id)
    if not relationship:
        return jsonify({"ERROR": "Forbidden"}), 403

    return jsonify(user.to_json()), 200

@admin_bp.route("/admin/users/<int:id>/assign", methods=["PUT"])
@jwt_required()
@admin_required
def assign_student(id):
    current_user_id = int(get_jwt_identity())
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    if user.is_admin():
        return jsonify({"ERROR": "Cannot assign an admin as a student"}), 400

    existing = get_admin_student_relationship(current_user_id, user.id)
    if existing:
        return jsonify({"ERROR": "Student already assigned to this admin"}), 400

    admin = db.session.get(User, current_user_id)
    dedicated_list = TodoList(
        name=f"Tasks from {admin.username}",
        description=f"Tasks assigned by {admin.username}",
        user_id=user.id,
        is_default=False
    )
    db.session.add(dedicated_list)
    db.session.flush()

    db.session.execute(
        admin_students.insert().values(
            admin_id=current_user_id,
            student_id=user.id,
            list_id=dedicated_list.id
        )
    )
    db.session.commit()

    return jsonify(user.to_json()), 200
