# Check-in QR — Zalo Mini App + Dashboard + API

Monorepo `pnpm workspaces`:

```text
apps/api        # Backend: Hono + TypeScript (P0: memory store, P1: Postgres/Prisma)
apps/dashboard  # Web admin: React + Vite (Next.js sau nếu cần SEO)
apps/miniapp    # Zalo Mini App: React + ZaUI (zmp-ui) + zmp-sdk
packages/shared # Logic dùng chung: types, haversine, validate, excel schema
```

## Chạy nhanh (P0)

```bash
pnpm install
pnpm --filter @checkin/shared test
pnpm --filter @checkin/api test
pnpm --filter @checkin/api dev   # http://localhost:3001
```

## Luồng nghiệp vụ

1. Admin tạo `session` (môn, giờ, lat/lng trường, radius 2000m) → BE sinh QR chứa `sessionId`.
2. SV quét QR bằng Zalo → mở Mini App `/checkin?session=xxx` → nhập MSSV + gửi GPS.
3. BE validate: session còn hạn → SV tồn tại → khoảng cách Haversine ≤ radius → chưa điểm danh → insert 1 dòng.
4. Quét lại cùng QR + cùng MSSV → `ALREADY_CHECKED`, không insert trùng. QR mới → được check-in tiếp.

## Skills / chuẩn code

Xem `AGENTS.md`. Skills đã cài toàn cục (`~/.agents/skills/`):
`clean-code`, `vercel-react-best-practices`, `supabase-postgres-best-practices`.

## Roadmap

- P0 (xong): monorepo + shared + api memory + test xanh.
- P1 (xong): API admin login + CRUD SV/phien + import JSON (dashboard parse xlsx) + export CSV + QR payload + persist `apps/api/data/db.json`. Postgres schema san ở `migrations/001_init.sql`.
- P2 (xong): Mini App ZaUI checkin (MSSV + GPS Zalo/browser + hien khoang cach + 3 trang thai). Chay browser: `pnpm --filter @checkin/miniapp dev` (port 3002, `?session=...`). Trong Zalo: can doi token location o `POST /api/location/resolve` (can ZALO_APP_ID/SECRET).
- P3: Dashboard + QR render + live list.
