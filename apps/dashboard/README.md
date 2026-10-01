# Dashboard (P3)

Admin: login → quản lý SV (import/export Excel) → tạo phiên → hiện QR → xem live điểm danh.

P0 chỉ giữ skeleton. Logic gọi API dùng chung `ApiResponse<T>` từ `@checkin/shared`.
QR render sẽ dùng `qrcode.react` (lazy load), map chọn lat/lng dùng `leaflet`.
