from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from config import db
from models import User, Role, TodoList

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data or not data.get("username") or not data.get("password") or not data.get("email"):
        return jsonify({"ERROR": "Missing email, username, or password"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"ERROR": "User already registered"}), 409
    
    role_input = data.get("role")
    if role_input:
        try:
            role = Role(role_input)
        except ValueError:
            return jsonify({"ERROR": "Invalid role"}), 400
    else:
        role = Role.student
    
    new_user = User(
        username=data["username"],
        email=data["email"],
        phone_number=data.get("phone_number"),
        password=generate_password_hash(data["password"]),
        role=role
    )
    db.session.add(new_user)
    db.session.flush()

    default_list = TodoList(
        is_default=True,
        name="Tasks",
        description="Default list for standalone tasks",
        user_id=new_user.id
    )
    db.session.add(default_list)
    db.session.commit()

    return jsonify(new_user.to_json()), 201

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"ERROR": "Email or password not provided"}), 400

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"ERROR": "Invalid credentials"}), 401

    # Ids are used for tokens, so get_jwt_identity() gives the current user's id
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_json()}), 200
