import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { parseStudentRows, studentsToCsv, buildSessionDeepLink } from '@checkin/shared';
import { checkIn } from './services/attendance.service.js';
import { listStudents, upsertStudents } from './services/student.service.js';
import { createSession, listSessions, closeSession } from './services/session.service.js';
import { isOriginAllowed } from './utils/cors.js';
import { createAdminToken, getAdminCredentials, isAuthorized } from './utils/auth.js';



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
      const action = url.searchParams.get('action');
      
      if (action === 'template') {
        const header = 'MSSV,HoTen,Lop,MonHoc,Khoa,Email\nSV001,Nguyen Van A,IT01,Lap trinh Web,CNTT,nva@example.com\nSV002,Tran Thi B,IT01,Lap trinh Web,CNTT,ttb@example.com';
        sendCsv(res, 'template-danh-sach.csv', header);
        return;
      }
      
      if (action === 'export') {
        sendCsv(res, 'danh-sach-sinh-vien.csv', studentsToCsv(await listStudents('')));
        return;
      }

      sendJson(res, 200, {
        code: 'SUCCESS',
        message: 'OK',
        data: await listStudents(url.searchParams.get('q') ?? ''),
      });
      return;
    }

    if (req.method === 'POST' && path === '/api/students/import') {
      if (!requireAuth(req, res)) return;
      const body = (await readJsonBody(req)) as { rows?: unknown[] };
      const { imported, skipped } = parseStudentRows((body.rows ?? []) as never);
      await upsertStudents(imported);
      
      sendJson(res, 200, {
        code: 'SUCCESS',
        message: `Nhap ${imported.length} SV, bo qua ${skipped.length} dong.`,
        data: { imported: imported.length, skipped },
      });
      return;
    }



    const attMatch = path.match(/^\/api\/attendances\/([^/]+)\/([^/]+)$/);
    if (req.method === "DELETE" && attMatch) {
      if (!requireAuth(req, res)) return;
      const { deleteAttendance } = await import("./services/attendance.service.js");
      const deleted = await deleteAttendance(decodeURIComponent(attMatch[1]), decodeURIComponent(attMatch[2]));
      if (deleted) sendJson(res, 200, { code: "SUCCESS", message: "Da xoa diem danh", data: null });
      else sendJson(res, 400, { code: "INVALID_INPUT", message: "Khong the xoa", data: null });
      return;
    }

    if (req.method === 'DELETE' && path === '/api/students') {
      if (!requireAuth(req, res)) return;
      const className = url.searchParams.get('className');
      if (className) {
        const { deleteClass } = await import('./services/student.service.js');
        const { deleted } = await deleteClass(className);
        
        sendJson(res, 200, { code: 'SUCCESS', message: `Da xoa ${deleted} sinh vien lop ${className}`, data: { deleted } });
      } else {
        sendJson(res, 400, { code: 'INVALID_INPUT', message: 'Thieu tham so className', data: null });
      }
      return;
    }

    if (req.method === 'DELETE' && path.startsWith('/api/students/')) {
      if (!requireAuth(req, res)) return;
      const studentCode = decodeURIComponent(path.replace('/api/students/', ''));
      if (studentCode !== 'export' && studentCode !== 'import' && studentCode !== 'template') {
        const { deleteStudent } = await import('./services/student.service.js');
        const deleted = await deleteStudent(studentCode);
        if (deleted) 
        sendJson(res, 200, { code: 'SUCCESS', message: deleted ? 'Da xoa sinh vien' : 'Khong tim thay sinh vien', data: { deleted } });
        return;
      }
    }

    if (req.method === 'POST' && path === '/api/sessions') {
      if (!requireAuth(req, res)) return;
      try {
        const body = (await readJsonBody(req)) as unknown as Parameters<typeof createSession>[0];
        const session = await createSession(body);
        
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
      const miniAppId = process.env.MINI_APP_ID ?? 'MINI_APP_ID';
      const sessions = (await listSessions()).map((session: any) => ({
        ...session,
        qrPayload: buildSessionDeepLink(miniAppId, session.id),
      }));
      sendJson(res, 200, { code: 'SUCCESS', message: 'OK', data: sessions });
      return;
    }

    const sessionAction = path.match(/^\/api\/sessions\/([^/]+)\/(public|attendances|export|close|delete)$/);
    if (sessionAction) {
      const sessionId = decodeURIComponent(sessionAction[1]);
      const action = sessionAction[2];
      const { getSession } = await import('./services/session.service.js');
      const session = await getSession(sessionId);

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
        
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'Da dong phien.',
          data: await closeSession(sessionId),
        });
        return;
      }

      if (action === 'delete' && req.method === 'DELETE') {
        const { deleteSession } = await import('./services/session.service.js');
        const deleted = await deleteSession(sessionId);
        if (deleted) 
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: deleted ? 'Da xoa phien diem danh.' : 'Khong the xoa phien.',
          data: { deleted },
        });
        return;
      }

      if (action === 'attendances' && req.method === 'GET') {
        const { getSessionAttendances } = await import('./services/attendance.service.js');
        const records = await getSessionAttendances(sessionId);
        sendJson(res, 200, {
          code: 'SUCCESS',
          message: 'OK',
          data: { session, total: records.length, records },
        });
        return;
      }

            if (action === 'export' && req.method === 'GET') {
        const lines = ['MSSV,HoTen,Lop,ThoiGianCheckin,KhoangCach(m)'];
        const { getSessionAttendances } = await import('./services/attendance.service.js');
        const records = await getSessionAttendances(sessionId);
        for (const record of records) {
          const student = record;
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

    if (req.method === "GET" && path === "/api/attendances/check-device") {
      const sId = url.searchParams.get("session");
      const dId = url.searchParams.get("device");
      if (!sId || !dId) { sendJson(res, 400, { code: "INVALID_INPUT", message: "Missing params" }); return; }
      const { checkDeviceAttendance } = await import("./services/attendance.service.js");
      const check = await checkDeviceAttendance(sId, dId);
      sendJson(res, 200, { code: "SUCCESS", message: "OK", data: check });
      return;
    }

    if (req.method === 'GET' && path === '/api/attendances') {
      if (!requireAuth(req, res)) return;
      const { listAllAttendances } = await import('./services/attendance.service.js');
      const allAttendances = await listAllAttendances();
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
      const { getSession } = await import('./services/session.service.js');
      const session = await getSession(id);
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
        const result = await checkIn({
          sessionId: body.sessionId ?? '',
          studentCode: body.studentCode ?? '',
          lat: Number(body.lat),
          lng: Number(body.lng),
        });
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
