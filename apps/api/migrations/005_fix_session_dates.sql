-- Đảm bảo các cột starts_at và ends_at tồn tại trong bảng sessions
-- Cập nhật cho các DB cũ bị thiếu cột này

ALTER TABLE "public"."sessions" 
ADD COLUMN IF NOT EXISTS "starts_at" timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS "ends_at" timestamptz DEFAULT (now() + interval '1 hour');

-- Cập nhật lại các record cũ nếu đang bị null
UPDATE "public"."sessions" SET starts_at = created_at WHERE starts_at IS NULL;
UPDATE "public"."sessions" SET ends_at = created_at + interval '1 hour' WHERE ends_at IS NULL;
