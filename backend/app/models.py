from datetime import datetime

from .extensions import db


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
        }


class Student(TimestampMixin, db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    student_code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    chinese_name = db.Column(db.String(120))
    gender = db.Column(db.String(20), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    nationality = db.Column(db.String(80), nullable=False)
    passport_no = db.Column(db.String(50))
    arc_no = db.Column(db.String(50))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(120), unique=True)
    address = db.Column(db.String(255))
    department = db.Column(db.String(120), nullable=False)
    grade = db.Column(db.String(50), nullable=False)
    admission_type = db.Column(db.String(120), nullable=False)
    admission_status = db.Column(db.String(50), nullable=False, default="Pending")
    document_status = db.Column(db.String(50), nullable=False, default="待補件")
    application_date = db.Column(db.Date, nullable=False)
    interview_date = db.Column(db.Date)
    enrollment_date = db.Column(db.Date)
    emergency_contact = db.Column(db.String(120))
    emergency_phone = db.Column(db.String(50))
    documents = db.Column(db.JSON, nullable=False, default=list)
    gpa = db.Column(db.Float)
    academic_score = db.Column(db.Float, nullable=False, default=0)
    language_score = db.Column(db.Float, nullable=False, default=0)
    interview_score = db.Column(db.Float, nullable=False, default=0)
    motivation_score = db.Column(db.Float, nullable=False, default=0)
    bonus_score = db.Column(db.Float, nullable=False, default=0)
    total_score = db.Column(db.Float, nullable=False, default=0)
    ranking = db.Column(db.Integer)
    recommendation = db.Column(db.String(50))
    comment = db.Column(db.Text)
    assigned_teacher = db.Column(db.String(120))
    interview_mode = db.Column(db.String(50))
    interview_room = db.Column(db.String(120))
    interview_status = db.Column(db.String(50), nullable=False, default="未安排")
    note = db.Column(db.Text)

    schedules = db.relationship("Schedule", back_populates="student", lazy=True)

    def to_dict(self):
        return {
            "id": self.student_code,
            "name": self.name,
            "chineseName": self.chinese_name or "",
            "gender": self.gender,
            "age": self.age,
            "nationality": self.nationality,
            "passportNo": self.passport_no or "",
            "arcNo": self.arc_no or "",
            "phone": self.phone or "",
            "email": self.email or "",
            "address": self.address or "",
            "department": self.department,
            "grade": self.grade,
            "admissionType": self.admission_type,
            "admissionStatus": self.admission_status,
            "documentStatus": self.document_status,
            "applicationDate": self.application_date.isoformat() if self.application_date else "",
            "interviewDate": self.interview_date.isoformat() if self.interview_date else "",
            "enrollmentDate": self.enrollment_date.isoformat() if self.enrollment_date else "",
            "emergencyContact": self.emergency_contact or "",
            "emergencyPhone": self.emergency_phone or "",
            "documents": self.documents or [],
            "gpa": self.gpa,
            "academicScore": self.academic_score,
            "languageScore": self.language_score,
            "interviewScore": self.interview_score,
            "motivationScore": self.motivation_score,
            "bonusScore": self.bonus_score,
            "totalScore": self.total_score,
            "rank": self.ranking,
            "recommendation": self.recommendation or "",
            "comment": self.comment or "",
            "assignedTeacher": self.assigned_teacher or "",
            "interviewMode": self.interview_mode or "",
            "interviewRoom": self.interview_room or "",
            "interviewStatus": self.interview_status,
            "note": self.note or "",
        }


class Schedule(TimestampMixin, db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    event_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="Scheduled")
    notification_status = db.Column(db.String(50), nullable=False, default="未通知")
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"))

    student = db.relationship("Student", back_populates="schedules")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date": self.event_date.isoformat(),
            "time": self.event_time.strftime("%H:%M"),
            "location": self.location,
            "status": self.status,
            "notificationStatus": self.notification_status or "未通知",
            "studentId": self.student.student_code if self.student else None,
            "studentName": self.student.name if self.student else "",
            "department": self.student.department if self.student else "",
            "teacher": self.student.assigned_teacher if self.student else "",
            "mode": self.student.interview_mode if self.student else "",
        }
