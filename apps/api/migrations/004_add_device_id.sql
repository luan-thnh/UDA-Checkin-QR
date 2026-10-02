-- Bổ sung cột device_id để lưu mã định danh thiết bị (Browser Fingerprint)
-- Phục vụ tính năng chống điểm danh hộ trên cùng 1 điện thoại / máy tính

ALTER TABLE "public"."attendances" 
ADD COLUMN IF NOT EXISTS "device_id" text;

-- (Tuỳ chọn) Tạo index cho device_id để query check trùng nhanh hơn
CREATE INDEX IF NOT EXISTS "idx_attendances_device_session" ON "public"."attendances" ("session_id", "device_id");
