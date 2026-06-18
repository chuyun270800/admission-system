from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import User


DEMO_USERS = [
    {
        "username": "admin",
        "password": "admin123",
        "role": "admin",
        "full_name": "招生管理員",
    },
    {
        "username": "teacher01",
        "password": "123456",
        "role": "teacher",
        "full_name": "王志明 老師",
    },
    {
        "username": "teacher02",
        "password": "123456",
        "role": "teacher",
        "full_name": "林美玲 老師",
    },
    {
        "username": "teacher03",
        "password": "123456",
        "role": "teacher",
        "full_name": "陳建宏 老師",
    },
    {
        "username": "viewer01",
        "password": "123456",
        "role": "viewer",
        "full_name": "委員會成員",
    },
]


def reset_demo_users():
    for user_data in DEMO_USERS:
        user = User.query.filter_by(username=user_data["username"]).first()
        password_hash = generate_password_hash(user_data["password"])

        if user is None:
            user = User(username=user_data["username"])
            db.session.add(user)

        user.password_hash = password_hash
        user.full_name = user_data["full_name"]
        user.role = user_data["role"]

    db.session.commit()


def print_available_accounts():
    print("Demo users reset successfully.")
    print("Available accounts:")

    for user_data in DEMO_USERS:
        print(
            f"- {user_data['username']} / {user_data['password']} "
            f"({user_data['role']}, {user_data['full_name']})"
        )


if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        reset_demo_users()
        print_available_accounts()
