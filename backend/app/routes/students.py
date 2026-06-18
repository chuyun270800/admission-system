from datetime import date

from flask import Blueprint, request
from sqlalchemy import or_

from ..extensions import db
from ..models import Student


students_bp = Blueprint("students", __name__)


def apply_student_payload(student, payload, *, creating):
    student_code = (payload.get("id") or "").strip()

    if creating and not student_code:
        raise ValueError("Student ID is required.")

    if creating:
        student.student_code = student_code

    student.name = (payload.get("name") or "").strip()
    student.chinese_name = (payload.get("chineseName") or "").strip() or None
    student.gender = payload.get("gender") or "Male"
    student.age = int(payload.get("age") or 0)
    student.nationality = (payload.get("nationality") or "").strip()
    student.passport_no = (payload.get("passportNo") or "").strip() or None
    student.arc_no = (payload.get("arcNo") or "").strip() or None
    student.phone = (payload.get("phone") or "").strip() or None
    student.email = (payload.get("email") or "").strip() or None
    student.address = (payload.get("address") or "").strip() or None
    student.department = (payload.get("department") or "").strip()
    student.grade = (payload.get("grade") or "").strip()
    student.admission_type = (payload.get("admissionType") or "").strip()
    student.admission_status = payload.get("admissionStatus") or "Pending"
    student.document_status = payload.get("documentStatus") or student.document_status or "待補件"
    student.application_date = date.fromisoformat(payload.get("applicationDate"))
    student.interview_date = (
        date.fromisoformat(payload["interviewDate"]) if payload.get("interviewDate") else None
    )
    student.enrollment_date = (
        date.fromisoformat(payload["enrollmentDate"]) if payload.get("enrollmentDate") else None
    )
    student.emergency_contact = (payload.get("emergencyContact") or "").strip() or None
    student.emergency_phone = (payload.get("emergencyPhone") or "").strip() or None
    student.documents = payload.get("documents") or []
    student.gpa = payload.get("gpa")
    student.academic_score = float(payload.get("academicScore") or 0)
    student.language_score = float(payload.get("languageScore") or 0)
    student.interview_score = float(payload.get("interviewScore") or 0)
    student.motivation_score = float(payload.get("motivationScore") or 0)
    student.bonus_score = float(payload.get("bonusScore") or 0)
    student.total_score = float(payload.get("totalScore") or 0)
    student.ranking = payload.get("rank")
    student.recommendation = (payload.get("recommendation") or "").strip() or None
    student.comment = (payload.get("comment") or "").strip() or None
    student.assigned_teacher = (payload.get("assignedTeacher") or "").strip() or None
    student.interview_mode = (payload.get("interviewMode") or "").strip() or None
    student.interview_room = (payload.get("interviewRoom") or "").strip() or None
    student.interview_status = payload.get("interviewStatus") or student.interview_status or "未安排"
    student.note = (payload.get("note") or "").strip() or None

    if not student.name or not student.department or not student.nationality:
        raise ValueError("Name, nationality, and department are required.")


@students_bp.get("")
def list_students():
    query = Student.query.order_by(Student.application_date.desc(), Student.student_code.asc())

    search = (request.args.get("q") or "").strip()
    nationality = (request.args.get("nationality") or "").strip()
    status = (request.args.get("status") or "").strip()

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_code.ilike(pattern),
                Student.name.ilike(pattern),
                Student.chinese_name.ilike(pattern),
                Student.department.ilike(pattern),
                Student.email.ilike(pattern),
            )
        )

    if nationality:
        query = query.filter(Student.nationality == nationality)

    if status:
        query = query.filter(Student.admission_status == status)

    return [student.to_dict() for student in query.all()]


@students_bp.post("")
def create_student():
    payload = request.get_json() or {}

    if Student.query.filter_by(student_code=payload.get("id")).first():
        return {"error": "Student ID already exists."}, 409

    student = Student()

    try:
        apply_student_payload(student, payload, creating=True)
    except ValueError as error:
        return {"error": str(error)}, 400

    db.session.add(student)
    db.session.commit()
    return student.to_dict(), 201


@students_bp.put("/<student_code>")
def update_student(student_code):
    student = Student.query.filter_by(student_code=student_code).first_or_404()
    payload = request.get_json() or {}

    try:
        apply_student_payload(student, payload, creating=False)
    except ValueError as error:
        return {"error": str(error)}, 400

    db.session.commit()
    return student.to_dict()


@students_bp.put("/<student_code>/scores")
def update_student_scores(student_code):
    student = Student.query.filter_by(student_code=student_code).first_or_404()
    payload = request.get_json() or {}

    required_fields = [
        "student_id",
        "academic_score",
        "language_score",
        "interview_score",
        "motivation_score",
        "bonus_score",
        "comment",
    ]
    missing = [field for field in required_fields if field not in payload]
    if missing:
        return {"error": f"Missing required fields: {', '.join(missing)}"}, 400

    if payload.get("student_id") != student_code:
        return {"error": "Student ID does not match request path."}, 400

    student.academic_score = float(payload.get("academic_score") or 0)
    student.language_score = float(payload.get("language_score") or 0)
    student.interview_score = float(payload.get("interview_score") or 0)
    student.motivation_score = float(payload.get("motivation_score") or 0)
    student.bonus_score = float(payload.get("bonus_score") or 0)
    student.comment = (payload.get("comment") or "").strip() or None
    student.total_score = (
        student.academic_score
        + student.language_score
        + student.interview_score
        + student.motivation_score
        + student.bonus_score
    )
    student.ranking = None
    student.recommendation = None

    db.session.commit()
    return {"message": "評分已儲存", "student": student.to_dict()}


@students_bp.delete("/<student_code>")
def delete_student(student_code):
    student = Student.query.filter_by(student_code=student_code).first_or_404()
    db.session.delete(student)
    db.session.commit()
    return {"message": "Student deleted."}
