from datetime import date, datetime, timedelta

from flask import Blueprint, request
from sqlalchemy import inspect, text

from ..extensions import db
from ..models import Schedule, Student


interviews_bp = Blueprint("interviews", __name__)

TEACHER_GROUPS = [
    ["王志明 老師"],
    ["林美玲 老師", "陳建宏 老師"],
    ["張雅婷 老師"],
    ["王志明 老師", "林美玲 老師", "陳建宏 老師"],
]
LOCATIONS = ["國際處會議室 A", "招生面試室 B", "線上 Google Meet", "線上 Microsoft Teams"]
TIME_SLOTS = ["09:00", "10:30", "13:30", "15:00"]
DEFAULT_BATCH_SIZE = 4


def clear_interview_tables():
    inspector = inspect(db.engine)
    existing_tables = set(inspector.get_table_names())
    optional_tables = ["interviews", "interview_batches", "interview_applicants"]
    deleted_optional = {}

    for table_name in optional_tables:
        if table_name not in existing_tables:
            deleted_optional[table_name] = 0
            continue

        result = db.session.execute(text(f"DELETE FROM {table_name}"))
        deleted_optional[table_name] = result.rowcount or 0

    schedule_count = Schedule.query.delete()

    for student in Student.query.all():
        student.interview_date = None
        student.assigned_teacher = None
        student.interview_mode = None
        student.interview_room = None
        student.interview_status = "未安排"

    db.session.commit()
    return schedule_count, deleted_optional


def chunk_students(students, size):
    batches = [students[index:index + size] for index in range(0, len(students), size)]

    if len(batches) > 1 and len(batches[-1]) < 3:
        last_batch = batches[-1]
        previous_batch = batches[-2]

        while len(last_batch) < 3 and len(previous_batch) > 3:
            last_batch.insert(0, previous_batch.pop())

        if len(last_batch) < 3 and len(previous_batch) + len(last_batch) <= 5:
            previous_batch.extend(last_batch)
            batches.pop()

    return batches


def build_interview_batches(students, strategy):
    if strategy == "eligible_only":
        return chunk_students(students, DEFAULT_BATCH_SIZE)

    if strategy == "by_department":
        batches = []
        departments = sorted({student.department or "未填寫" for student in students})
        for department in departments:
            department_students = [student for student in students if (student.department or "未填寫") == department]
            batches.extend(chunk_students(department_students, DEFAULT_BATCH_SIZE))
        return batches

    if strategy == "by_teacher_capacity":
        return chunk_students(students, 3)

    return chunk_students(students, DEFAULT_BATCH_SIZE)


@interviews_bp.post("/auto-schedule")
def auto_schedule_interviews():
    payload = request.get_json(silent=True) or {}
    strategy = payload.get("strategy") or "all_imported"
    all_students = Student.query.order_by(Student.student_code.asc()).all()
    ready_students = [student for student in all_students if student.admission_status == "可安排面試"]
    eligible_students = ready_students if strategy == "eligible_only" else all_students
    pending_unscheduled_count = len(all_students) - len(ready_students) if strategy == "eligible_only" else 0
    interview_batches = build_interview_batches(eligible_students, strategy)

    base_date = date.today() + timedelta(days=3)
    scheduled = []
    scheduled_applicant_count = 0
    online_applicant_count = 0
    onsite_applicant_count = 0

    for session_index, batch_students in enumerate(interview_batches):
        day_offset = session_index // len(TIME_SLOTS)
        slot = TIME_SLOTS[session_index % len(TIME_SLOTS)]
        teachers = TEACHER_GROUPS[session_index % len(TEACHER_GROUPS)]
        location = LOCATIONS[session_index % len(LOCATIONS)]
        mode = "線上面試" if location.startswith("線上") else "實體面試"
        event_date = base_date + timedelta(days=day_offset)
        event_time = datetime.strptime(slot, "%H:%M").time()
        batch_no = f"INT-{event_date.strftime('%Y%m%d')}-{session_index + 1:02d}"
        title = f"面試批次 {batch_no}"

        for student in batch_students:
            existing_schedule = Schedule.query.filter_by(title=title, student_id=student.id).first()
            if existing_schedule is None:
                existing_schedule = Schedule(
                    title=title,
                    student=student,
                    status="Scheduled",
                    notification_status="未通知",
                    event_date=event_date,
                    event_time=event_time,
                    location=location,
                )
                db.session.add(existing_schedule)
            else:
                existing_schedule.event_date = event_date
                existing_schedule.event_time = event_time
                existing_schedule.location = location
                existing_schedule.status = "Scheduled"
                existing_schedule.notification_status = existing_schedule.notification_status or "未通知"

            student.interview_date = event_date
            student.assigned_teacher = "、".join(teachers)
            student.interview_mode = mode
            student.interview_room = location
            student.interview_status = "已排程"

        scheduled_applicant_count += len(batch_students)
        if mode == "線上面試":
            online_applicant_count += len(batch_students)
        else:
            onsite_applicant_count += len(batch_students)

        scheduled.append({
            "batch": batch_no,
            "title": title,
            "strategy": strategy,
            "date": event_date.isoformat(),
            "time": slot,
            "mode": mode,
            "location": location,
            "teachers": teachers,
            "status": "已排程",
            "notification_status": "未通知",
            "applicant_count": len(batch_students),
            "applicants": [
                {
                    "student_id": student.student_code,
                    "name": student.name,
                    "nationality": student.nationality,
                    "department": student.department,
                    "interview_date": event_date.isoformat(),
                    "interview_time": slot,
                    "mode": mode,
                    "location": location,
                    "teacher_name": "、".join(teachers),
                    "status": "已排程",
                }
                for student in batch_students
            ],
        })

    db.session.commit()
    return {
        "message": "面試排程完成",
        "scheduled_count": len(scheduled),
        "scheduled_applicant_count": scheduled_applicant_count,
        "pending_unscheduled_count": pending_unscheduled_count,
        "average_applicants_per_session": round(scheduled_applicant_count / len(scheduled), 1) if scheduled else 0,
        "online_count": online_applicant_count,
        "onsite_count": onsite_applicant_count,
        "schedules": scheduled,
    }


@interviews_bp.delete("/clear-all")
def clear_all_interviews():
    schedule_count, deleted_optional = clear_interview_tables()

    return {
        "message": "面試排程資料已清空",
        "deleted": {
            "schedules": schedule_count,
            "interviews": schedule_count + deleted_optional.get("interviews", 0),
            "interview_batches": deleted_optional.get("interview_batches", 0),
            "interview_applicants": deleted_optional.get("interview_applicants", 0),
            "optional_tables": deleted_optional,
        },
    }
