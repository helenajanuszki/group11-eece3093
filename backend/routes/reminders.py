from permissions import admin_required
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import Reminder, User, admin_students
from sqlalchemy import or_
from datetime import datetime

reminder_bp = Blueprint("reminders", __name__)

@reminder_bp.route("/reminders", methods=["GET"])
@jwt_required()
def get_reminders():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    
    reminders = None
    if user.is_admin():
        reminders = Reminder.query.filter_by(creator=user_id).all()
    else:
        reminders = Reminder.query.filter(
            or_(Reminder.recipients.any(User.id == user_id), ~Reminder.recipients.any())).all()
    
    return jsonify([reminder.to_json() for reminder in reminders]), 200

@reminder_bp.route("/reminders", methods=["POST"])
@jwt_required()
@admin_required
def create_reminder():
    user_id = int(get_jwt_identity())
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    title = data.get("title")
    if not title:
        return jsonify({"ERROR": "Reminder must have a title"}), 400
    
    due = None
    if data.get("due_date") is not None:
        try:
            due = datetime.fromisoformat(data.get("due_date"))
            due = due.replace(second=0, microsecond=0)
        except ValueError:
            return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DD_HH:MM"}), 400
    else:
        return jsonify({"ERROR": "Reminder must have a due date"}), 400

    recipients_ids = data.get("recipients", [])
    if not isinstance(recipients_ids, list):    
        return jsonify({"ERROR": "Recipients must be a list"}), 400

    relationships = db.session.execute(
        admin_students.select().where(admin_students.c.admin_id == user_id)
    ).all()
    student_ids = [r.student_id for r in relationships]

    recipient_users = User.query.filter(
        User.id.in_(recipients_ids),
        User.id.in_(student_ids)
    ).all()

    new_reminder = Reminder(
        title = title,
        description = data.get("description"),
        due_date = due,
        creator = user_id,
        recipients = recipient_users
    )

    db.session.add(new_reminder)
    db.session.commit()

    return jsonify(new_reminder.to_json()), 201

@reminder_bp.route("/reminders/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def edit_reminder(id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400

    reminder = db.session.get(Reminder, id)
    if not reminder:
        return jsonify({"ERROR": "Reminder not found"}), 404
    
    user_id = int(get_jwt_identity())
    if reminder.creator != user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    title = data.get("title")
    if title is not None:
        reminder.title = title
    
    description = data.get("description")
    if description is not None:
        reminder.description = description

    due = data.get("due_date")
    if due is not None:
        try:
            due = datetime.fromisoformat(due)
            due = due.replace(second=0, microsecond=0)
        except ValueError:
            return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DDTHH:MM"}), 400
        reminder.due_date = due

    if data.get("recipients") is not None:
        recipients_ids = data.get("recipients", [])
        if not isinstance(recipients_ids, list):    
            return jsonify({"ERROR": "Recipients must be a list"}), 400
        relationships = db.session.execute(admin_students.select().
                                           where(admin_students.c.admin_id == user_id)).all()
        student_ids = [r.student_id for r in relationships]
        reminder.recipients = User.query.filter(User.id.in_(recipients_ids), User.id.in_(student_ids)).all()

    db.session.commit()

    return jsonify(reminder.to_json()), 200

@reminder_bp.route("/reminders/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_reminder(id):
    reminder = db.session.get(Reminder, id)
    if not reminder:
        return jsonify({"ERROR": "Reminder not found"}), 404
    
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"ERROR": "User not found"}), 404

    if user.is_admin():
        if reminder.creator != user_id:
            return jsonify({"ERROR": "Forbidden"}), 403
        db.session.delete(reminder)
        db.session.commit()
        return "", 204

    recipient_ids = {u.id for u in reminder.recipients}
    if user_id not in recipient_ids:
        return jsonify({"ERROR": "Forbidden"}), 403

    reminder.recipients = [u for u in reminder.recipients if u.id != user_id]
    # Avoid making an assigned reminder become broadcast when no recipients remain.
    if len(reminder.recipients) == 0:
        db.session.delete(reminder)

    db.session.commit()

    return "", 204