from datetime import date, time

from flask import Blueprint, request

from ..extensions import db
from ..models import Schedule, Student


schedules_bp = Blueprint("schedules", __name__)
NOTIFICATION_STATUSES = {"未通知", "已通知", "已完成"}


@schedules_bp.get("")
def list_schedules():
    schedules = (
        Schedule.query.order_by(Schedule.event_date.asc(), Schedule.event_time.asc(), Schedule.id.desc()).all()
    )
    return [schedule.to_dict() for schedule in schedules]


@schedules_bp.post("")
def create_schedule():
    payload = request.get_json() or {}
    student_code = payload.get("studentId") or payload.get("applicantId")
    student = Student.query.filter_by(student_code=student_code).first() if student_code else None

    title = (payload.get("title") or "").strip()
    schedule_date = payload.get("date")
    schedule_time = payload.get("interview_time") or payload.get("interviewTime") or payload.get("time_slot") or payload.get("time")
    location = (payload.get("location") or "").strip()

    if not title or not schedule_date or not schedule_time or not location:
        return {"error": "Title, date, time, and location are required."}, 400

    schedule = None
    if student:
        schedule = Schedule.query.filter_by(title=title, student=student).first()

    if schedule is None:
        schedule = Schedule(title=title, student=student)
        db.session.add(schedule)

    schedule.event_date = date.fromisoformat(schedule_date)
    schedule.event_time = time.fromisoformat(schedule_time)
    schedule.location = location
    schedule.status = payload.get("status") or "Scheduled"
    schedule.notification_status = payload.get("notificationStatus") or schedule.notification_status or "未通知"

    if student:
        student.interview_date = schedule.event_date
        student.assigned_teacher = (payload.get("teacher") or "").strip() or student.assigned_teacher
        student.interview_mode = payload.get("mode") or student.interview_mode or "實體面試"
        student.interview_room = location
        status_map = {
            "Scheduled": "已排程",
            "Completed": "已完成",
            "Pending": "待確認",
            "Cancelled": "取消",
        }
        student.interview_status = status_map.get(schedule.status, schedule.status)

    db.session.commit()
    return schedule.to_dict(), 201


@schedules_bp.put("/batch-notification-status")
def update_batch_notification_status():
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    schedule_date = payload.get("date")
    schedule_time = payload.get("time")
    location = (payload.get("location") or "").strip()
    notification_status = (payload.get("notificationStatus") or "").strip()

    if not title or not schedule_date or not schedule_time or not location:
        return {"error": "Title, date, time, and location are required."}, 400

    if notification_status not in NOTIFICATION_STATUSES:
        return {"error": "Invalid notification status."}, 400

    schedules = Schedule.query.filter_by(
        title=title,
        event_date=date.fromisoformat(schedule_date),
        event_time=time.fromisoformat(schedule_time),
        location=location,
    ).all()

    if not schedules:
        return {"error": "Interview batch not found."}, 404

    for schedule in schedules:
        schedule.notification_status = notification_status

    db.session.commit()
    return {
        "message": "面試通知狀態已更新",
        "updated_count": len(schedules),
        "schedules": [schedule.to_dict() for schedule in schedules],
    }
