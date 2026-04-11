from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select, and_
from permissions import admin_required
from config import db
from models import User, Role, TodoList, admin_students, Task

admin_bp = Blueprint("admin", __name__)


def _admin_student_link(admin_id: int, student_id: int):
    return db.session.execute(
        select(admin_students).where(
            and_(
                admin_students.c.admin_id == admin_id,
                admin_students.c.student_id == student_id,
            )
        )
    ).first()

@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
@admin_required
def get_users():
    admin_id = int(get_jwt_identity())

    rows = db.session.execute(
        select(User)
        .join(admin_students, admin_students.c.student_id == User.id)
        .where(admin_students.c.admin_id == admin_id)
        .order_by(User.username.asc())
    ).scalars().all()

    return jsonify([u.to_json() for u in rows]), 200


@admin_bp.route("/admin/users/<int:id>", methods=["GET"])
@jwt_required()
@admin_required
def get_user(id):
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404

    if not _admin_student_link(admin_id, user.id):
        return jsonify({"ERROR": "Forbidden"}), 403

    return jsonify(user.to_json()), 200


@admin_bp.route("/admin/users/<int:id>/assign", methods=["PUT"])
@jwt_required()
@admin_required
def assign_student(id):
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    if user.is_admin():
        return jsonify({"ERROR": "Cannot assign an admin as a student"}), 400

    # check only this admin<->student pair
    existing = _admin_student_link(admin_id, user.id)
    if existing:
        return jsonify({"ERROR": "Student already assigned to this admin"}), 400

    admin = db.session.get(User, admin_id)
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
            admin_id=admin_id,
            student_id=user.id,
            list_id=dedicated_list.id
        )
    )
    db.session.commit()

    return jsonify(user.to_json()), 200


@admin_bp.route("/admin/users/<int:id>/assign", methods=["DELETE"])
@jwt_required()
@admin_required
def unassign_student(id):
    admin_id = int(get_jwt_identity())
    user = db.session.get(User, id)

    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    if user.is_admin():
        return jsonify({"ERROR": "Cannot unassign an admin"}), 400

    relationship = _admin_student_link(admin_id, user.id)
    if not relationship:
        return jsonify({"ERROR": "Student is not assigned to this admin"}), 404

    link = relationship._mapping
    list_id = link.get("list_id")

    if list_id:
        dedicated_list = db.session.get(TodoList, list_id)
        if dedicated_list:
            Task.query.filter_by(todo_list_id=dedicated_list.id).delete(synchronize_session=False)
            db.session.delete(dedicated_list)

    db.session.execute(
        admin_students.delete().where(
            admin_students.c.admin_id == admin_id,
            admin_students.c.student_id == user.id
        )
    )
    db.session.commit()

    return jsonify(user.to_json()), 200


@admin_bp.route("/admin/students", methods=["GET"])
@jwt_required()
@admin_required
def get_students_for_assignment():
    admin_id = int(get_jwt_identity())
    q = (request.args.get("q") or "").strip()

    query = User.query.filter(User.role == Role.student)
    if q:
        query = query.filter(User.username.ilike(f"%{q}%"))
    students = query.order_by(User.username.asc()).all()

    my_ids = {
        r[0] for r in db.session.execute(
            select(admin_students.c.student_id).where(admin_students.c.admin_id == admin_id)
        ).all()
    }

    out = []
    for s in students:
        j = s.to_json()
        j["assigned_to_me"] = s.id in my_ids
        out.append(j)

    return jsonify(out), 200