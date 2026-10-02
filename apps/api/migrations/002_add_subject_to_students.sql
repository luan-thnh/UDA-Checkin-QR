-- Thêm cột subject vào bảng students
-- Skill: supabase-postgres-best-practices

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS subject text;
