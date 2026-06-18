from werkzeug.security import generate_password_hash

from .extensions import db
from .models import User
from .sample_data import USERS


def seed_database():
    for user in USERS:
        existing_user = User.query.filter_by(username=user["username"]).first()
        password_hash = generate_password_hash(user["password"])

        if existing_user:
            existing_user.password_hash = password_hash
            existing_user.full_name = user["name"]
            existing_user.role = user["role"]
        else:
            db.session.add(
                User(
                    username=user["username"],
                    password_hash=password_hash,
                    full_name=user["name"],
                    role=user["role"],
                )
            )

    db.session.commit()
