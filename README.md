# Check-in QR — Zalo Mini App + Dashboard + API

Điểm danh sinh viên bằng QR: admin tạo phiên trên dashboard → chiếu QR lên lớp → SV quét bằng Zalo → nhập MSSV → gửi kèm GPS (phải trong bán kính trường, mặc định 2km) → mỗi QR mỗi SV chỉ lưu 1 lần.

```text
apps/api        # Backend: Node + TypeScript (local: memory/file, Vercel: Functions + Supabase)
apps/dashboard  # Web admin: React + Vite (login, SV import/export Excel, phiên + QR + chiếu + live)
apps/miniapp    # Zalo Mini App: React + ZaUI (zmp-ui) + zmp-sdk (MSSV + GPS Zalo + submit)
packages/shared # Logic dùng chung: types, Haversine, validate MSSV/form, Excel/CSV
```

Theme: nền sáng, primary `#00a457` (xanh), accent `#f15d2e` (cam).

## 1. Yêu cầu

- Node.js >= 20, pnpm >= 9 (`npm i -g pnpm` nếu chưa có)

## 2. Cài đặt (lần đầu)

```bash
git clone <repo-url> checkin-qr && cd checkin-qr
pnpm install
```

## 3. Cấu hình `.env` (chạy local dùng mặc định vẫn được)

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/miniapp/.env.example apps/miniapp/.env
```

| File | Biến quan trọng | Mặc định local |
|---|---|---|
| `apps/api/.env` | `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `CORS_ORIGINS` | `3001` / `admin@truong.edu.vn` / `admin123` / `dev-admin-token` / 2 port local |
| `apps/api/.env` | `ZALO_APP_SECRET` | trống (chỉ cần khi test GPS Zalo trên máy thật) |
| `apps/dashboard/.env` | `VITE_API_URL` | `http://localhost:3001` |
| `apps/miniapp/.env` | `VITE_API_URL` | `http://localhost:3001` |

> Đổi mật khẩu admin local: sửa `ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `apps/api/.env` rồi restart API.
> Chưa set `SUPABASE_URL` thì API tự chạy memory + lưu file `apps/api/data/db.json` (đủ demo local).
> `MINI_APP_ID` vs `ZALO_APP_ID` là 2 ID khác nhau — xem chú thích trong `apps/api/.env.example`.

## 4. Chạy (3 terminal, lệnh `dev` — không cần build tay)

```bash
# Terminal 1 — API
pnpm --filter @checkin/api dev
# -> http://localhost:3001/health  (phải thấy {"ok":true})

# Terminal 2 — Dashboard admin
pnpm --filter @checkin/dashboard dev
# -> http://localhost:3000  (login: admin@truong.edu.vn / admin123)

# Terminal 3 — Mini App (giả lập trên trình duyệt)
pnpm --filter @checkin/miniapp dev
# -> http://localhost:3002/?session=SS-DEMO-001  (MSSV demo: SV001, SV002)
```

Lần đầu chạy hơi lâu vì `predev` tự build `packages/shared`. Nếu dashboard báo CORS: restart API (đã fix từ commit `0ad5b07`).

## 5. Demo đầu-cuối (3 phút)

1. Dashboard `http://localhost:3000` → đăng nhập → tab **Phiên + QR** → nhập tên môn + tọa độ + bán kính `2000` → **Tạo + sinh QR**.
2. Bấm **Chiếu** để fullscreen QR lên máy chiếu (đếm ngược + số SV đã điểm danh live 3s, `Esc` thoát, có nút **In QR**).
3. Mini App `http://localhost:3002/?session=<id-vừa-tạo>` → nhập MSSV `SV001`kde879 → cho phép GPS → **Điểm danh** → `SUCCESS`.
4. Submit lại cùng MSSV → `ALREADY_CHECKED` (không ghi trùng). Fake GPS xa > 2km (DevTools → Sensors) → `OUT_OF_RANGE`.
5. Dashboard bấm **Live** xem danh sách, **Xuất** tải CSV mở bằng Excel.
6. Tab **Sinh viên** → **Import Excel** (header `MSSV,HoTen,Lop,Khoa,Email`, tối đa 5000 dòng/lần, báo đúng dòng lỗi).

