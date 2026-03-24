from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from config import db
from models import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not data or not data.get("username") or not data.get("password") or not data.get("email"):
        return jsonify({"ERROR": "Missing email, username, or password"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"ERROR": "User already registered"}), 409

    new_user = User(
        username=data["username"],
        email=data["email"],
        phone_number=data.get("phone_number"),
        password=generate_password_hash(data["password"]),
        role=data.get("role", "student")
    )

    db.session.add(new_user)
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

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_json()}), 200

@auth_bp.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200