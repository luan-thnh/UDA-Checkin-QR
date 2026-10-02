-- Cải thiện hiệu năng truy vấn cho bảng attendances
-- 1. Index cho việc tìm kiếm điểm danh theo MSSV (Dùng trong tính năng Báo cáo & Lọc sinh viên)
CREATE INDEX IF NOT EXISTS idx_attendances_student_code ON attendances(student_code);

-- 2. Index cho việc tải danh sách điểm danh của 1 phiên (Rất quan trọng khi phiên có > 1000 người)
CREATE INDEX IF NOT EXISTS idx_attendances_session_id ON attendances(session_id);

-- Cải thiện hiệu năng cho bảng sessions
-- 3. Index kết hợp status và ends_at để load danh sách phiên hoạt động nhanh hơn
CREATE INDEX IF NOT EXISTS idx_sessions_status_ends_at ON sessions(status, ends_at);

-- Cải thiện hiệu năng cho bảng students
-- 4. Index cho việc lọc sinh viên theo MSSV (Rất quan trọng khi quét QR hoặc tìm sinh viên)
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);

-- 5. Index để lọc sinh viên theo Lớp học (Dashboard sử dụng tính năng này)
CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
