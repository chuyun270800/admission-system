import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  FileText,
  Globe2,
  GraduationCap,
  LogOut,
  Plus,
  ScrollText,
  SquarePen,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import {
  autoClassifyStudents,
  autoScheduleInterviews,
  clearAllDemoData,
  clearAllInterviews,
  createSchedule,
  createStudent,
  deleteStudent,
  exportInterviewNotificationsExcel,
  exportInterviewListExcel,
  exportResultsExcel,
  exportScoringTemplateExcel,
  fetchRankingResults,
  fetchSchedules,
  fetchStudents,
  generateRankingResults,
  importScoresFile,
  importStudentsFile,
  loginUser,
  saveStudentScore,
  updateScheduleNotificationStatus,
  updateStudent,
} from "./services/api";

const USER_STORAGE_KEY = "admission-system-user";

const emptyStudentForm = {
  id: "",
  name: "",
  chineseName: "",
  gender: "Male",
  age: 20,
  nationality: "Vietnam",
  passportNo: "",
  arcNo: "",
  phone: "",
  email: "",
  address: "",
  department: "Computer Science",
  grade: "Year 1",
  admissionType: "International Student Admission",
  admissionStatus: "Pending",
  applicationDate: "2026-04-15",
  interviewDate: "2026-04-20",
  enrollmentDate: "2026-09-01",
  emergencyContact: "",
  emergencyPhone: "",
  documents: ["Passport"],
  note: "",
};

const emptyScheduleForm = {
  applicantId: "",
  title: "",
  date: "",
  time: "",
  location: "",
  status: "Scheduled",
  teacher: "王志明 老師",
  mode: "實體面試",
};

const documentCatalog = [
  "護照",
  "歷年成績單",
  "語言能力證明",
  "讀書計畫",
  "推薦信",
];

const interviewTeacherOptions = ["王志明 老師", "林美玲 老師", "陳建宏 老師", "張雅婷 老師"];
const interviewLocationOptions = ["國際處會議室 A", "招生面試室 B", "Google Meet / Zoom / Teams 連結"];
const interviewModeOptions = ["實體面試", "線上面試"];
const interviewStatusOptions = ["已排程", "已完成", "待確認", "取消"];
const interviewNotificationStatusOptions = ["未通知", "已通知", "已完成"];
const interviewTimeOptions = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});
const schedulingStrategyOptions = [
  { value: "eligible_only", label: "只安排「可安排面試」申請人" },
  { value: "all_imported", label: "安排所有已匯入申請人" },
  { value: "by_department", label: "依系所分批安排" },
  { value: "by_teacher_capacity", label: "依教師容量分批安排" },
];

