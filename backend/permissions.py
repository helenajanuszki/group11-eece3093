from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from config import db
from models import User, admin_students

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = int(get_jwt_identity())
        user = db.session.get(User, user_id)
        if not user or not user.is_admin():
            return jsonify({"ERROR": "Forbidden"}), 403
        return f(*args, **kwargs)
    return decorated

def get_admin_student_relationship(admin_id, student_id):
    return db.session.execute(
        admin_students.select().where(
            admin_students.c.admin_id == admin_id,
            admin_students.c.student_id == student_id
        )
    ).first()

def is_assigned_task(task):
    relationship = db.session.execute(
        admin_students.select().where(
            admin_students.c.list_id == task.todo_list_id
        )
    ).first()
    return relationship is not None