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

- P0 (hiện tại): monorepo + shared + api memory + test xanh.
- P1: Postgres + Prisma + import/export Excel + auth admin.
- P2: Mini App ZaUI + zmp-sdk getLocation.
- P3: Dashboard + QR render + live list.
