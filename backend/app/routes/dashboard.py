from flask import Blueprint
from sqlalchemy import func

from ..extensions import db
from ..models import Student


dashboard_bp = Blueprint("dashboard", __name__)


def build_dashboard_payload():
    status_counts = dict(
        db.session.query(Student.admission_status, func.count(Student.id))
        .group_by(Student.admission_status)
        .all()
    )

    return {
        "total": sum(status_counts.values()),
        "approved": status_counts.get("Approved", 0),
        "pending": status_counts.get("Pending", 0),
        "interview": status_counts.get("Interview", 0),
    }


@dashboard_bp.get("")
def dashboard_summary():
    return build_dashboard_payload()


@dashboard_bp.get("/stats")
def stats():
    return build_dashboard_payload()
