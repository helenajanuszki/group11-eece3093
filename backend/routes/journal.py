from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from config import db
from models import JournalEntry, User
from datetime import date

journal_bp = Blueprint("journal", __name__)

@journal_bp.route("/journal", methods=["POST"])
@jwt_required()
def create_journal_entry():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"ERROR": "User not found"}), 404
    
    mood = data.get("mood")
    if not isinstance(mood, int) or mood < 1 or mood > 5:
        return jsonify({"ERROR": "Invalid mood value"}), 400
    
    try:
        creation_date = date.fromisoformat(data.get("date"))
    except (ValueError, TypeError):
        return jsonify({"ERROR": "Invalid date format, use YYYY-MM-DD"}), 400
    
    entry = JournalEntry(
        date=creation_date,
        mood=mood,
        content=data.get("content"),
        user_id=user_id
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify(entry.to_json()), 201

@journal_bp.route("/journal", methods=["GET"])
@jwt_required()
def get_all():
    user_id = int(get_jwt_identity())
    entries = JournalEntry.query.filter_by(user_id=user_id).all()
    return jsonify([entry.to_json() for entry in entries]), 200

@journal_bp.route("/journal/<int:id>", methods=["GET"])
@jwt_required()
def get_entry(id):
    user_id = int(get_jwt_identity())
    entry = db.session.get(JournalEntry, id)

    if not entry:
        return jsonify({"ERROR": "Journal entry not found"}), 404
    
    if entry.user_id != user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    return jsonify(entry.to_json()), 200

@journal_bp.route("/journal/<int:id>", methods=["PUT"])
@jwt_required()
def edit_journal_entry(id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ERROR": "No data provided"}), 400
    
    entry = db.session.get(JournalEntry, id)
    if not entry:
        return jsonify({"ERROR": "Journal entry not found"}), 404
    
    user_id = int(get_jwt_identity())
    if user_id != entry.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403

    if data.get("mood") is not None:
        mood = data.get("mood")
        if mood < 1 or mood > 5:
            return jsonify({"ERROR": "Invalid mood value"}), 400
        entry.mood = mood

    if data.get("content") is not None:
        entry.content = data.get("content")

    db.session.commit()

    return jsonify(entry.to_json()), 200

@journal_bp.route("/journal/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_journal_entry(id):
    entry = db.session.get(JournalEntry, id)
    if not entry:
        return jsonify({"ERROR": "Journal entry not found"}), 404
    
    user_id = int(get_jwt_identity())
    if user_id != entry.user_id:
        return jsonify({"ERROR": "Forbidden"}), 403
    
    db.session.delete(entry)
    db.session.commit()

    return "", 204