const rolePermissions = {
  admin: ["dashboard", "applicants", "interview", "scoring", "ranking", "recommendation", "excel"],
  teacher: ["applicants", "interview", "scoring"],
  viewer: ["dashboard", "applicants", "ranking", "recommendation"],
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #eef6ff 0%, #f8fbff 38%, #edf2f7 100%)",
    color: "#0f172a",
    fontFamily: "'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei', sans-serif",
  },
  loginWrap: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 28,
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 24,
    alignItems: "center",
  },
  heroCard: {
    background: "linear-gradient(145deg, #0f172a 0%, #163b7a 55%, #0f766e 100%)",
    color: "white",
    borderRadius: 32,
    padding: 40,
    boxShadow: "0 30px 70px rgba(15, 23, 42, 0.22)",
  },
  loginCard: {
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(10px)",
    borderRadius: 32,
    padding: 34,
    boxShadow: "0 24px 60px rgba(15,23,42,0.08)",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.12)",
    color: "white",
    borderRadius: 999,
    padding: "10px 16px",
    fontSize: 13,
    marginBottom: 20,
  },
  h1: { fontSize: 46, lineHeight: 1.12, margin: 0, marginBottom: 18, fontWeight: 900 },
  p: { fontSize: 17, lineHeight: 1.8, margin: 0, opacity: 0.94 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 28 },
  featureCard: {
    background: "rgba(255,255,255,0.11)",
    borderRadius: 22,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  appWrap: {
    maxWidth: 1540,
    margin: "0 auto",
    padding: 22,
    display: "grid",
    gridTemplateColumns: "286px 1fr",
    gap: 22,
  },
  sidebar: {
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 52%, #0f3d5f 100%)",
    color: "white",
    borderRadius: 30,
    padding: 24,
    minHeight: "calc(100vh - 44px)",
    boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
  },
  sideButton: (active) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
    border: "1px solid",
    borderColor: active ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.06)",
    cursor: "pointer",
    borderRadius: 18,
    padding: "14px 16px",
    marginBottom: 10,
    fontSize: 15,
    fontWeight: 700,
    background: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.06)",
    color: active ? "#0f172a" : "white",
    textAlign: "left",
    boxShadow: active ? "0 16px 34px rgba(15,23,42,0.14)" : "none",
  }),
  main: { display: "flex", flexDirection: "column", gap: 20 },
  topbar: {
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 18px 44px rgba(15,23,42,0.07)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 14,
  },
  statCard: {
    background: "rgba(255,255,255,0.93)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
    border: "1px solid rgba(226,232,240,0.9)",
  },
  contentCard: {
    background: "rgba(255,255,255,0.94)",
    borderRadius: 28,
    padding: 22,
    boxShadow: "0 16px 36px rgba(15,23,42,0.06)",
    border: "1px solid rgba(226,232,240,0.92)",
  },
  compactCard: {
    background: "#f8fbff",
    borderRadius: 20,
    padding: 16,
    border: "1px solid #dbe7f5",
  },
  twoCol: { display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 },
  threeCol: { display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.8fr", gap: 20 },
  row: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7e1ec",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "white",
    marginBottom: 0,
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d7e1ec",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    background: "white",
  },
  button: {
    background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  buttonLight: {
    background: "#e8eef6",
    color: "#0f172a",
    border: "1px solid #d2dceb",
    borderRadius: 14,
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonDanger: {
    background: "#fff1f2",
    color: "#be123c",
    border: "1px solid #fecdd3",
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 10px", borderBottom: "1px solid #dbe5ef", color: "#64748b", fontSize: 13 },
  td: { padding: "14px 10px", borderBottom: "1px solid #eef2f6", verticalAlign: "top" },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 700,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#eef2ff",
    color: "#334155",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  infoBanner: {
    background: "#eff6ff",
    color: "#1d4ed8",
    borderRadius: 18,
    padding: "14px 16px",
  },
  errorBanner: {
    background: "#fff1f2",
    color: "#be123c",
    borderRadius: 18,
    padding: "14px 16px",
  },
  muted: { color: "#64748b", fontSize: 13, lineHeight: 1.7 },
  listCard: {
    border: "1px solid #dbe7f5",
    borderRadius: 18,
    padding: 16,
    background: "#fbfdff",
    cursor: "pointer",
    marginBottom: 12,
  },
  scoreBox: {
    background: "linear-gradient(135deg, #0f172a 0%, #164e63 100%)",
    color: "white",
    borderRadius: 24,
    padding: 18,
  },
  workflowStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 18,
  },
  workflowStep: {
    background: "#f8fbff",
    border: "1px solid #dbe7f5",
    borderRadius: 14,
    padding: "12px 10px",
    minHeight: 58,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  actionPanel: {
    border: "1px solid #dbe7f5",
    borderRadius: 16,
    padding: 14,
    background: "#fbfdff",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  summaryPanel: {
    background: "white",
    border: "1px solid #dbe7f5",
    borderRadius: 14,
    padding: 12,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "white",
  },
};

function readStoredUser() {
  const stored = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function toDisplayRole(role) {
  const map = {
    admin: "招生管理員",
    teacher: "教師",
    viewer: "委員會成員",
    staff: "承辦人員",
    Administrator: "招生管理員",
    Staff: "承辦人員",
  };
  return map[role] || role || "招生管理員";
}

function canAccessPage(user, page) {
  const role = user?.role || "admin";
  return (rolePermissions[role] || rolePermissions.admin).includes(page);
}

function toChineseAdmissionStatus(status) {
  const map = {
    Approved: "審查通過",
    Pending: "待審查",
    Interview: "面試階段",
    Rejected: "不錄取",
    "待補件": "待補件",
    "待審查": "待審查",
    "可安排面試": "可安排面試",
  };
  return map[status] || status;
}

function getDocumentState(documentName, student) {
  const existingDocs = new Set(student.documents || []);
  const fallbackMap = {
    護照: ["Passport"],
    歷年成績單: ["Transcript"],
    語言能力證明: ["Language Certificate"],
    讀書計畫: ["Study Plan"],
    推薦信: ["Recommendation Letter"],
  };
  const linked = fallbackMap[documentName] || [];
  const completed = existingDocs.has(documentName) || linked.some((item) => existingDocs.has(item));
  return completed ? "已收件" : "待補件";
}

function parseScheduleStatus(status) {
  const map = {
    Scheduled: "已排程",
    Completed: "已完成",
    Pending: "待確認",
    Cancelled: "取消",
  };
  return map[status] || status;
}

function toBackendScheduleStatus(status) {
  const map = {
    已排程: "Scheduled",
    已完成: "Completed",
    待確認: "Pending",
    取消: "Cancelled",
  };
  return map[status] || status;
}

function isOnlineMeetingLink(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function renderInterviewLocation(mode, location) {
  if (mode === "線上面試" && isOnlineMeetingLink(location)) {
    return (
      <a href={location} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 800 }}>
        {location}
      </a>
    );
  }

  return location || "未填寫";
}

function getInterviewType(teacherCount, applicantCount) {
  if (teacherCount > 1 && applicantCount > 1) return "多位教師對多位學生";
  if (teacherCount > 1) return "多位教師對一位學生";
  if (applicantCount > 1) return "一位教師對多位學生";
  return "一位教師對一位學生";
}

function normalizeTeacherList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(/[、,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstPresentValue(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
}

function normalizeBatchPreviewRow(row, studentLookup) {
  const studentId = firstPresentValue(row, ["student_id", "studentId", "id"], "");
  const matchedStudent = studentLookup.get(studentId) || {};
  const documents = firstPresentValue(row, ["documents"], matchedStudent.documents || []);
  const documentStatus = firstPresentValue(row, ["document_status", "documentStatus"], matchedStudent.documentStatus || "");
  const admissionStatus = firstPresentValue(row, ["admission_status", "admissionStatus", "recommendation"], matchedStudent.admissionStatus || "");
  const scheduleText = row?.date && row?.time ? `${row.date} ${row.time}` : row?.date;
  const interviewDate = firstPresentValue(row, ["interview_date", "interviewDate", "date"], matchedStudent.interviewDate || "");
  const interviewTime = firstPresentValue(row, ["interview_time", "interviewTime", "time"], "");
  const mode = firstPresentValue(row, ["mode", "interview_mode", "interviewMode"], matchedStudent.interviewMode || "");
  const location = firstPresentValue(row, ["location", "room", "interview_room", "interviewRoom"], matchedStudent.interviewRoom || "");
  const teacherName = firstPresentValue(row, ["teacher_name", "teacherName", "teacher", "assigned_teacher", "assignedTeacher"], matchedStudent.assignedTeacher || "");

  return {
    student_id: studentId,
    name: firstPresentValue(row, ["name", "student_name", "studentName", "applicant_name", "applicantName"], matchedStudent.name || ""),
    nationality: firstPresentValue(row, ["nationality"], matchedStudent.nationality || ""),
    department: firstPresentValue(row, ["department"], matchedStudent.department || ""),
    email: firstPresentValue(row, ["email"], matchedStudent.email || ""),
    documents: Array.isArray(documents) ? documents : String(documents || "").split(",").map((item) => item.trim()).filter(Boolean),
    document_status: documentStatus || (Array.isArray(documents) && documents.length ? "已收件" : ""),
    admission_status: admissionStatus || scheduleText || row?.message || "",
    interview_date: interviewDate,
    interview_time: interviewTime,
    mode,
    location,
    teacher_name: Array.isArray(teacherName) ? teacherName.join("、") : teacherName,
    status: row?.status || matchedStudent.interviewStatus || "",
    message: row?.message || "",
    rank: row?.rank,
    total_score: row?.total_score,
    recommendation: row?.recommendation || "",
  };
}

function getImportPreviewSourceRows(result) {
  if (!result) return [];
  if (result.preview) return result.preview;
  if (result.students) return result.students;

  if (result.schedules) {
    return result.schedules.flatMap((schedule) => {
      const teacherName = normalizeTeacherList(schedule.teacher_name || schedule.teacherName || schedule.teacher || schedule.teachers).join("、");

      return (schedule.applicants || []).map((applicant) => ({
        ...applicant,
        interview_date: applicant.interview_date || schedule.interview_date || schedule.date,
        interview_time: applicant.interview_time || schedule.interview_time || schedule.time,
        mode: applicant.mode || schedule.mode,
        location: applicant.location || schedule.location,
        teacher_name: applicant.teacher_name || teacherName,
        status: applicant.status || schedule.status,
      }));
    });
  }

  return [];
}

function computeTotalScore(score) {
  return score.academic + score.language + score.performance + score.motivation + score.bonus;
}

function hasCompletedScore(score) {
  return Boolean(score) && ["academic", "language", "performance", "motivation", "bonus"].some((field) => Number(score[field] || 0) > 0);
}

function scoreFromStudent(student) {
  return {
    academic: Number(student.academicScore || 0),
    language: Number(student.languageScore || 0),
    performance: Number(student.interviewScore || 0),
    motivation: Number(student.motivationScore || 0),
    bonus: Number(student.bonusScore || 0),
    comment: student.comment || "",
  };
}

function deriveRecommendation(totalScore) {
  if (totalScore >= 86) return "建議錄取";
  if (totalScore >= 76) return "備取";
  if (totalScore >= 65) return "再評估";
  return "不錄取";
}

function getRecommendationColor(recommendation) {
  const map = {
    建議錄取: { bg: "#dcfce7", color: "#166534" },
    備取: { bg: "#dbeafe", color: "#1d4ed8" },
    再評估: { bg: "#fef3c7", color: "#92400e" },
    不錄取: { bg: "#ffe4e6", color: "#be123c" },
  };
  return map[recommendation] || { bg: "#e2e8f0", color: "#334155" };
}

function getGenericStatusStyle(status) {
  const map = {
    待審查: { bg: "#fef3c7", color: "#92400e" },
    面試階段: { bg: "#dbeafe", color: "#1d4ed8" },
    審查通過: { bg: "#dcfce7", color: "#166534" },
    不錄取: { bg: "#ffe4e6", color: "#be123c" },
    已排程: { bg: "#dbeafe", color: "#1d4ed8" },
    待面試: { bg: "#fef3c7", color: "#92400e" },
    已完成: { bg: "#dcfce7", color: "#166534" },
    已收件: { bg: "#dcfce7", color: "#166534" },
    待補件: { bg: "#fff7ed", color: "#c2410c" },
    文件齊全: { bg: "#dcfce7", color: "#166534" },
    待確認: { bg: "#fef3c7", color: "#92400e" },
    取消: { bg: "#fee2e2", color: "#b91c1c" },
    未通知: { bg: "#f1f5f9", color: "#475569" },
    已通知: { bg: "#dbeafe", color: "#1d4ed8" },
  };
  return map[status] || { bg: "#e2e8f0", color: "#334155" };
}

function StatusBadge({ status }) {
  const style = getGenericStatusStyle(status);
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}

function StatCard({ title, value, icon: Icon, hint }) {
  return (
    <div style={styles.statCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 13 }}>{title}</div>
          <div style={{ fontSize: 32, fontWeight: 900, marginTop: 8 }}>{value}</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 10, lineHeight: 1.6 }}>{hint}</div>
        </div>
        <div style={{ background: "#eff6ff", padding: 12, borderRadius: 18 }}>
          <Icon size={20} color="#1d4ed8" />
        </div>
      </div>
    </div>
  );
}

function LabelValue({ label, value }) {
  return (
    <div>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value || "未填寫"}</div>
    </div>
  );
}

export default function AdmissionManagementSystem() {
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentUser, setCurrentUser] = useState(readStoredUser);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [departmentFilter, setDepartmentFilter] = useState("全部");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [newSchedule, setNewSchedule] = useState({ interview_time: "10:00" });
  const [interviewRecords, setInterviewRecords] = useState({});
  const [scoreRecords, setScoreRecords] = useState({});
  const [recommendationOverrides, setRecommendationOverrides] = useState({});
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "1234" });
  const [loginError, setLoginError] = useState("");
  const [dataError, setDataError] = useState("");
  const [dataNotice, setDataNotice] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [rankingResults, setRankingResults] = useState([]);
  const [actionLoading, setActionLoading] = useState("");
  const [excelTab, setExcelTab] = useState("import");
  const [scoreImportFile, setScoreImportFile] = useState(null);
  const [interviewFilters, setInterviewFilters] = useState({ date: "", mode: "全部", teacher: "全部", department: "全部", status: "全部" });
  const [selectedInterviewKey, setSelectedInterviewKey] = useState("");
  const [schedulingStrategy, setSchedulingStrategy] = useState("all_imported");

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    if (!canAccessPage(currentUser, currentPage)) {
      setCurrentPage((rolePermissions[currentUser.role] || rolePermissions.admin)[0]);
      return;
    }

    let active = true;

    async function loadData() {
      setDataLoading(true);
      setDataError("");

      try {
        const [studentData, scheduleData, resultData] = await Promise.all([fetchStudents(), fetchSchedules(), fetchRankingResults()]);
        if (!active) return;

        setStudents(studentData);
        setSchedules(scheduleData);
        setRankingResults(resultData.results || []);
        setSelectedStudentId((current) => current || studentData[0]?.id || "");
      } catch (error) {
        if (active) setDataError(error.message);
      } finally {
        if (active) setDataLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [currentUser, currentPage]);

  useEffect(() => {
    if (!students.length) {
      setInterviewRecords({});
      setScoreRecords({});
      setSelectedStudentId("");
      setSelectedInterviewKey("");
      return;
    }

    setInterviewRecords(() => {
      const next = {};

      students.forEach((student) => {
        const matchedSchedule = schedules.find((item) => item.studentId === student.id);

        next[student.id] = {
          teacher: student.assignedTeacher || matchedSchedule?.teacher || "",
          mode: student.interviewMode || matchedSchedule?.mode || "",
          room: student.interviewRoom || matchedSchedule?.location || "",
          status: student.interviewStatus || (matchedSchedule ? parseScheduleStatus(matchedSchedule.status) : "未安排"),
          date: matchedSchedule?.date || student.interviewDate || "",
          time: matchedSchedule?.time || "",
        };
      });

      return next;
    });

    setScoreRecords((prev) => {
      const next = {};

      students.forEach((student) => {
        next[student.id] = prev[student.id] || scoreFromStudent(student);
      });

      return next;
    });
  }, [students, schedules]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || students[0] || null,
    [students, selectedStudentId]
  );

  const departmentOptions = useMemo(
    () => ["全部", ...Array.from(new Set(students.map((student) => student.department)))],
    [students]
  );

  const applicantRecords = useMemo(() => {
    return students.map((student) => {
      const interview = interviewRecords[student.id] || {};
      const score = scoreRecords[student.id] || { academic: 0, language: 0, performance: 0, motivation: 0, bonus: 0, comment: "" };
      const totalScore = computeTotalScore(score);
      const recommendation = recommendationOverrides[student.id] || student.recommendation || deriveRecommendation(totalScore);
      const documentStatus = documentCatalog.map((item) => ({
        name: item,
        status: getDocumentState(item, student),
      }));

      return {
        ...student,
        interview,
        score,
        totalScore,
        recommendation,
        documentStatus,
        admissionLabel: toChineseAdmissionStatus(student.admissionStatus),
      };
    });
  }, [students, interviewRecords, scoreRecords, recommendationOverrides]);

  const filteredApplicants = useMemo(() => {
    return applicantRecords.filter((student) => {
      const text = `${student.id} ${student.name} ${student.chineseName} ${student.department} ${student.email}`.toLowerCase();
      const matchedSearch = text.includes(searchTerm.toLowerCase());
      const matchedStatus = statusFilter === "全部" || student.recommendation === statusFilter || student.admissionLabel === statusFilter;
      const matchedDepartment = departmentFilter === "全部" || student.department === departmentFilter;
      return matchedSearch && matchedStatus && matchedDepartment;
    });
  }, [applicantRecords, searchTerm, statusFilter, departmentFilter]);

  const dashboardStats = useMemo(() => {
    const total = applicantRecords.length;
    const pending = applicantRecords.filter((item) => item.admissionLabel === "待審查").length;
    const interviewCompleted = applicantRecords.filter((item) => item.interview.status === "已完成").length;
    const recommended = applicantRecords.filter((item) => item.recommendation === "建議錄取").length;
    const waiting = applicantRecords.filter((item) => item.recommendation === "備取").length;
    const rejected = applicantRecords.filter((item) => item.recommendation === "不錄取").length;

    return { total, pending, interviewCompleted, recommended, waiting, rejected };
  }, [applicantRecords]);

  const rankingRows = useMemo(() => {
    return [...applicantRecords].sort((a, b) => {
      if (a.rank && b.rank) return a.rank - b.rank;
      return b.totalScore - a.totalScore;
    });
  }, [applicantRecords]);

  const importPreviewRows = useMemo(() => {
    if (!importResult) return [];
    const studentLookup = new Map(students.map((student) => [student.id, student]));
    const rows = getImportPreviewSourceRows(importResult);
    return rows.map((row) => normalizeBatchPreviewRow(row, studentLookup));
  }, [importResult, students]);

  const excelWorkflowSummary = useMemo(() => {
    const completeData = students.filter((student) => student.id && student.name && student.nationality && student.department && student.email).length;
    const pendingDocuments = students.filter((student) => student.admissionStatus === "待補件" || student.documentStatus === "待補件").length;
    const scheduled = students.filter((student) => student.interviewStatus === "已排程" || student.interviewStatus === "已完成").length;
    const scored = students.filter((student) => hasCompletedScore({
      academic: student.academicScore,
      language: student.languageScore,
      performance: student.interviewScore,
      motivation: student.motivationScore,
      bonus: student.bonusScore,
    })).length;
    const recommended = students.filter((student) => student.recommendation === "建議錄取").length;

    return {
      imported: students.length,
      completeData,
      pendingDocuments,
      scheduled,
      scored,
      recommended,
    };
  }, [students]);

  const interviewSessions = useMemo(() => {
    const studentLookup = new Map(students.map((student) => [student.id, student]));
    const grouped = new Map();

    schedules.forEach((schedule) => {
      const student = studentLookup.get(schedule.studentId) || {};
      const title = schedule.title || `面試批次 ${schedule.id}`;
      const key = `${title}|${schedule.date}|${schedule.time}|${schedule.location}`;
      const teachers = normalizeTeacherList(schedule.teacher || student.assignedTeacher || student.interview?.teacher || "待指派");
      const mode = schedule.mode || student.interviewMode || (schedule.location?.startsWith("線上") ? "線上面試" : "實體面試");
      const status = parseScheduleStatus(schedule.status || student.interviewStatus || "待確認");
      const notificationStatus = schedule.notificationStatus || "未通知";

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          batch: title.replace(/^面試批次\s*/, ""),
          title,
          date: schedule.date,
          time: schedule.time,
          mode,
          location: schedule.location || "待確認",
          teachers,
          departments: new Set(),
          applicants: [],
          status,
          notificationStatus,
        });
      }

      const session = grouped.get(key);
      teachers.forEach((teacher) => {
        if (!session.teachers.includes(teacher)) session.teachers.push(teacher);
      });

      if (schedule.department || student.department) {
        session.departments.add(schedule.department || student.department);
      }

      if (schedule.studentId) {
        session.applicants.push({
          id: schedule.studentId,
          name: schedule.studentName || student.name || "未命名申請人",
          department: schedule.department || student.department || "未填寫",
          email: student.email || "",
          date: schedule.date,
          time: schedule.time,
          mode,
          location: schedule.location || student.interviewRoom || "",
          teacher: teachers.join("、"),
        });
      }
    });

    return Array.from(grouped.values())
      .map((session) => ({
        ...session,
        departments: Array.from(session.departments),
        applicantCount: session.applicants.length,
        interviewType: getInterviewType(session.teachers.length, session.applicants.length),
      }))
      .filter((session) => session.applicantCount > 0)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [schedules, students]);

  const filteredInterviewSessions = useMemo(() => {
    return interviewSessions.filter((session) => {
      const matchedDate = !interviewFilters.date || session.date === interviewFilters.date;
      const matchedMode = interviewFilters.mode === "全部" || session.mode === interviewFilters.mode;
      const matchedTeacher = interviewFilters.teacher === "全部" || session.teachers.includes(interviewFilters.teacher);
      const matchedDepartment = interviewFilters.department === "全部" || session.departments.includes(interviewFilters.department);
      const matchedStatus = interviewFilters.status === "全部" || session.status === interviewFilters.status || session.notificationStatus === interviewFilters.status;
      return matchedDate && matchedMode && matchedTeacher && matchedDepartment && matchedStatus;
    });
  }, [interviewFilters, interviewSessions]);

  const selectedInterviewSession = useMemo(() => {
    return interviewSessions.find((session) => session.key === selectedInterviewKey) || null;
  }, [interviewSessions, selectedInterviewKey]);

  const userRole = currentUser?.role || "admin";
  const isAdmin = userRole === "admin";
  const canEditApplicants = isAdmin || userRole === "teacher";

  const resetStudentForm = () => {
    setStudentForm({ ...emptyStudentForm });
    setEditingStudentId(null);
  };

  const refreshStudents = async () => {
    const studentData = await fetchStudents();
    setStudents(studentData);
    setSelectedStudentId((current) => current || studentData[0]?.id || "");
    return studentData;
  };

  const refreshSchedules = async () => {
    const scheduleData = await fetchSchedules();
    setSchedules(scheduleData);
    return scheduleData;
  };

  const refreshRankingResults = async () => {
    const resultData = await fetchRankingResults();
    setRankingResults(resultData.results || []);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setLoginError("");

    try {
      const user = await loginUser(loginForm);
      const defaultPage = canAccessPage(user, "dashboard") ? "dashboard" : (rolePermissions[user.role] || rolePermissions.admin)[0];
      setCurrentUser({
        ...user,
        name: user.full_name || user.username,
      });
      setCurrentPage(defaultPage);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage("dashboard");
    setStudents([]);
    setSchedules([]);
    setSelectedStudentId("");
    setDataError("");
  };

  const handleSaveStudent = async (event) => {
    event.preventDefault();
    setDataError("");

    const payload = {
      ...studentForm,
      age: Number(studentForm.age),
      documents: studentForm.documents.filter(Boolean),
    };

    try {
      if (editingStudentId) {
        await updateStudent(editingStudentId, payload);
      } else {
        await createStudent(payload);
      }

      await refreshStudents();
      setShowStudentForm(false);
      resetStudentForm();
    } catch (error) {
      setDataError(error.message);
    }
  };

  const handleEditStudent = (student) => {
    setStudentForm({
      ...student,
      documents: Array.isArray(student.documents) && student.documents.length ? student.documents : ["Passport"],
    });
    setEditingStudentId(student.id);
    setShowStudentForm(true);
  };

  const handleDeleteStudent = async (studentId) => {
    setDataError("");

    try {
      await deleteStudent(studentId);
      await refreshStudents();
    } catch (error) {
      setDataError(error.message);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!scheduleForm.applicantId) {
      setDataError("請先選擇申請人。");
      return;
    }

    const applicant = students.find((student) => student.id === scheduleForm.applicantId);
    if (!applicant) {
      setDataError("找不到對應申請人。");
      return;
    }

    setDataError("");
    const interviewTime = (newSchedule.interview_time || "").slice(0, 5);

    try {
      await createSchedule({
        studentId: scheduleForm.applicantId,
        title: scheduleForm.title || `面試排程 - ${scheduleForm.applicantId}`,
        date: scheduleForm.date,
        interview_time: interviewTime,
        time: interviewTime,
        location: scheduleForm.location,
        status: scheduleForm.status,
        teacher: scheduleForm.teacher,
        mode: scheduleForm.mode,
      });

      setInterviewRecords((prev) => ({
        ...prev,
        [scheduleForm.applicantId]: {
          teacher: scheduleForm.teacher,
          mode: scheduleForm.mode,
          room: scheduleForm.location,
          status: scheduleForm.status === "Completed" ? "已完成" : "已排程",
          date: scheduleForm.date,
          time: interviewTime,
        },
      }));

      await refreshSchedules();
      const createdTitle = scheduleForm.title || `面試排程 - ${scheduleForm.applicantId}`;
      const createdLocation = scheduleForm.location;
      setSelectedInterviewKey(`${createdTitle}|${scheduleForm.date}|${interviewTime}|${createdLocation}`);
      setScheduleForm({
        ...emptyScheduleForm,
        applicantId: applicant.id,
        title: `面試排程 - ${applicant.id}`,
      });
      setNewSchedule({ interview_time: "10:00" });
    } catch (error) {
      setDataError(error.message);
    }
  };

  const handleSelectInterviewSession = (session) => {
    setSelectedInterviewKey(session.key);

    const firstApplicant = session.applicants[0];
    setScheduleForm({
      ...emptyScheduleForm,
      applicantId: firstApplicant?.id || "",
      title: session.title || "",
      date: session.date || "",
      time: session.time || "",
      location: session.location || "",
      status: toBackendScheduleStatus(session.status || "已排程"),
      teacher: session.teachers[0] || emptyScheduleForm.teacher,
      mode: session.mode || emptyScheduleForm.mode,
    });
    setNewSchedule({ interview_time: (session.time || "10:00").slice(0, 5) });
  };

  const handleMarkInterviewNotified = async (session) => {
    if (!session) return;

    setActionLoading(`notify-${session.key}`);
    setDataError("");
    setDataNotice("");

    try {
      await updateScheduleNotificationStatus({
        title: session.title,
        date: session.date,
        time: session.time,
        location: session.location,
        notificationStatus: "已通知",
      });
      await refreshSchedules();
      setDataNotice("面試批次已標記為已通知");
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleScoreChange = (studentId, field, value) => {
    setScoreRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === "comment" ? value : Number(value),
      },
    }));
  };

  const handleSaveScore = async (studentId) => {
    const score = scoreRecords[studentId];
    if (!score) return;

    setActionLoading(`score-${studentId}`);
    setDataError("");
    setDataNotice("");

    try {
      const result = await saveStudentScore(studentId, {
        student_id: studentId,
        academic_score: Number(score.academic || 0),
        language_score: Number(score.language || 0),
        interview_score: Number(score.performance || 0),
        motivation_score: Number(score.motivation || 0),
        bonus_score: Number(score.bonus || 0),
        comment: score.comment || "",
      });

      if (result.student) {
        setStudents((prev) => prev.map((student) => (student.id === studentId ? result.student : student)));
        setScoreRecords((prev) => ({
          ...prev,
          [studentId]: scoreFromStudent(result.student),
        }));
      }

      await refreshRankingResults();
      setDataNotice("評分已儲存");
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleImportScores = async () => {
    if (!scoreImportFile) {
      setDataError("請先選擇已評分 Excel 或 CSV 檔案。");
      return;
    }

    setActionLoading("scoreImport");
    setDataError("");

    try {
      const result = await importScoresFile(scoreImportFile);
      setImportResult(result);
      await refreshStudents();
      await refreshRankingResults();
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleRecommendationChange = (studentId, value) => {
    setRecommendationOverrides((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleImportStudents = async () => {
    if (!importFile) {
      setDataError("請先選擇 Excel 或 CSV 檔案。");
      return;
    }

    setActionLoading("import");
    setDataError("");

    try {
      const result = await importStudentsFile(importFile);
      setImportResult(result);
      await refreshStudents();
      await refreshRankingResults();
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleAutoClassify = async () => {
    setActionLoading("classify");
    setDataError("");

    try {
      const result = await autoClassifyStudents();
      setImportResult(result);
      await refreshStudents();
      await refreshRankingResults();
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleAutoSchedule = async () => {
    setActionLoading("schedule");
    setDataError("");

    try {
      const result = await autoScheduleInterviews({ strategy: schedulingStrategy });
      setImportResult(result);
      await refreshStudents();
      const scheduleData = await refreshSchedules();
      const firstSchedule = scheduleData[0];
      if (firstSchedule) {
        setSelectedInterviewKey(`${firstSchedule.title}|${firstSchedule.date}|${firstSchedule.time}|${firstSchedule.location}`);
      }
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleGenerateRanking = async () => {
    setActionLoading("ranking");
    setDataError("");

    try {
      const result = await generateRankingResults();
      setRankingResults(result.results || []);
      setImportResult({ message: result.message, preview: result.results?.slice(0, 20) || [] });
      await refreshStudents();
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleExcelExport = async (event, exportFn) => {
    event?.preventDefault();
    setDataError("");

    try {
      await exportFn();
    } catch (error) {
      setDataError(error.message);
    }
  };

  const handleExportResults = (event) => {
    handleExcelExport(event, exportResultsExcel);
  };

  const handleClearAllDemoData = async () => {
    const confirmed = window.confirm("確定要清空所有測試資料嗎？此操作無法復原。");
    if (!confirmed) return;

    setActionLoading("clearData");
    setDataError("");

    try {
      await clearAllDemoData();
      setStudents([]);
      setSchedules([]);
      setRankingResults([]);
      setInterviewRecords({});
      setScoreRecords({});
      setRecommendationOverrides({});
      setImportResult(null);
      setImportFile(null);
      setScoreImportFile(null);
      setSelectedStudentId("");
      setSelectedInterviewKey("");
      await Promise.all([refreshStudents(), refreshSchedules(), refreshRankingResults()]);
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  const handleClearInterviewSchedules = async () => {
    const confirmed = window.confirm("確定要清空所有面試排程資料嗎？此操作無法復原。");
    if (!confirmed) return;

    setActionLoading("clearInterviews");
    setDataError("");

    try {
      await clearAllInterviews();
      setSchedules([]);
      setInterviewRecords({});
      setSelectedInterviewKey("");
      setScheduleForm({ ...emptyScheduleForm });
      setNewSchedule({ interview_time: "10:00" });
      await Promise.all([refreshSchedules(), refreshStudents()]);
    } catch (error) {
      setDataError(error.message);
    } finally {
      setActionLoading("");
    }
  };

  if (!currentUser) {
    return (
      <div style={styles.page}>
        <div style={styles.loginWrap}>
          <div style={styles.heroCard}>
            <div style={styles.badge}>
              <ShieldCheck size={16} /> 大學招生審查管理系統
            </div>
            <h1 style={styles.h1}>外國學生招生審查平台</h1>
            <p style={styles.p}>
              提供申請資料管理、面試排程、評分審查、排名分析與錄取建議流程。
              目前採用 React 前端、Flask 後端與 SQLite 測試資料庫。
            </p>
            <div style={styles.featureGrid}>
              <div style={styles.featureCard}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>作業模組</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>審查、排程、排名</div>
              </div>
              <div style={styles.featureCard}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>登入帳號</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>admin / admin123</div>
              </div>
              <div style={styles.featureCard}>
                <div style={{ fontSize: 12, opacity: 0.8 }}>資料來源</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>Flask API 已連線</div>
              </div>
            </div>
          </div>

          <div style={styles.loginCard}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: 24, margin: "0 auto 16px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={34} color="#1d4ed8" />
              </div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>System Login</div>
              <div style={{ color: "#64748b", marginTop: 10 }}>請使用招生管理員帳號登入系統。</div>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 8, fontSize: 13, color: "#475569", fontWeight: 700 }}>帳號</div>
              <input style={styles.input} value={loginForm.username} onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })} />
              <div style={{ marginBottom: 8, marginTop: 16, fontSize: 13, color: "#475569", fontWeight: 700 }}>密碼</div>
              <input type="password" style={styles.input} value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
              {loginError ? <div style={{ ...styles.errorBanner, marginTop: 16 }}>{loginError}</div> : null}
              <button type="submit" style={{ ...styles.button, width: "100%", padding: "14px 18px", marginTop: 18 }} disabled={authLoading}>
                {authLoading ? "登入中..." : "登入系統"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { key: "dashboard", label: "儀表板", icon: Globe2 },
    { key: "applicants", label: "申請資料管理", icon: Users },
    { key: "interview", label: "面試排程", icon: CalendarDays },
    { key: "scoring", label: "面試評分", icon: ClipboardCheck },
    { key: "ranking", label: "排名分析", icon: Award },
    { key: "recommendation", label: "錄取建議", icon: FileBadge2 },
    { key: "excel", label: "Excel 匯入 / 匯出", icon: FileText },
  ].filter((item) => canAccessPage(currentUser, item.key));

  return (
    <div style={styles.page}>
      <div style={styles.appWrap}>
        <aside style={styles.sidebar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <div style={{ width: 54, height: 54, borderRadius: 20, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={26} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Admission Office</div>
              <div style={{ fontSize: 12, opacity: 0.78 }}>招生審查作業平台</div>
            </div>
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} style={styles.sideButton(currentPage === item.key)} onClick={() => setCurrentPage(item.key)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}

          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 22, padding: 18, marginTop: 24 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>本日審查摘要</div>
            <div style={styles.muted}>
              總申請人數 {dashboardStats.total} 人，已完成面試 {dashboardStats.interviewCompleted} 人，
              建議錄取 {dashboardStats.recommended} 人。
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.topbar}>
            <div>
              <div style={{ color: "#64748b", fontSize: 13 }}>招生審查中心</div>
              <div style={{ fontSize: 28, fontWeight: 900 }}>{currentUser.name || currentUser.username}</div>
              <div style={{ color: "#64748b", fontSize: 14 }}>角色：{toDisplayRole(currentUser.role)}</div>
            </div>
            <button style={{ ...styles.button, display: "flex", alignItems: "center", gap: 8 }} onClick={handleLogout}>
              <LogOut size={16} />
              登出
            </button>
          </div>

          {dataError ? <div style={styles.errorBanner}>{dataError}</div> : null}
          {dataNotice ? <div style={styles.infoBanner}>{dataNotice}</div> : null}
          {dataLoading ? <div style={styles.infoBanner}>正在同步 Flask 招生資料...</div> : null}

          {currentPage === "dashboard" && (
            <>
              <div style={styles.statGrid}>
                <StatCard title="總申請人數" value={dashboardStats.total} icon={Users} hint="本期全部申請案件" />
                <StatCard title="待審查" value={dashboardStats.pending} icon={AlertCircle} hint="尚待文件或初審" />
                <StatCard title="面試完成" value={dashboardStats.interviewCompleted} icon={CalendarDays} hint="已完成面試流程" />
                <StatCard title="建議錄取" value={dashboardStats.recommended} icon={CheckCircle2} hint="可提交系所會議" />
                <StatCard title="備取" value={dashboardStats.waiting} icon={ScrollText} hint="列入候補名單" />
                <StatCard title="不錄取" value={dashboardStats.rejected} icon={FileText} hint="未達年度標準" />
              </div>

              <div style={styles.threeCol}>
                <div style={styles.contentCard}>
                  <div style={styles.sectionHeader}>
                    <div>
                      <div style={{ fontSize: 23, fontWeight: 900 }}>申請案件總覽</div>
                      <div style={styles.muted}>掌握各申請人目前審查狀態與建議結果。</div>
                    </div>
                  </div>
                  {rankingRows.slice(0, 5).map((student, index) => (
                    <div key={student.id} style={{ ...styles.listCard, marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 900 }}>#{index + 1} {student.name}</div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{student.id} ・ {student.department}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 24, fontWeight: 900 }}>{student.totalScore}</div>
                          <StatusBadge status={student.recommendation} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>面試進度</div>
                  {applicantRecords.map((student) => (
                    <div key={student.id} style={{ ...styles.compactCard, marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{student.name}</div>
                          <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                            {student.interview.date || "待排定"} {student.interview.time ? `・ ${student.interview.time}` : ""}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13 }}>{student.interview.teacher || "待指派"} ・ {student.interview.mode || "未設定"}</div>
                        </div>
                        <StatusBadge status={student.interview.status || "待面試"} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>錄取建議分布</div>
                  {["建議錄取", "備取", "再評估", "不錄取"].map((recommendation) => {
                    const count = applicantRecords.filter((item) => item.recommendation === recommendation).length;
                    return (
                      <div key={recommendation} style={{ ...styles.compactCard, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <StatusBadge status={recommendation} />
                          <div style={{ fontWeight: 900, fontSize: 24 }}>{count}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={styles.scoreBox}>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>審查建議</div>
                    <div style={{ fontSize: 24, fontWeight: 900, marginTop: 10 }}>
                      優先審議 {rankingRows[0]?.name || "—"}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.7, opacity: 0.9 }}>
                      依總分與面試評語排序，建議優先提交系所招生委員會審議。
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentPage === "applicants" && (
            <div style={styles.twoCol}>
              <div style={styles.contentCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <div style={{ fontSize: 23, fontWeight: 900 }}>申請資料管理</div>
                    <div style={styles.muted}>集中管理申請人基本資料、文件狀態與審查進度。</div>
                  </div>
                  {canEditApplicants ? (
                    <button
                      style={{ ...styles.button, display: "flex", alignItems: "center", gap: 8 }}
                      onClick={() => {
                        resetStudentForm();
                        setShowStudentForm(true);
                      }}
                    >
                      <Plus size={16} />
                      新增申請人
                    </button>
                  ) : null}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <input style={styles.input} placeholder="搜尋學號、姓名、系所、Email" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  <select style={styles.select} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
                    {departmentOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select style={styles.select} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    {["全部", "待審查", "面試階段", "審查通過", "不錄取", "建議錄取", "備取", "再評估"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>申請編號</th>
                      <th style={styles.th}>申請人</th>
                      <th style={styles.th}>申請系所</th>
                      <th style={styles.th}>文件狀態</th>
                      <th style={styles.th}>錄取建議</th>
                      <th style={styles.th}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((student) => {
                      const pendingDocs = student.documentStatus.filter((item) => item.status === "待補件").length;
                      return (
                        <tr key={student.id}>
                          <td style={styles.td}>{student.id}</td>
                          <td style={styles.td}>
                            <button onClick={() => setSelectedStudentId(student.id)} style={{ border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: 0 }}>
                              <div style={{ fontWeight: 800 }}>{student.name}</div>
                              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{student.chineseName}</div>
                            </button>
                          </td>
                          <td style={styles.td}>
                            <div>{student.department}</div>
                            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{student.admissionType}</div>
                          </td>
                          <td style={styles.td}>
                            <StatusBadge status={pendingDocs > 0 ? "待補件" : "已收件"} />
                          </td>
                          <td style={styles.td}><StatusBadge status={student.recommendation} /></td>
                          <td style={styles.td}>
                            {canEditApplicants ? (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleEditStudent(student)} style={{ ...styles.buttonLight, padding: "10px 12px" }}><SquarePen size={15} /></button>
                                <button onClick={() => handleDeleteStudent(student.id)} style={styles.buttonDanger}><Trash2 size={15} /></button>
                              </div>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>申請人詳細資料</div>
                  {selectedStudent ? (
                    <>
                      <div style={styles.scoreBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{selectedStudent.name}</div>
                            <div style={{ marginTop: 6, opacity: 0.82 }}>{selectedStudent.chineseName}</div>
                            <div style={{ marginTop: 12, fontSize: 13, opacity: 0.85 }}>
                              {selectedStudent.department} ・ {selectedStudent.grade}
                            </div>
                          </div>
                          <StatusBadge status={applicantRecords.find((item) => item.id === selectedStudent.id)?.recommendation || "再評估"} />
                        </div>
                      </div>

                      <div style={{ ...styles.row, marginTop: 18 }}>
                        <LabelValue label="申請編號" value={selectedStudent.id} />
                        <LabelValue label="國籍" value={selectedStudent.nationality} />
                        <LabelValue label="聯絡電話" value={selectedStudent.phone} />
                        <LabelValue label="電子郵件" value={selectedStudent.email} />
                        <LabelValue label="申請類別" value={selectedStudent.admissionType} />
                        <LabelValue label="審查狀態" value={toChineseAdmissionStatus(selectedStudent.admissionStatus)} />
                      </div>

                      <div style={{ marginTop: 18 }}>
                        <div style={{ fontWeight: 800, marginBottom: 10 }}>文件狀態</div>
                        {(applicantRecords.find((item) => item.id === selectedStudent.id)?.documentStatus || []).map((item) => (
                          <div key={item.name} style={{ ...styles.compactCard, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>{item.name}</div>
                            <StatusBadge status={item.status} />
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 18 }}>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>備註</div>
                        <div style={styles.compactCard}>{selectedStudent.note || "目前無補充說明。"}</div>
                      </div>
                    </>
                  ) : (
                    <div style={styles.muted}>尚未選取申請人。</div>
                  )}
                </div>

                {showStudentForm && canEditApplicants && (
                  <div style={styles.contentCard}>
                    <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>{editingStudentId ? "編輯申請資料" : "新增申請資料"}</div>
                    <form onSubmit={handleSaveStudent}>
                      <div style={styles.formGrid}>
                        <input style={styles.input} placeholder="申請編號" value={studentForm.id} onChange={(event) => setStudentForm({ ...studentForm, id: event.target.value })} required disabled={Boolean(editingStudentId)} />
                        <input style={styles.input} placeholder="英文姓名" value={studentForm.name} onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} required />
                        <input style={styles.input} placeholder="中文姓名" value={studentForm.chineseName} onChange={(event) => setStudentForm({ ...studentForm, chineseName: event.target.value })} />
                        <input style={styles.input} type="number" placeholder="年齡" value={studentForm.age} onChange={(event) => setStudentForm({ ...studentForm, age: event.target.value })} />
                        <input style={styles.input} placeholder="國籍" value={studentForm.nationality} onChange={(event) => setStudentForm({ ...studentForm, nationality: event.target.value })} />
                        <input style={styles.input} placeholder="申請系所" value={studentForm.department} onChange={(event) => setStudentForm({ ...studentForm, department: event.target.value })} />
                        <input style={styles.input} placeholder="就讀年級" value={studentForm.grade} onChange={(event) => setStudentForm({ ...studentForm, grade: event.target.value })} />
                        <input style={styles.input} placeholder="電子郵件" value={studentForm.email} onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} />
                        <input style={styles.input} placeholder="聯絡電話" value={studentForm.phone} onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} />
                        <input style={styles.input} placeholder="護照號碼" value={studentForm.passportNo} onChange={(event) => setStudentForm({ ...studentForm, passportNo: event.target.value })} />
                        <select style={styles.select} value={studentForm.admissionStatus} onChange={(event) => setStudentForm({ ...studentForm, admissionStatus: event.target.value })}>
                          <option value="Pending">Pending</option>
                          <option value="Interview">Interview</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <input style={styles.input} placeholder="申請類別" value={studentForm.admissionType} onChange={(event) => setStudentForm({ ...studentForm, admissionType: event.target.value })} />
                        <input
                          style={{ ...styles.input, gridColumn: "1 / span 2" }}
                          placeholder="文件列表（逗號分隔）"
                          value={studentForm.documents.join(", ")}
                          onChange={(event) =>
                            setStudentForm({
                              ...studentForm,
                              documents: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                            })
                          }
                        />
                        <textarea rows={4} style={{ ...styles.input, gridColumn: "1 / span 2", resize: "vertical" }} placeholder="補充備註" value={studentForm.note} onChange={(event) => setStudentForm({ ...studentForm, note: event.target.value })} />
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                        <button type="submit" style={styles.button}>儲存資料</button>
                        <button type="button" style={styles.buttonLight} onClick={() => { setShowStudentForm(false); resetStudentForm(); }}>取消</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPage === "interview" && (
            <div style={styles.twoCol}>
              <div style={styles.contentCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <div style={{ fontSize: 23, fontWeight: 900 }}>面試排程管理</div>
                    <div style={styles.muted}>依面試批次集中檢視日期、時段、教師、地點與同場申請人。</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button style={{ ...styles.button, display: "flex", alignItems: "center", gap: 8 }} onClick={handleAutoSchedule} disabled={actionLoading === "schedule"}>
                      <CalendarDays size={16} />
                      {actionLoading === "schedule" ? "安排中..." : "自動安排面試"}
                    </button>
                    <button type="button" style={styles.buttonLight} onClick={(event) => handleExcelExport(event, exportInterviewNotificationsExcel)}>
                      匯出面試通知名單
                    </button>
                    {isAdmin ? (
                      <button style={{ ...styles.buttonDanger, fontWeight: 800 }} onClick={handleClearInterviewSchedules} disabled={actionLoading === "clearInterviews"}>
                        {actionLoading === "clearInterviews" ? "清空中..." : "清空面試排程"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={{ ...styles.infoBanner, marginBottom: 18 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>流程說明:</div>
                  <div style={{ lineHeight: 1.8 }}>
                    1. 系統依照申請資料自動產生面試批次<br />
                    2. 招生人員可匯出面試通知名單，並透過 Email 或 LINE 通知申請人<br />
                    3. 線上面試可填入 Google Meet / Zoom 連結<br />
                    4. 面試完成後，教師回到系統輸入評分<br />
                    5. 系統依照教師評分產生排名與錄取建議
                  </div>
                </div>

                <div style={{ ...styles.formGrid, marginBottom: 18 }}>
                  <input
                    type="date"
                    style={styles.input}
                    value={interviewFilters.date}
                    onChange={(event) => setInterviewFilters({ ...interviewFilters, date: event.target.value })}
                  />
                  <select style={styles.select} value={interviewFilters.mode} onChange={(event) => setInterviewFilters({ ...interviewFilters, mode: event.target.value })}>
                    <option>全部</option>
                    {interviewModeOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select style={styles.select} value={interviewFilters.teacher} onChange={(event) => setInterviewFilters({ ...interviewFilters, teacher: event.target.value })}>
                    <option>全部</option>
                    {interviewTeacherOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select style={styles.select} value={interviewFilters.department} onChange={(event) => setInterviewFilters({ ...interviewFilters, department: event.target.value })}>
                    <option>全部</option>
                    {departmentOptions.filter((item) => item !== "全部").map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <select style={styles.select} value={interviewFilters.status} onChange={(event) => setInterviewFilters({ ...interviewFilters, status: event.target.value })}>
                    <option>全部</option>
                    {interviewStatusOptions.map((item) => <option key={item}>{item}</option>)}
                    {interviewNotificationStatusOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <button type="button" style={styles.buttonLight} onClick={() => setInterviewFilters({ date: "", mode: "全部", teacher: "全部", department: "全部", status: "全部" })}>
                    清除篩選
                  </button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {filteredInterviewSessions.map((session) => (
                    <div
                      key={session.key}
                      style={{
                        ...styles.listCard,
                        marginBottom: 0,
                        borderColor: selectedInterviewSession?.key === session.key ? "#93c5fd" : "#dbe7f5",
                        background: selectedInterviewSession?.key === session.key ? "#f8fbff" : "#fbfdff",
                      }}
                      onClick={() => handleSelectInterviewSession(session)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 900 }}>{session.title}</div>
                            <span style={styles.tag}>{session.applicantCount} 位申請人</span>
                            <StatusBadge status={session.status} />
                            <StatusBadge status={session.notificationStatus} />
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>
                            {session.date} ・ {session.time} ・ {session.mode} ・ {session.location}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                            負責教師：{session.teachers.join("、") || "待指派"} ・ 申請系所：{session.departments.join("、") || "未填寫"}
                          </div>
                          <div style={{ color: "#475569", fontSize: 13, marginTop: 8, lineHeight: 1.7 }}>
                            {session.applicants.map((applicant) => `${applicant.id} ${applicant.name}`).join("、") || "尚未加入申請人"}
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              style={styles.buttonLight}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleMarkInterviewNotified(session);
                              }}
                              disabled={actionLoading === `notify-${session.key}` || session.notificationStatus === "已通知"}
                            >
                              {actionLoading === `notify-${session.key}` ? "更新中..." : "標記為已通知"}
                            </button>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 126 }}>
                          <div style={{ color: "#64748b", fontSize: 12 }}>面試類型</div>
                          <div style={{ fontWeight: 800, marginTop: 6 }}>{session.interviewType}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!filteredInterviewSessions.length ? (
                    <div style={styles.compactCard}>尚無面試排程資料，請先匯入申請資料並執行自動安排面試。</div>
                  ) : null}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>面試批次明細</div>
                  {selectedInterviewSession ? (
                    <>
                      <div style={{ ...styles.compactCard, marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                          <div>
                            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>面試批次 / Interview Batch</div>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{selectedInterviewSession.title}</div>
                          </div>
                          <StatusBadge status={selectedInterviewSession.status} />
                        </div>
                      </div>
                      <div style={styles.formGrid}>
                        <LabelValue label="面試日期 / Interview Date" value={selectedInterviewSession.date} />
                        <LabelValue label="面試時間 / Time Slot" value={selectedInterviewSession.time} />
                        <LabelValue label="面試方式 / Mode" value={selectedInterviewSession.mode} />
                        <LabelValue label="面試地點 / Location or Link" value={renderInterviewLocation(selectedInterviewSession.mode, selectedInterviewSession.location)} />
                        <LabelValue label="負責教師 / Assigned Teacher(s)" value={selectedInterviewSession.teachers.join("、")} />
                        <LabelValue label="通知狀態 / Reminder Status" value={selectedInterviewSession.notificationStatus} />
                        <LabelValue label="申請系所 / Department" value={selectedInterviewSession.departments.join("、")} />
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <button
                          type="button"
                          style={styles.buttonLight}
                          onClick={() => handleMarkInterviewNotified(selectedInterviewSession)}
                          disabled={actionLoading === `notify-${selectedInterviewSession.key}` || selectedInterviewSession.notificationStatus === "已通知"}
                        >
                          {actionLoading === `notify-${selectedInterviewSession.key}` ? "更新中..." : "標記為已通知"}
                        </button>
                      </div>
                      <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>參與申請人 / Applicants in this session</div>
                        {selectedInterviewSession.applicants.map((applicant) => (
                          <div key={applicant.id} style={{ ...styles.compactCard, marginBottom: 10, display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 900 }}>{applicant.id} ・ {applicant.name}</div>
                              <div style={{ ...styles.muted, marginTop: 4 }}>{applicant.department} ・ {applicant.email || "未填 Email"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={styles.muted}>尚無面試排程資料，請先匯入申請資料並執行自動安排面試。</div>
                  )}
                </div>

                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>新增單筆面試安排</div>
                  <form onSubmit={handleScheduleSubmit}>
                    <div style={styles.formGrid}>
                      <select style={styles.select} value={scheduleForm.applicantId} onChange={(event) => setScheduleForm({ ...scheduleForm, applicantId: event.target.value, title: `面試排程 - ${event.target.value}` })}>
                        <option value="">請選擇申請人</option>
                        {students.map((student) => <option key={student.id} value={student.id}>{student.id} - {student.name}</option>)}
                      </select>
                      <input style={styles.input} placeholder="面試標題" value={scheduleForm.title} onChange={(event) => setScheduleForm({ ...scheduleForm, title: event.target.value })} />
                      <input type="date" style={styles.input} value={scheduleForm.date} onChange={(event) => setScheduleForm({ ...scheduleForm, date: event.target.value })} />
                      <select style={styles.select} value={newSchedule.interview_time} onChange={(event) => setNewSchedule({ ...newSchedule, interview_time: event.target.value })} aria-label="面試時間">
                        {interviewTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <select style={styles.select} value={scheduleForm.teacher} onChange={(event) => setScheduleForm({ ...scheduleForm, teacher: event.target.value })}>
                        {interviewTeacherOptions.map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <select style={styles.select} value={scheduleForm.mode} onChange={(event) => setScheduleForm({ ...scheduleForm, mode: event.target.value })}>
                        {interviewModeOptions.map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <input
                        style={{ ...styles.input, gridColumn: "1 / span 2" }}
                        placeholder={scheduleForm.mode === "線上面試" ? "貼上 Google Meet / Zoom / Teams 連結" : "輸入教室或會議室地點"}
                        list="interview-location-options"
                        value={scheduleForm.location}
                        onChange={(event) => setScheduleForm({ ...scheduleForm, location: event.target.value })}
                      />
                      <datalist id="interview-location-options">
                        {interviewLocationOptions.map((item) => <option key={item} value={item} />)}
                      </datalist>
                      <select style={styles.select} value={scheduleForm.status} onChange={(event) => setScheduleForm({ ...scheduleForm, status: event.target.value })}>
                        {interviewStatusOptions.map((item) => <option key={item} value={toBackendScheduleStatus(item)}>{item}</option>)}
                      </select>
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <button type="submit" style={styles.button}>儲存面試排程</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {currentPage === "scoring" && (
            <div style={styles.twoCol}>
              <div style={styles.contentCard}>
                <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>教師評分案件</div>
                {rankingRows.map((student) => (
                  <div key={student.id} style={{ ...styles.listCard, borderColor: selectedStudent?.id === student.id ? "#93c5fd" : "#dbe7f5" }} onClick={() => setSelectedStudentId(student.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{student.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{student.department}</div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                          {student.interview.date || "未排日期"} ・ {student.interview.time || "未排時間"} ・ {student.interview.room || "未填地點"}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>負責教師：{student.interview.teacher || "待指派"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 22 }}>{student.totalScore}</div>
                        <StatusBadge status={student.interview.status || "待面試"} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>面試評分表</div>
                  {selectedStudent ? (
                    <>
                      <div style={styles.compactCard}>
                        <div style={{ fontWeight: 900 }}>{selectedStudent.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
                          {selectedStudent.id} ・ {selectedStudent.department} ・ {interviewRecords[selectedStudent.id]?.teacher || "待指派教師"}
                        </div>
                      </div>

                      <div style={{ ...styles.formGrid, marginTop: 16 }}>
                        <LabelValue label="面試日期" value={interviewRecords[selectedStudent.id]?.date || selectedStudent.interviewDate} />
                        <LabelValue label="面試時間" value={interviewRecords[selectedStudent.id]?.time} />
                        <LabelValue label="面試方式" value={interviewRecords[selectedStudent.id]?.mode || selectedStudent.interviewMode} />
                        <LabelValue
                          label="面試地點 / 線上連結"
                          value={renderInterviewLocation(
                            interviewRecords[selectedStudent.id]?.mode || selectedStudent.interviewMode,
                            interviewRecords[selectedStudent.id]?.room || selectedStudent.interviewRoom
                          )}
                        />
                        <LabelValue label="負責教師" value={interviewRecords[selectedStudent.id]?.teacher || selectedStudent.assignedTeacher} />
                      </div>

                      <div style={{ ...styles.formGrid, marginTop: 16 }}>
                        <div>
                          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>學業能力</div>
                          <input type="number" min="0" max="30" style={styles.input} value={scoreRecords[selectedStudent.id]?.academic || 0} onChange={(event) => handleScoreChange(selectedStudent.id, "academic", event.target.value)} />
                        </div>
                        <div>
                          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>語言能力</div>
                          <input type="number" min="0" max="20" style={styles.input} value={scoreRecords[selectedStudent.id]?.language || 0} onChange={(event) => handleScoreChange(selectedStudent.id, "language", event.target.value)} />
                        </div>
                        <div>
                          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>面試表現</div>
                          <input type="number" min="0" max="20" style={styles.input} value={scoreRecords[selectedStudent.id]?.performance || 0} onChange={(event) => handleScoreChange(selectedStudent.id, "performance", event.target.value)} />
                        </div>
                        <div>
                          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>學習動機</div>
                          <input type="number" min="0" max="20" style={styles.input} value={scoreRecords[selectedStudent.id]?.motivation || 0} onChange={(event) => handleScoreChange(selectedStudent.id, "motivation", event.target.value)} />
                        </div>
                        <div>
                          <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>加分項目</div>
                          <input type="number" min="0" max="10" style={styles.input} value={scoreRecords[selectedStudent.id]?.bonus || 0} onChange={(event) => handleScoreChange(selectedStudent.id, "bonus", event.target.value)} />
                        </div>
                        <div style={styles.scoreBox}>
                          <div style={{ fontSize: 13, opacity: 0.8 }}>總分</div>
                          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 8 }}>
                            {computeTotalScore(scoreRecords[selectedStudent.id] || { academic: 0, language: 0, performance: 0, motivation: 0, bonus: 0 })}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 16 }}>
                        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700 }}>面試評語</div>
                        <textarea
                          rows={5}
                          style={{ ...styles.input, resize: "vertical" }}
                          value={scoreRecords[selectedStudent.id]?.comment || ""}
                          onChange={(event) => handleScoreChange(selectedStudent.id, "comment", event.target.value)}
                        />
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <button style={styles.button} onClick={() => handleSaveScore(selectedStudent.id)} disabled={actionLoading === `score-${selectedStudent.id}`}>
                          {actionLoading === `score-${selectedStudent.id}` ? "儲存中..." : "儲存教師評分"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={styles.muted}>請先選擇申請人。</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentPage === "ranking" && (
            <div style={styles.twoCol}>
              <div style={styles.contentCard}>
                <div style={styles.sectionHeader}>
                  <div>
                    <div style={{ fontSize: 23, fontWeight: 900 }}>排名分析</div>
                    <div style={styles.muted}>依評分總分自動排序，作為系所會議初步參考。</div>
                  </div>
                  <div style={styles.tag}>總分自動計算</div>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>名次</th>
                      <th style={styles.th}>申請人</th>
                      <th style={styles.th}>系所</th>
                      <th style={styles.th}>總分</th>
                      <th style={styles.th}>錄取建議</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingRows.map((student, index) => (
                      <tr key={student.id}>
                        <td style={styles.td}>#{index + 1}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 800 }}>{student.name}</div>
                          <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{student.id}</div>
                        </td>
                        <td style={styles.td}>{student.department}</td>
                        <td style={styles.td}><strong>{student.totalScore}</strong></td>
                        <td style={styles.td}><StatusBadge status={student.recommendation} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>評分結構分析</div>
                  {rankingRows.slice(0, 3).map((student) => (
                    <div key={student.id} style={{ ...styles.compactCard, marginBottom: 12 }}>
                      <div style={{ fontWeight: 900 }}>{student.name}</div>
                      <div style={{ marginTop: 10, fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
                        學業 {student.score.academic} ・ 語言 {student.score.language} ・ 面試 {student.score.performance} ・
                        動機 {student.score.motivation} ・ 加分 {student.score.bonus}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>審查觀察</div>
                  <div style={styles.compactCard}>
                    <div style={{ fontWeight: 800 }}>高分門檻</div>
                    <div style={{ ...styles.muted, marginTop: 8 }}>總分 86 分以上建議優先列入錄取名單。</div>
                  </div>
                  <div style={{ ...styles.compactCard, marginTop: 12 }}>
                    <div style={{ fontWeight: 800 }}>備取區間</div>
                    <div style={{ ...styles.muted, marginTop: 8 }}>76 至 85 分建議列入備取，視名額調整。</div>
                  </div>
                  <div style={{ ...styles.compactCard, marginTop: 12 }}>
                    <div style={{ fontWeight: 800 }}>再評估區間</div>
                    <div style={{ ...styles.muted, marginTop: 8 }}>65 至 75 分可由委員會補充討論後決議。</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === "recommendation" && (
            <div style={styles.twoCol}>
              <div style={styles.contentCard}>
                <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>錄取建議審議</div>
                {rankingRows.map((student) => (
                  <div key={student.id} style={{ ...styles.listCard, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{student.name}</div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{student.department} ・ 總分 {student.totalScore}</div>
                        <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{student.score.comment || "尚無評語。"}</div>
                      </div>
                      {isAdmin ? (
                        <div style={{ minWidth: 160 }}>
                          <select style={styles.select} value={student.recommendation} onChange={(event) => handleRecommendationChange(student.id, event.target.value)}>
                            {["建議錄取", "備取", "再評估", "不錄取"].map((item) => <option key={item}>{item}</option>)}
                          </select>
                        </div>
                      ) : <StatusBadge status={student.recommendation} />}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>審議摘要</div>
                  {["建議錄取", "備取", "再評估", "不錄取"].map((recommendation) => {
                    const count = applicantRecords.filter((item) => item.recommendation === recommendation).length;
                    const color = getRecommendationColor(recommendation);
                    return (
                      <div key={recommendation} style={{ ...styles.compactCard, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ ...styles.tag, background: color.bg, color: color.color }}>{recommendation}</span>
                        <strong>{count} 人</strong>
                      </div>
                    );
                  })}
                </div>

                <div style={styles.contentCard}>
                  <div style={{ fontSize: 23, fontWeight: 900, marginBottom: 16 }}>提報說明</div>
                  <div style={styles.compactCard}>
                    <div style={{ fontWeight: 800 }}>系統建議</div>
                    <div style={{ ...styles.muted, marginTop: 8 }}>
                      本頁提供最終錄取建議調整。現階段採前端假資料維護，後續可直接對接正式審議 API。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentPage === "excel" && (
            <div style={styles.contentCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 900 }}>Excel 批次匯入與審查流程</div>
                  <div style={styles.muted}>集中處理批次匯入、資料檢查、面試安排、教師評分、排名計算與結果匯出。教師評分需由線上輸入或評分 Excel 匯入，不會由系統自動產生。</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <div style={styles.tag}>127.0.0.1:5006 API</div>
                  <button
                    type="button"
                    style={{ ...styles.buttonDanger, fontWeight: 800 }}
                    onClick={handleClearAllDemoData}
                    disabled={actionLoading === "clearData"}
                  >
                    {actionLoading === "clearData" ? "清空中..." : "清空測試資料"}
                  </button>
                </div>
              </div>

              <div style={{ ...styles.workflowStrip, gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
                {["匯入申請資料", "資料檢查與初審", "安排面試", "教師評分", "排名與錄取建議", "匯出結果"].map((label, index) => (
                  <div key={label} style={styles.workflowStep}>
                    <div style={{ color: "#1d4ed8", fontSize: 12, fontWeight: 900, marginBottom: 6 }}>{index + 1}</div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...styles.summaryGrid, gridTemplateColumns: "repeat(6, minmax(0, 1fr))", marginBottom: 20 }}>
                {[
                  ["匯入筆數", excelWorkflowSummary.imported],
                  ["資料完整", excelWorkflowSummary.completeData],
                  ["待補件", excelWorkflowSummary.pendingDocuments],
                  ["已安排面試", excelWorkflowSummary.scheduled],
                  ["已完成評分", excelWorkflowSummary.scored],
                  ["建議錄取", excelWorkflowSummary.recommended],
                ].map(([label, value]) => (
                  <div key={label} style={styles.summaryPanel}>
                    <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {[
                  ["import", "匯入資料"],
                  ["schedule", "面試安排"],
                  ["scoring", "教師評分"],
                  ["ranking", "排名結果"],
                  ["export", "結果匯出"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    style={excelTab === key ? styles.button : styles.buttonLight}
                    onClick={() => setExcelTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {excelTab === "import" && (
                <div>
                  <div style={{ ...styles.actionPanel, marginBottom: 18 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>匯入申請資料</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                      <label style={{ ...styles.input, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
                        <span style={{ color: importFile ? "#0f172a" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{importFile?.name || "尚未選擇 Excel / CSV 檔案"}</span>
                        <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: "#1d4ed8" }}>選擇檔案</span>
                        <input type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
                      </label>
                      <button style={{ ...styles.button, display: "flex", alignItems: "center", gap: 8 }} onClick={handleImportStudents} disabled={actionLoading === "import"}>
                        <Upload size={16} />
                        {actionLoading === "import" ? "匯入中..." : "匯入"}
                      </button>
                      <button style={styles.buttonLight} onClick={handleAutoClassify} disabled={actionLoading === "classify"}>資料檢查與初審</button>
                    </div>
                  </div>

                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>申請編號</th>
                          <th style={styles.th}>申請人姓名</th>
                          <th style={styles.th}>國籍</th>
                          <th style={styles.th}>申請系所</th>
                          <th style={styles.th}>文件狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewRows.slice(0, 12).map((item, index) => (
                          <tr key={`${item.student_id || item.name || "row"}-${index}`}>
                            <td style={styles.td}>{item.student_id || "—"}</td>
                            <td style={styles.td}>{item.name || "—"}</td>
                            <td style={styles.td}>{item.nationality || "—"}</td>
                            <td style={styles.td}>{item.department || "—"}</td>
                            <td style={styles.td}>{item.document_status ? <StatusBadge status={item.document_status} /> : "—"}</td>
                          </tr>
                        ))}
                        {!importPreviewRows.length ? (
                          <tr><td style={styles.td} colSpan={5}>尚未匯入資料。</td></tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {excelTab === "schedule" && (
                <div style={styles.twoCol}>
                  <div>
                    <div style={{ ...styles.actionPanel, marginBottom: 18 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>安排面試</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                        <select style={styles.select} value={schedulingStrategy} onChange={(event) => setSchedulingStrategy(event.target.value)}>
                          {schedulingStrategyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <button style={styles.button} onClick={handleAutoSchedule} disabled={actionLoading === "schedule"}>{actionLoading === "schedule" ? "安排中..." : "自動安排面試"}</button>
                      </div>
                    </div>
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>批次</th>
                            <th style={styles.th}>日期</th>
                            <th style={styles.th}>時間</th>
                            <th style={styles.th}>方式</th>
                            <th style={styles.th}>地點/連結</th>
                            <th style={styles.th}>負責教師</th>
                            <th style={styles.th}>申請人數</th>
                            <th style={styles.th}>狀態</th>
                          </tr>
                        </thead>
                        <tbody>
                          {interviewSessions.map((session) => (
                            <tr key={session.key} onClick={() => handleSelectInterviewSession(session)} style={{ cursor: "pointer" }}>
                              <td style={styles.td}>{session.batch}</td>
                              <td style={styles.td}>{session.date}</td>
                              <td style={styles.td}>{session.time}</td>
                              <td style={styles.td}>{session.mode}</td>
                              <td style={styles.td}>{session.location}</td>
                              <td style={styles.td}>{session.teachers.join("、")}</td>
                              <td style={styles.td}>{session.applicantCount}</td>
                              <td style={styles.td}><StatusBadge status={session.status} /></td>
                            </tr>
                          ))}
                          {!interviewSessions.length ? (
                            <tr><td style={styles.td} colSpan={8}>尚無面試排程資料</td></tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={styles.actionPanel}>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>批次申請人</div>
                    {selectedInterviewSession ? selectedInterviewSession.applicants.map((applicant) => (
                      <div key={applicant.id} style={{ ...styles.compactCard, marginBottom: 10 }}>
                        <div style={{ fontWeight: 900 }}>{applicant.id} ・ {applicant.name}</div>
                        <div style={styles.muted}>{applicant.department}</div>
                      </div>
                    )) : <div style={styles.muted}>請選擇面試批次。</div>}
                  </div>
                </div>
              )}

              {excelTab === "scoring" && (
                <div>
                  <div style={styles.actionGrid}>
                    <div style={styles.actionPanel}>
                      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>A. 線上輸入評分</div>
                      <div style={styles.muted}>教師手動輸入分數並儲存後，系統才會用這些分數計算總分與排名。</div>
                    </div>
                    <div style={styles.actionPanel}>
                      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>B. 離線 Excel 評分</div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button type="button" style={styles.buttonLight} onClick={(event) => handleExcelExport(event, exportScoringTemplateExcel)}>匯出評分表 Excel</button>
                        <label style={{ ...styles.input, display: "flex", justifyContent: "space-between", gap: 12, cursor: "pointer" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: scoreImportFile ? "#0f172a" : "#64748b" }}>{scoreImportFile?.name || "尚未選擇已評分檔案"}</span>
                          <span style={{ color: "#1d4ed8", fontWeight: 800 }}>選擇檔案</span>
                          <input type="file" accept=".xlsx,.csv" style={{ display: "none" }} onChange={(event) => setScoreImportFile(event.target.files?.[0] || null)} />
                        </label>
                        <button style={styles.button} onClick={handleImportScores} disabled={actionLoading === "scoreImport"}>{actionLoading === "scoreImport" ? "匯入中..." : "匯入已評分 Excel"}</button>
                      </div>
                    </div>
                  </div>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>申請編號</th>
                          <th style={styles.th}>申請人</th>
                          <th style={styles.th}>學業表現</th>
                          <th style={styles.th}>語言能力</th>
                          <th style={styles.th}>面試表現</th>
                          <th style={styles.th}>學習動機</th>
                          <th style={styles.th}>加分項目</th>
                          <th style={styles.th}>評語</th>
                          <th style={styles.th}>儲存</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const score = scoreRecords[student.id] || { academic: 0, language: 0, performance: 0, motivation: 0, bonus: 0, comment: "" };
                          return (
                            <tr key={student.id}>
                              <td style={styles.td}>{student.id}</td>
                              <td style={styles.td}>{student.name}</td>
                              <td style={styles.td}><input type="number" min="0" max="30" style={{ ...styles.input, minWidth: 86 }} value={score.academic} onChange={(event) => handleScoreChange(student.id, "academic", event.target.value)} /></td>
                              <td style={styles.td}><input type="number" min="0" max="20" style={{ ...styles.input, minWidth: 86 }} value={score.language} onChange={(event) => handleScoreChange(student.id, "language", event.target.value)} /></td>
                              <td style={styles.td}><input type="number" min="0" max="20" style={{ ...styles.input, minWidth: 86 }} value={score.performance} onChange={(event) => handleScoreChange(student.id, "performance", event.target.value)} /></td>
                              <td style={styles.td}><input type="number" min="0" max="20" style={{ ...styles.input, minWidth: 86 }} value={score.motivation} onChange={(event) => handleScoreChange(student.id, "motivation", event.target.value)} /></td>
                              <td style={styles.td}><input type="number" min="0" max="10" style={{ ...styles.input, minWidth: 86 }} value={score.bonus} onChange={(event) => handleScoreChange(student.id, "bonus", event.target.value)} /></td>
                              <td style={styles.td}><input style={{ ...styles.input, minWidth: 180 }} value={score.comment || ""} onChange={(event) => handleScoreChange(student.id, "comment", event.target.value)} /></td>
                              <td style={styles.td}><button style={styles.buttonLight} onClick={() => handleSaveScore(student.id)} disabled={actionLoading === `score-${student.id}`}>儲存</button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {excelTab === "ranking" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>排名與錄取建議</div>
                      <div style={styles.muted}>排名只會在教師評分存在後產生。</div>
                    </div>
                    <button style={styles.button} onClick={handleGenerateRanking} disabled={actionLoading === "ranking"}>{actionLoading === "ranking" ? "計算中..." : "產生排名"}</button>
                  </div>
                  {!rankingResults.length ? (
                    <div style={styles.infoBanner}>尚未完成教師評分，無法產生正式排名。</div>
                  ) : (
                    <div style={styles.tableWrap}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>名次</th>
                            <th style={styles.th}>申請編號</th>
                            <th style={styles.th}>申請人</th>
                            <th style={styles.th}>總分</th>
                            <th style={styles.th}>錄取建議</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingResults.map((item) => (
                            <tr key={item.student_id}>
                              <td style={styles.td}>#{item.rank}</td>
                              <td style={styles.td}>{item.student_id}</td>
                              <td style={styles.td}>{item.name}</td>
                              <td style={styles.td}>{item.total_score}</td>
                              <td style={styles.td}><StatusBadge status={item.recommendation} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {excelTab === "export" && (
                <div style={styles.actionGrid}>
                  <div style={styles.actionPanel}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>錄取結果</div>
                    <div style={{ ...styles.muted, marginBottom: 12 }}>匯出含排名、總分與錄取建議的結果檔。</div>
                    <button type="button" style={styles.button} onClick={handleExportResults}>匯出錄取結果 Excel</button>
                  </div>
                  <div style={styles.actionPanel}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>面試名單</div>
                    <div style={{ ...styles.muted, marginBottom: 12 }}>提供面試日期、地點、教師與申請人資訊。</div>
                    <button type="button" style={styles.buttonLight} onClick={(event) => handleExcelExport(event, exportInterviewListExcel)}>匯出面試名單 Excel</button>
                  </div>
                  <div style={styles.actionPanel}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>教師評分表</div>
                    <div style={{ ...styles.muted, marginBottom: 12 }}>供教師離線填寫分數後再匯入。</div>
                    <button type="button" style={styles.buttonLight} onClick={(event) => handleExcelExport(event, exportScoringTemplateExcel)}>匯出評分表 Excel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
