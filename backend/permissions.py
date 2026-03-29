from functools import wraps
from flask import jsonify,g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from config import db
from models import User

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = db.session.get(User, user_id)
        if not user or not user.is_admin():
            return jsonify({"ERROR": "Forbidden"}), 403
        return f(*args, **kwargs)
    return decorated