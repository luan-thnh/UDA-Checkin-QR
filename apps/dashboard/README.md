# Dashboard (P3 — xong, chạy được)

## Chạy

```bash
PORT=3001 node apps/api/dist/index.js
pnpm --filter @checkin/dashboard dev  # http://localhost:3000
# login: admin@truong.edu.vn / admin123 (đổi bằng ADMIN_EMAIL/PASSWORD ở API)
```

## Có gì

- Tab **Phiên + QR**: form tạo phiên (tên, lat/lng trường, bán kính, tự set giờ ±2h), list phiên, nút **QR** (SVG, đưa lên màn hình cho SV quét), **Live** (poll 5s: MSSV, họ tên, giờ, khoảng cách), **Xuất** CSV, **Đóng** để khóa QR cũ.
- Tab **Sinh viên**: tìm kiếm MSSV/tên/lớp, **Import Excel** (.xlsx/.xls/.csv, header `MSSV,HoTen,Lop,Khoa,Email`, báo đúng dòng lỗi), **Xuất Excel (CSV)** mở được bằng Excel.
- Token admin lưu `localStorage`, tự logout khi 401.

## Files

`src/app.tsx` · `src/services/api.ts` (fetch + token) · `src/utils/excel.ts` (đọc xlsx bằng sheetjs) · `src/components/LoginForm|StudentsPanel|SessionsPanel.tsx` (QR lazy-load `qrcode.react`).
