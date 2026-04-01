from permissions import admin_required
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import User, Role

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    user_id = get_jwt_identity()
    users = User.query.filter_by(role=Role.student, admin_id=user_id).all()
    return jsonify([user.to_json() for user in users]), 200

@admin_bp.route("/admin/users/<int:id>", methods=["GET"])
@jwt_required()
@admin_required
def get_user(id):
    user_id = get_jwt_identity()
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404

    if str(user.admin_id) != user_id:
        return jsonify({"ERROR": "Forbidden"}), 403

    return jsonify(user.to_json()), 200

@admin_bp.route("/admin/users/<int:id>/assign", methods=["PUT"])
@jwt_required()
@admin_required
def assign_student(id):
    user_id = get_jwt_identity()
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404

    if user.is_admin():
        return jsonify({"ERROR": "Cannot assign an admin as a student"}), 400

    if user.admin_id is not None:
        return jsonify({"ERROR": "Student already assigned to an admin"}), 400

    user.admin_id = user_id
    db.session.commit()

    return jsonify(user.to_json()), 200
