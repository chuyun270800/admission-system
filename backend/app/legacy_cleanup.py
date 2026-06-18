from .extensions import db
from .models import Schedule, Student, User


LEGACY_DEMO_STUDENT_CODES = ["FS001", "FS002", "FS003", "FS004", "FS005"]
LEGACY_DEMO_NAMES = ["Nguyen Huu Hai", "Tran Thi Linh", "Aisyah Noor", "Budi Santoso", "Maria Santos"]


def remove_legacy_demo_data():
    legacy_students = Student.query.filter(
        (Student.student_code.in_(LEGACY_DEMO_STUDENT_CODES)) | (Student.name.in_(LEGACY_DEMO_NAMES))
    ).all()
    legacy_student_ids = [student.id for student in legacy_students]

    if legacy_student_ids:
        Schedule.query.filter(Schedule.student_id.in_(legacy_student_ids)).delete(synchronize_session=False)

    Schedule.query.filter(
        Schedule.title.like("%FS001%")
        | Schedule.title.like("%FS002%")
        | Schedule.title.like("%FS003%")
        | Schedule.title.like("%FS004%")
        | Schedule.title.like("%FS005%")
    ).delete(synchronize_session=False)

    for student in legacy_students:
        db.session.delete(student)

    User.query.filter(User.username != "admin").delete(synchronize_session=False)
    db.session.commit()
