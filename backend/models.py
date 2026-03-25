# contains all database models
from config import db
import enum

class Role(enum.Enum):
    student = "student"
    admin = "admin"

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.Enum(Role), nullable=False, default=Role.student)
    lists = db.relationship("TodoList", backref="user", lazy=True)
    tasks = db.relationship("Task", backref="user", lazy=True)
    journals = db.relationship("JournalEntry", backref="user", lazy=True)

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone_number": self.phone_number,
            "role": self.role.value,
        }
    
    def is_admin(self):
        return self.role == Role.admin

class TodoList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    tasks = db.relationship("Task", backref="todo_list", lazy=True)

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "user_id": self.user_id,
            "tasks": [task.to_json() for task in self.tasks],
        }

class TaskPriority(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="incomplete")
    priority = db.Column(db.Enum(TaskPriority), default=TaskPriority.low, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    todo_list_id = db.Column(db.Integer, db.ForeignKey("todo_list.id"), nullable=True)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "status": self.status,
            "priority": self.priority.value,
            "user_id": self.user_id,
            "todo_list_id": self.todo_list_id,
        }

class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date)
    mood = db.Column(db.Integer)
    content = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def to_json(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "mood": self.mood,
            "content": self.content,
            "user_id": self.user_id,
        }

reminder_recipients = db.Table("reminder_recipients",
    db.Column("reminder_id", db.Integer, db.ForeignKey("reminder.id"), nullable=False),
    db.Column("user_id", db.Integer, db.ForeignKey("user.id"), nullable=False)
)

class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime)
    source = db.Column(db.String(120))
    creator = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    recipient = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    creator_user = db.relationship("User", foreign_keys=[creator])
    recipients = db.relationship("User", secondary=reminder_recipients, lazy=True)

    def to_json(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "source": self.source,
            "creator": self.creator,
            "recipients": [user.id for user in self.recipients],
        }