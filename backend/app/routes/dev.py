from flask import Blueprint
from sqlalchemy import inspect, text

from ..extensions import db
from ..models import Schedule, Student


dev_bp = Blueprint("dev", __name__)


@dev_bp.delete("/clear-all-data")
def clear_all_data():
    inspector = inspect(db.engine)
    existing_tables = set(inspector.get_table_names())
    optional_tables = [
        "interviews",
        "interview_batches",
        "interview_applicants",
        "scores",
        "ranking_results",
        "imported_records",
        "import_cache",
        "imported_preview_cache",
    ]
    deleted_optional = {}

    for table_name in optional_tables:
        if table_name not in existing_tables:
            deleted_optional[table_name] = 0
            continue

        result = db.session.execute(text(f"DELETE FROM {table_name}"))
        deleted_optional[table_name] = result.rowcount or 0

    schedule_count = Schedule.query.delete()
    student_count = Student.query.delete()
    db.session.commit()

    return {
        "message": "測試資料已清空",
        "deleted": {
            "students": student_count,
            "interviews": schedule_count,
            "schedules": schedule_count,
            "scores": student_count,
            "ranking_results": student_count,
            "imported_preview_cache": deleted_optional.get("imported_preview_cache", 0),
            "optional_tables": deleted_optional,
        },
    }
