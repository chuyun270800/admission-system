CREATE DATABASE IF NOT EXISTS admission_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE admission_system;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  chinese_name VARCHAR(120),
  gender VARCHAR(20) NOT NULL,
  age INT NOT NULL,
  nationality VARCHAR(80) NOT NULL,
  passport_no VARCHAR(50),
  arc_no VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(120) UNIQUE,
  address VARCHAR(255),
  department VARCHAR(120) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  admission_type VARCHAR(120) NOT NULL,
  admission_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  application_date DATE NOT NULL,
  interview_date DATE,
  enrollment_date DATE,
  emergency_contact VARCHAR(120),
  emergency_phone VARCHAR(50),
  documents JSON NOT NULL,
  document_status VARCHAR(50) NOT NULL DEFAULT '待補件',
  gpa FLOAT,
  academic_score FLOAT NOT NULL DEFAULT 0,
  language_score FLOAT NOT NULL DEFAULT 0,
  interview_score FLOAT NOT NULL DEFAULT 0,
  motivation_score FLOAT NOT NULL DEFAULT 0,
  bonus_score FLOAT NOT NULL DEFAULT 0,
  total_score FLOAT NOT NULL DEFAULT 0,
  ranking INT,
  recommendation VARCHAR(50),
  comment TEXT,
  assigned_teacher VARCHAR(120),
  interview_mode VARCHAR(50),
  interview_room VARCHAR(120),
  interview_status VARCHAR(50) NOT NULL DEFAULT '未安排',
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  notification_status VARCHAR(50) NOT NULL DEFAULT '未通知',
  student_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedules_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL
);
