# contains main roots or endpoints
from flask import request, jsonify
from config import app, db
from models import User, TodoList, Task, JournalEntry, Reminder

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True)