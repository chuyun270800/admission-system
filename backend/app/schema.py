from sqlalchemy import text

from .extensions import db


STUDENT_COLUMN_TYPES = {
    "document_status": "VARCHAR(50) NOT NULL DEFAULT '待補件'",
    "gpa": "FLOAT",
    "academic_score": "FLOAT NOT NULL DEFAULT 0",
    "language_score": "FLOAT NOT NULL DEFAULT 0",
    "interview_score": "FLOAT NOT NULL DEFAULT 0",
    "motivation_score": "FLOAT NOT NULL DEFAULT 0",
    "bonus_score": "FLOAT NOT NULL DEFAULT 0",
    "total_score": "FLOAT NOT NULL DEFAULT 0",
    "ranking": "INTEGER",
    "recommendation": "VARCHAR(50)",
    "comment": "TEXT",
    "assigned_teacher": "VARCHAR(120)",
    "interview_mode": "VARCHAR(50)",
    "interview_room": "VARCHAR(120)",
    "interview_status": "VARCHAR(50) NOT NULL DEFAULT '未安排'",
}

SCHEDULE_COLUMN_TYPES = {
    "notification_status": "VARCHAR(50) NOT NULL DEFAULT '未通知'",
}


def ensure_schema():
    inspector = db.inspect(db.engine)

    if "students" not in inspector.get_table_names():
        existing_student_columns = set()
    else:
        existing_student_columns = {column["name"] for column in inspector.get_columns("students")}

    for column_name, column_type in STUDENT_COLUMN_TYPES.items():
        if column_name in existing_student_columns:
            continue

        db.session.execute(text(f"ALTER TABLE students ADD COLUMN {column_name} {column_type}"))

    if "schedules" in inspector.get_table_names():
        existing_schedule_columns = {column["name"] for column in inspector.get_columns("schedules")}

        for column_name, column_type in SCHEDULE_COLUMN_TYPES.items():
            if column_name in existing_schedule_columns:
                continue

            db.session.execute(text(f"ALTER TABLE schedules ADD COLUMN {column_name} {column_type}"))

    db.session.commit()
