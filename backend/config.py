# contains main configuration file
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager

db = SQLAlchemy()

def create_app(test_config=None):
    app = Flask(__name__)
    CORS(app)

    # Database will be kept in memory when testing to avoid messing with any data
    if test_config:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        app.config["TESTING"] = True
        app.config["SECRET_KEY"] = "test-secret-key"
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
        app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]

    db.init_app(app)
    JWTManager(app)
    return app