# AGENTS.md — Rules bắt buộc cho mọi code trong repo này

> Áp dụng cho cả `apps/api`, `apps/dashboard`, `apps/miniapp`, `packages/shared`.
> Skills đã cài: `clean-code`, `vercel-react-best-practices`, `supabase-postgres-best-practices`.

## 1. Nguyên tắc Clean Code (từ skill clean-code)
- Tên biến/hàm nói rõ ý định: `elapsedTimeInDays`, `isStudentAlreadyCheckedIn`, `haversineMeters`. Cấm `d`, `tmp`, `data1`, `Manager`, `Info`.
- Hàm < 20 dòng, chỉ làm 1 việc, 0-2 tham số. Quá 3 tham số phải dùng object.
- Không comment code xấu — viết lại cho rõ. Chỉ comment khi giải thích lý do nghiệp vụ (vd: vì sao radius mặc định 2000m).
- Không `return null`, không truyền `null`. Dùng `Result` / exception có mã lỗi rõ ràng.
- Không `any`. Mọi API phải có type request/response dùng chung từ `@checkin/shared`.
- Cấu trúc file: khái niệm chung ở trên, chi tiết ở dưới (newspaper metaphor).

## 2. React / ZaUI (từ skill vercel-react-best-practices)
- Mini App: chỉ dùng `zmp-ui` (ZaUI) + `zmp-sdk`, không tự chế CSS framework khác.
- Không import barrel (`@/components/index`). Import trực tiếp file.
- Không định nghĩa component trong component (`rerender-no-inline-components`).
- Tách logic fetch ra `services/`, dùng `Promise.all` cho các call độc lập, không waterfall.
- Component nặng (QR, map, excel) phải `lazy()` + `Suspense`.
- Dashboard ưu tiên Server Component / loader, giảm data truyền xuống client (`server-serialization`).

## 3. Postgres (từ skill supabase-postgres-best-practices)
- Mọi bảng phải có PK, `created_at timestamptz default now()`.
- `attendances` bắt buộc `UNIQUE(session_id, student_code)` để đảm bảo check-in 1 lần.
- Index: `students(student_code)`, `attendances(session_id)`, `sessions(status, ends_at)`.
- Validate ở app + constraint ở DB (defense in depth).
- Không nối chuỗi SQL. Dùng Prisma / parameterized query.

## 4. Quy ước repo
- Ngôn ngữ UI: Tiếng Việt. Tên biến/hàm/comment: Tiếng Anh.
- Mọi tính khoảng cách phải qua `haversineMeters()` trong `@checkin/shared`. Cấm copy công thức lung tung.
- Mọi response API: `{ code, message, data }` với `code` thuộc `SUCCESS | ALREADY_CHECKED | OUT_OF_RANGE | SESSION_CLOSED | STUDENT_NOT_FOUND | INVALID_INPUT`.
- MSSV chuẩn hóa: `trim().toUpperCase()` ở đúng 1 chỗ `normalizeStudentCode()`.
- Excel cột chuẩn: `MSSV | HoTen | Lop | Khoa | Email`.
- Không lưu DB trong Mini App. Mini App stateless, chỉ gọi API.
- Commit theo conventional commits: `feat(api): ...`, `fix(miniapp): ...`.

## 5. Vị trí / QR
- Tọa độ trường lưu theo từng `session` (`latCenter, lngCenter, radiusM`), mặc định `radiusM = 2000`.
- QR payload chỉ chứa `sessionId`, không chứa đáp án hay token bypass. Mọi check bypass đều ở backend.
- Backend là nơi duy nhất quyết định PASS/FAIL.
