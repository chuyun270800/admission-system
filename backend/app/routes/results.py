from flask import Blueprint

from ..extensions import db
from ..models import Student


results_bp = Blueprint("results", __name__)


def calculate_total_score(student):
    return round(
        (student.academic_score or 0)
        + (student.language_score or 0)
        + (student.interview_score or 0)
        + (student.motivation_score or 0)
        + (student.bonus_score or 0),
        2,
    )


def has_scores(student):
    return any([
        student.academic_score,
        student.language_score,
        student.interview_score,
        student.motivation_score,
        student.bonus_score,
    ])


def recommendation_for_rank(rank):
    if rank <= 10:
        return "建議錄取"
    if rank <= 30:
        return "備取"
    if rank <= 50:
        return "再評估"
    return "不錄取"


def generate_ranking_results():
    students = [student for student in Student.query.order_by(Student.student_code.asc()).all() if has_scores(student)]

    if not students:
        return []

    for student in students:
        student.total_score = calculate_total_score(student)

    students.sort(key=lambda item: item.total_score, reverse=True)

    results = []

    for index, student in enumerate(students, start=1):
        recommendation = recommendation_for_rank(index)
        student.ranking = index
        student.recommendation = recommendation

        results.append({
            "student_id": student.student_code,
            "name": student.name,
            "department": student.department,
            "total_score": student.total_score,
            "rank": index,
            "recommendation": recommendation,
            "admission_status": student.admission_status,
            "comment": student.comment or "",
        })

    db.session.commit()
    return results


@results_bp.post("/generate-ranking")
def generate_ranking():
    results = generate_ranking_results()
    if not results:
        return {"error": "尚未完成教師評分，無法產生正式排名。"}, 400

    return {"message": "排名產生完成", "results": results}


@results_bp.get("")
def list_results():
    return {"results": generate_ranking_results()}
