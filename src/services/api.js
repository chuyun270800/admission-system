function buildUrl(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function request(path, options = {}) {
  const hasCustomContentType = options.headers && Object.keys(options.headers).some((key) => key.toLowerCase() === "content-type");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        Accept: "application/json",
        ...(isFormData || hasCustomContentType ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error("無法連線至 API");
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  const isJson = contentType.includes("application/json");
  let data = null;

  if (isJson && text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned invalid JSON.");
    }
  }

  if (!response.ok) {
    if (data?.error) {
      throw new Error(data.error);
    }

    if (text) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    throw new Error("Request failed.");
  }

  if (isJson) {
    return data;
  }

  throw new Error("Server returned a non-JSON response.");
}

async function downloadExcel(path, filename) {
  let response;

  try {
    response = await fetch(buildUrl(path), {
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch {
    throw new Error("無法連線至 API");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Export failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
    throw new Error("匯出 API 回傳格式錯誤。");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
  });
}

export function fetchDashboardStats() {
  return request("/api/dashboard/stats");
}

export function fetchStudents(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "All") {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return request(`/api/students${query ? `?${query}` : ""}`);
}

export function createStudent(student) {
  return request("/api/students", {
    method: "POST",
    body: JSON.stringify(student),
  });
}

export function updateStudent(studentId, student) {
  return request(`/api/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify(student),
  });
}

export function saveStudentScore(studentId, score) {
  return request(`/api/students/${studentId}/scores`, {
    method: "PUT",
    body: JSON.stringify(score),
  });
}

export function deleteStudent(studentId) {
  return request(`/api/students/${studentId}`, {
    method: "DELETE",
  });
}

export function fetchSchedules() {
  return request("/api/schedules");
}

export function createSchedule(schedule) {
  return request("/api/schedules", {
    method: "POST",
    body: JSON.stringify(schedule),
  });
}

export function updateScheduleNotificationStatus(batch) {
  return request("/api/schedules/batch-notification-status", {
    method: "PUT",
    body: JSON.stringify(batch),
  });
}

export function importStudentsFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/import/students", {
    method: "POST",
    body: formData,
  });
}

export function importScoresFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/api/import/scores", {
    method: "POST",
    body: formData,
  });
}

export function autoClassifyStudents() {
  return request("/api/students/auto-classify", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function autoScheduleInterviews(options = {}) {
  return request("/api/interviews/auto-schedule", {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export function clearAllInterviews() {
  return request("/api/interviews/clear-all", {
    method: "DELETE",
  });
}

export function generateRankingResults() {
  return request("/api/results/generate-ranking", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function fetchRankingResults() {
  return request("/api/results");
}

export function clearAllDemoData() {
  return request("/api/dev/clear-all-data", {
    method: "DELETE",
  });
}

export function exportResultsExcel() {
  return downloadExcel("/api/export/results", "admission_results.xlsx");
}

export function exportInterviewListExcel() {
  return downloadExcel("/api/export/interviews", "interview_list.xlsx");
}

export function exportInterviewNotificationsExcel() {
  return downloadExcel("/api/export/interview-notifications", "interview_notification_list.xlsx");
}

export function exportScoringTemplateExcel() {
  return downloadExcel("/api/export/scoring-template", "scoring_template.xlsx");
}
