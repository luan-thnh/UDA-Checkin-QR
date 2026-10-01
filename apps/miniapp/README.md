# Mini App Zalo (P2 — xong khung, chay duoc browser)

Chạy đúng theo https://miniapp.zaloplatforms.com/ + ZaUI https://docs.zaloplatforms.com/docs/MA/zaui

## Chạy dev (browser, GPS browser)

```bash
# terminal 1: API
pnpm --filter @checkin/api predev
PORT=3001 node apps/api/dist/index.js

# terminal 2: Mini App
pnpm --filter @checkin/miniapp dev
# mo: http://localhost:3002/?session=SS-DEMO-001
```

Nhập MSSV `SV001`kde879 + cho phép GPS trình duyệt → Submit → `SUCCESS`.
Quét lại / submit lại cùng MSSV → `ALREADY_CHECKED`.
Đổi GPS xa >2km → `OUT_OF_RANGE`.

## Trong Zalo thật

1. Tạo app tại https://miniapp.zaloplatforms.com/, xin quyền `scope.userLocation`, điền AppID vào `app-config.json` + `MINI_APP_ID` ở API để sinh QR.
2. `getLocation` của Zalo trả về **token**, không trả lat/lng trực tiếp. Mini App gửi token về `POST /api/location/resolve`, backend đổi token qua Zalo OpenAPI (cần `ZALO_APP_ID/SECRET`) rồi mới trả lat/lng. P2 hiện trả 501 rõ ràng + tự fallback GPS browser khi dev.
3. Upload `apps/miniapp/dist` lên portal Zalo để duyệt (UI 100% ZaUI: Page/Header/Box/Input/Button/Spinner).

## Files

`src/pages/CheckinPage.tsx` (màn hình duy nhất MVP) · `src/hooks/useCheckinLocation.ts` (Zalo → fallback browser) · `src/services/api.ts` (gọi API) · `src/components/StatusCard.tsx` (3 trạng thái).
