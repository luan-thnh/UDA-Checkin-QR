# Hướng dẫn deploy — Supabase + Vercel + Zalo (không cần server riêng)

Tổng thời gian khoảng 20–30 phút nếu đã có tài khoản Supabase / Vercel / Zalo.

```text
Supabase (Postgres)  <--  Vercel "checkin-api" (Functions)  <--  Vercel "checkin-dashboard" (web)
                                                              <--  Zalo Mini App (SV quét)
```

## Bước 0 — Chuẩn bị

- Tài khoản: https://supabase.com, https://vercel.com, https://miniapp.zaloplatforms.com/
- Code đã push lên GitHub (Vercel deploy từ Git).
- Đã có `ZALO_APP_ID` + `ZALO_APP_SECRET` tại https://developers.zalo.me/ (màn hình ID ứng dụng).

## Bước 1 — Supabase (database, ~5 phút)

1. Supabase → **New project** (free) → đặt tên `checkin-qr` → chờ khởi tạo.
2. Vào **SQL Editor** → **New query** → copy toàn bộ nội dung file `apps/api/migrations/001_init.sql` trong repo → **Run**.
   Kiểm tra: vào **Table Editor** phải thấy 3 bảng `students`, `sessions`, `attendances`.
3. Vào **Project Settings → API** (hoặc **Connect**) lấy 2 giá trị:
   - `SUPABASE_URL` (VD: `https://xyzcompany.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` (key `service_role` — **giữ kín**, chỉ nhập cho server, không commit).

## Bước 2 — Vercel project `checkin-api` (~7 phút)

1. Vercel → **Add New → Project** → chọn repo → **Import**.
2. **Configure Project**:
   - **Root Directory**: `apps/api`
   - **Build Command**: `pnpm --filter @checkin/shared build`
   - Output: để mặc định (Functions, không cần output dir).
3. **Environment Variables** (nhập đủ 8 biến, môi trường Production):

   | Biến | Lấy ở đâu |
   |---|---|
   | `ADMIN_EMAIL` | tự đặt, VD `admin@truong.edu.vn` |
   | `ADMIN_PASSWORD` | tự đặt, mật khẩu mạnh |
   | `ADMIN_TOKEN` | tự sinh chuỗi dài ngẫu nhiên (VD 32 ký tự) |
   | `CORS_ORIGINS` | `https://<ten-dashboard>.vercel.app` (thêm ở bước 3 xong quay lại sửa) |
   | `SUPABASE_URL` | bước 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | bước 1 (giữ kín) |
   | `MINI_APP_ID` | bước 4 (tạm để trống, deploy xong quay lại sửa) |
   | `ZALO_APP_SECRET` | https://developers.zalo.me/ (giữ kín) |

4. **Deploy** → xong sẽ có URL dạng `https://checkin-api.vercel.app`. Ghi lại, gọi là `<API_URL>`.
5. Kiểm tra: mở `<API_URL>/api/health` → phải thấy `{"ok":true}`.
   Nếu báo `Chua cau hinh SUPABASE...` là thiếu env → bổ sung rồi **Redeploy**.

## Bước 3 — Vercel project `checkin-dashboard` (~5 phút)

1. Vercel → **Add New → Project** → cùng repo → **Import** (project thứ 2).
2. **Configure Project**:
   - **Root Directory**: `apps/dashboard`
   - Framework: Vite (tự nhận). Build mặc định `pnpm build` (tự chạy `prebuild` build shared trước).
3. **Environment Variables**:

   | Biến | Giá trị |
   |---|---|
   | `VITE_API_URL` | `<API_URL>` ở bước 2 (VD `https://checkin-api.vercel.app`, không `/` cuối) |

4. **Deploy** → có URL `https://<ten-dashboard>.vercel.app`.
5. Quay lại project `checkin-api` → Settings → Environment Variables → sửa `CORS_ORIGINS` thành URL dashboard → **Redeploy** api.

## Bước 4 — Zalo Mini App (~10 phút + chờ duyệt)

1. https://miniapp.zaloplatforms.com/ → tạo Mini App → liên kết với Zalo App `UDA Checkin QR` → lấy **Mini App ID**.
2. Quay lại Vercel `checkin-api` → set `MINI_APP_ID` → **Redeploy** (để QR sinh đúng link).
3. Trong repo, sửa `apps/miniapp/app-config.json` (`app.id` = Mini App ID), tạo file `apps/miniapp/.env`:
   `VITE_API_URL=<API_URL>` (URL Vercel, **không** dùng localhost vì điện thoại không gọi được).
4. Build + upload:
   ```bash
   pnpm --filter @checkin/miniapp build
   ```
   Upload thư mục `apps/miniapp/dist` lên portal Zalo (xin quyền `scope.userLocation`), gửi duyệt.

## Bước 5 — Kiểm tra đầu-cuối trên production

```bash
API=https://checkin-api.vercel.app
curl $API/api/health
TOKEN=$(curl -s -X POST $API/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo $TOKEN
```

1. Dashboard production → login → tạo phiên → bấm **Chiếu** lấy QR.
2. Điện thoại Zalo → quét QR → nhập MSSV → cấp quyền vị trí → `SUCCESS`.
3. Dashboard **Live** thấy dòng điểm danh.

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân → cách sửa |
|---|---|
| Dashboard `CORS error` ở `/api/auth/login` | `CORS_ORIGINS` ở api thiếu domain dashboard → bổ sung + Redeploy api |
| API báo `Chua cau hinh SUPABASE...` | thiếu env Supabase → nhập đủ + Redeploy |
| Quét QR mở sai / không mở app | `MINI_APP_ID` sai hoặc chưa Redeploy api sau khi set |
| Mini App báo GPS lỗi trên máy thật | thiếu `ZALO_APP_SECRET`, hoặc chưa xin `scope.userLocation`, hoặc user từ chối quyền |
| `ALREADY_CHECKED` dù chưa điểm danh | đúng luật: MSSV đó đã check-in QR này rồi — tạo QR (phiên) mới để điểm danh tiếp |
| Vercel build dashboard lỗi thiếu `@checkin/shared` | `prebuild` phải chạy `pnpm --filter @checkin/shared build` (đã có sẵn trong `package.json`) |
