# Mini App Zalo (P2)

Chạy đúng theo https://miniapp.zaloplatforms.com/ + ZaUI https://docs.zaloplatforms.com/docs/MA/zaui

Pages MVP:
- `/checkin?session=xxx`: hiện tên buổi học (GET /api/sessions/:id/public), nhập MSSV (ZaUI Input), lấy GPS qua `zmp-sdk` (`authorize` + `getLocation`), hiện khoảng cách, Submit POST /api/attend.
- `/result`: 3 trạng thái SUCCESS (xanh) / ALREADY_CHECKED (vàng, hiện giờ cũ) / OUT_OF_RANGE|SESSION_CLOSED (đỏ).

Rules:
- Không lưu DB local. Stateless.
- Mọi tính khoảng cách hiển thị dùng `haversineMeters()` từ `@checkin/shared`, nhưng quyết định cuối cùng là backend.
- Dùng `zmp-ui` Page/Header/List/Input/Button/Modal/Snackbar, không tự chế UI.
