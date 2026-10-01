import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStudentRows, studentsToCsv, buildSessionDeepLink } from '@checkin/shared';
import { checkIn } from './services/attendance.service.js';
import { listStudents, upsertStudents } from './services/student.service.js';
import { createSession, listSessions, closeSession } from './services/session.service.js';
import { createMemoryDb, seedDemoData, type MemoryDb } from './store/memory.store.js';
import { isOriginAllowed } from './utils/cors.js';
import { createAdminToken, getAdminCredentials, isAuthorized } from './utils/auth.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const dbFile = join(dataDir, 'db.json');

export const db: MemoryDb = createMemoryDb();
restoreOrSeed();

function restoreOrSeed(): void {
  try {
    if (existsSync(dbFile)) {
      const raw = JSON.parse(readFileSync(dbFile, 'utf-8')) as {
        students?: unknown[];
        sessions?: unknown[];
        attendances?: unknown[];
      };
      for (const s of raw.students ?? []) db.students.set((s as { studentCode: string }).studentCode, s as never);
      for (const s of raw.sessions ?? []) db.sessions.set((s as { id: string }).id, s as never);
      for (const a of raw.attendances ?? []) {
        const rec = a as { sessionId: string; studentCode: string };
        db.attendances.set(`${rec.sessionId}::${rec.studentCode}`, a as never);
      }
      return;
    }
  } catch {
    // file hong -> seed lai
  }
  seedDemoData(db);
  persist();
}