## 6. Test + kiểm tra code

```bash
pnpm --filter @checkin/shared test     # 9 test: Haversine, MSSV, radius, Excel parse, form validate
pnpm --filter @checkin/api test        # 14 test: check-in 1 lần, ngoài 2km, đóng phiên, CORS, Zalo parse...
pnpm --filter @checkin/miniapp test    # 2 test: đọc sessionId từ QR, ngưỡng 2km
pnpm --filter @checkin/dashboard test  # 2 test: map header Excel, xuất CSV

# Typecheck toàn bộ (gồm cả Vercel Functions)
./node_modules/.bin/tsc --noEmit -p apps/api/tsconfig.vercel.json
pnpm --filter @checkin/dashboard typecheck
pnpm --filter @checkin/miniapp typecheck
```

## 7. Build production local (kiểm tra trước khi deploy)

```bash
pnpm --filter @checkin/dashboard build   # ra apps/dashboard/dist
pnpm --filter @checkin/miniapp build     # ra apps/miniapp/dist
PORT=3001 node apps/api/dist/index.js     # API (local dùng bản Node, Vercel dùng api/*.ts)
```

## 8. Deploy Vercel (không cần server riêng)

Dùng **Supabase** (Postgres online). SQLite/file local chỉ dev — lên Vercel là mất data.

1. Tạo project free https://supabase.com → chạy `apps/api/migrations/001_init.sql` trong SQL Editor.
2. Project Vercel **checkin-api**: Root Directory `apps/api`, Build Command `pnpm --filter @checkin/shared build`.
   Env: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`, `CORS_ORIGINS` (= domain dashboard + miniapp), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MINI_APP_ID`, `ZALO_APP_SECRET`.
   API chạy dạng Serverless Functions (`apps/api/api/*.ts`), logic check-in 1 lần + 2km giống hệt local.
3. Project Vercel **checkin-dashboard**: Root Directory `apps/dashboard`.
   Env: `VITE_API_URL=https://<ten-api>.vercel.app`.
4. Mini App: set `VITE_API_URL` về URL api Vercel → `pnpm --filter @checkin/miniapp build` → upload `apps/miniapp/dist` lên https://miniapp.zaloplatforms.com/ (xin quyền `scope.userLocation`, xem `apps/miniapp/app-config.json`).

Chi tiết biến môi trường: `.env.example` ở root và từng app.

## 9. GPS trên máy thật (Zalo)

`getLocation` của Zalo chỉ trả **token**. Mini App lấy thêm `getAccessToken()`, gửi cả 2 về `POST /api/location/resolve`; backend gọi `GET https://graph.zalo.me/v2.0/me/info` (headers `access_token` + `code` + `secret_key` = `ZALO_APP_SECRET`) rồi trả lat/lng. Cần: `ZALO_APP_ID`/`SECRET` từ https://developers.zalo.me/ + `MINI_APP_ID` từ https://miniapp.zaloplatforms.com/ (2 ID khác nhau).

## 10. Luồng nghiệp vụ

1. Admin tạo `session` (môn, giờ, lat/lng trường, radius) → BE sinh QR chứa `sessionId`.
2. SV quét QR bằng Zalo → mở Mini App `/checkin?session=xxx` → nhập MSSV (validate live) + gửi GPS.
3. BE validate: session còn hạn → SV tồn tại → Haversine ≤ radius → chưa điểm danh → insert 1 dòng (`UNIQUE(session_id, student_code)` chống double-submit).
4. Quét lại cùng QR + cùng MSSV → `ALREADY_CHECKED`. QR mới → check-in tiếp.

## 11. Chuẩn code

Xem `AGENTS.md`. Skills lưu trong project (`.agents/skills/`, clone là có):
`clean-code`, `vercel-react-best-practices`, `supabase-postgres-best-practices`, `frontend-design`.
