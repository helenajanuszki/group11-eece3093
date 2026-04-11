from config import create_app, db
from models import User, Role, TodoList
from werkzeug.security import generate_password_hash


def make_user(username, email, raw_password, role):
    user = User(
        username=username,
        email=email,
        password=generate_password_hash(raw_password),
        role=role,
    )
    db.session.add(user)
    db.session.flush()  # get user.id

    db.session.add(
        TodoList(
            is_default=True,
            name="Tasks",
            description="Default list for standalone tasks",
            user_id=user.id,
        )
    )
    return user


def seed():
    app = create_app()

    with app.app_context():
        db.drop_all()
        db.create_all()

        # 2 admins
        make_user("admin1", "admin1@example.com", "admin123", Role.admin)
        make_user("admin2", "admin2@example.com", "admin456", Role.admin)

        # required student
        make_user("user", "user@example.com", "user123", Role.student)

        # 9 more students (total 10 students)
        for i in range(2, 11):
            make_user(f"user{i}", f"user{i}@example.com", f"user{i}123", Role.student)

        db.session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    seed()