function persist(): void {
  try {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      dbFile,
      JSON.stringify(
        {
          students: [...db.students.values()],
          sessions: [...db.sessions.values()],
          attendances: [...db.attendances.values()],
        },
        null,
        2,
      ),
    );
  } catch {
    // P0: bo qua loi ghi file
  }
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, never>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve((raw ? JSON.parse(raw) : {}) as Record<string, never>);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendCsv(res: ServerResponse, filename: string, csv: string): void {
  res.writeHead(200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="${filename}"`,
  });
  res.end('\uFEFF' + csv);
}

function requireAuth(req: IncomingMessage, res: ServerResponse): boolean {
  if (isAuthorized(req.headers.authorization)) return true;
  sendJson(res, 401, { code: 'INVALID_INPUT', message: 'Thieu token admin.', data: null });
  return false;
}

export function createApp() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const path = url.pathname;
    const origin = req.headers.origin;

    if (isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && path === '/api/webhook/zalo') {
      // Endpoint de Zalo goi den khi user rut lai su dong y (Revoke Consent) hoac yeu cau xoa du lieu.
      // Yeu cau cua Zalo: Chi can tra ve HTTP 200, kem JSON bao thanh cong la duoc thong qua.
      // (He thong hien tai khong map Zalo ID voi MSSV tren DB nen khong can xoa that).
      sendJson(res, 200, {
        error: 0,
        message: 'Success',
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/auth/login') {
      const body = (await readJsonBody(req)) as { email?: string; password?: string };
      const creds = getAdminCredentials();
      if (body.email === creds.email && body.password === creds.password) {
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'Dang nhap thanh cong.',
          data: { token: createAdminToken() },
        });
      } else {
        sendJson(res, 401, { code: 'INVALID_INPUT', message: 'Sai email/mat khau.', data: null });
      }
      return;
    }

    if (req.method === 'GET' && path === '/api/students') {
      if (!requireAuth(req, res)) return;
      sendJson(res, 200, {
        code: 'SUCCESS',
        message: 'OK',
        data: listStudents(db, url.searchParams.get('q') ?? ''),
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/students/import') {
      if (!requireAuth(req, res)) return;
      const body = (await readJsonBody(req)) as { rows?: unknown[] };
      const { imported, skipped } = parseStudentRows((body.rows ?? []) as never);
      upsertStudents(db, imported);
      persist();
      sendJson(res, 200, {
        code: 'SUCCESS',
        message: `Nhap ${imported.length} SV, bo qua ${skipped.length} dong.`,
        data: { imported: imported.length, skipped },
      });
      return;
    }

    if (req.method === 'GET' && path === '/api/students/template') {
      if (!requireAuth(req, res)) return;
      const header = 'MSSV,HoTen,Lop,Khoa,Email\nSV001,Nguyen Van A,IT01,CNTT,nva@example.com\nSV002,Tran Thi B,IT01,CNTT,ttb@example.com';
      sendCsv(res, 'template-danh-sach-sinh-vien.csv', header);
      return;
    }

    if (req.method === 'GET' && path === '/api/students/export') {
      if (!requireAuth(req, res)) return;
      sendCsv(res, 'danh-sach-sinh-vien.csv', studentsToCsv(listStudents(db, '')));
      return;
    }

    if (req.method === 'POST' && path === '/api/sessions') {
      if (!requireAuth(req, res)) return;
      try {
        const body = (await readJsonBody(req)) as unknown as Parameters<typeof createSession>[1];
        const session = createSession(db, body);
        persist();
        const miniAppId = process.env.MINI_APP_ID ?? 'MINI_APP_ID';
        sendJson(res, 201, {
          code: 'SUCCESS',
          message: 'Tao phien thanh cong.',
          data: { ...session, qrPayload: buildSessionDeepLink(miniAppId, session.id) },
        });
      } catch (error) {
        sendJson(res, 400, {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Du lieu phien khong hop le.',
          data: null,
        });
      }
      return;
    }

    if (req.method === 'GET' && path === '/api/sessions') {
      if (!requireAuth(req, res)) return;
      sendJson(res, 200, { code: 'SUCCESS', message: 'OK', data: listSessions(db) });
      return;
    }

    const sessionAction = path.match(/^\/api\/sessions\/([^/]+)\/(public|attendances|export|close)$/);
    if (sessionAction) {
      const sessionId = decodeURIComponent(sessionAction[1]);
      const action = sessionAction[2];
      const session = db.sessions.get(sessionId);

      if (action === 'public' && req.method === 'GET') {
        if (!session) {
          sendJson(res, 404, { code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
          return;
        }
        const { id, title, subject, latCenter, lngCenter, radiusM, startsAt, endsAt, status } = session;
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'OK',
          data: { id, title, subject, latCenter, lngCenter, radiusM, startsAt, endsAt, status },
        });
        return;
      }

      if (!requireAuth(req, res)) return;
      if (!session) {
        sendJson(res, 404, { code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
        return;
      }

      if (action === 'close' && req.method === 'POST') {
        persist();
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'Da dong phien.',
          data: closeSession(db, sessionId),
        });
        return;
      }

      if (action === 'attendances' && req.method === 'GET') {
        const records = [...db.attendances.values()]
          .filter((record) => record.sessionId === sessionId)
          .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))
          .map((record) => ({ ...record, ...(db.students.get(record.studentCode) ?? {}) }));
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'OK',
          data: { session, total: records.length, records },
        });
        return;
      }

      if (action === 'export' && req.method === 'GET') {
        const lines = ['MSSV,HoTen,Lop,ThoiGianCheckin,KhoangCach(m)'];
        for (const record of [...db.attendances.values()]
          .filter((r) => r.sessionId === sessionId)
          .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {
          const student = db.students.get(record.studentCode);
          lines.push(
            [
              record.studentCode,
              student?.fullName ?? '',
              student?.className ?? '',
              record.checkedAt,
              String(record.distanceM),
            ].join(','),
          );
        }
        sendCsv(res, `diem-danh-${sessionId}.csv`, lines.join('\n'));
        return;
      }
    }

    if (req.method === 'GET' && path === '/api/attendances') {
      if (!requireAuth(req, res)) return;
      const allAttendances = [...db.attendances.values()].map(a => ({
        ...a,
        ...(db.students.get(a.studentCode) ?? {})
      }));
      sendJson(res, 200, {
        code: 'SUCCESS',
        message: 'OK',
        data: allAttendances,
      });
      return;
    }

    // Tuong thich route cu GET /api/sessions/:id (public)
    if (req.method === 'GET' && path.startsWith('/api/sessions/')) {
      const id = decodeURIComponent(path.replace('/api/sessions/', ''));
      const session = db.sessions.get(id);
      if (!session) {
        sendJson(res, 404, { code: 'SESSION_CLOSED', message: 'Session not found', data: null });
        return;
      }
      sendJson(res, 200, { code: 'SUCCESS', message: 'OK', data: session });
      return;
    }

    if (req.method === 'POST' && path === '/api/location/resolve') {
      const body = (await readJsonBody(req)) as { token?: string; accessToken?: string };
      try {
        const { resolveZaloLocationToken, getZaloAppSecret } = await import(
          './services/zalo-location.service.js'
        );
        const coords = await resolveZaloLocationToken({
          locationToken: body.token ?? '',
          userAccessToken: body.accessToken ?? '',
          appSecret: getZaloAppSecret(),
        });
        sendJson(res, 200, { code: 'SUCCESS', message: 'OK', data: coords });
      } catch (error) {
        sendJson(res, 400, {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Khong doi duoc token vi tri.',
          data: null,
        });
      }
      return;
    }

    if (req.method === 'POST' && path === '/api/attend') {      try {
        const body = (await readJsonBody(req)) as {
          sessionId?: string;
          studentCode?: string;
          lat?: number;
          lng?: number;
        };
        const result = checkIn(db, {
          sessionId: body.sessionId ?? '',
          studentCode: body.studentCode ?? '',
          lat: Number(body.lat),
          lng: Number(body.lng),
        });
        if (result.code === 'SUCCESS') persist();
        const status = result.code === 'SUCCESS' || result.code === 'ALREADY_CHECKED' ? 200 : 400;
        sendJson(res, status, result);
      } catch {
        sendJson(res, 400, { code: 'INVALID_INPUT', message: 'Body phai la JSON hop le.', data: null });
      }
      return;
    }

    sendJson(res, 404, { code: 'INVALID_INPUT', message: 'Not found', data: null });
  });
}
