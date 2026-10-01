import { createServer } from 'node:http';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStudentRows, studentsToCsv, buildSessionDeepLink } from '@checkin/shared';
import { checkIn } from './services/attendance.service.js';
import { listStudents, upsertStudents } from './services/student.service.js';
import { createSession, listSessions, closeSession } from './services/session.service.js';
import { createMemoryDb, seedDemoData } from './store/memory.store.js';
import { createAdminToken, getAdminCredentials, isAuthorized } from './utils/auth.js';
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const dbFile = join(dataDir, 'db.json');
export const db = createMemoryDb();
restoreOrSeed();
function restoreOrSeed() {
    try {
        if (existsSync(dbFile)) {
            const raw = JSON.parse(readFileSync(dbFile, 'utf-8'));
            for (const s of raw.students ?? [])
                db.students.set(s.studentCode, s);
            for (const s of raw.sessions ?? [])
                db.sessions.set(s.id, s);
            for (const a of raw.attendances ?? []) {
                const rec = a;
                db.attendances.set(`${rec.sessionId}::${rec.studentCode}`, a);
            }
            return;
        }
    }
    catch {
        // file hong -> seed lai
    }
    seedDemoData(db);
    persist();
}
function persist() {
    try {
        mkdirSync(dataDir, { recursive: true });
        writeFileSync(dbFile, JSON.stringify({
            students: [...db.students.values()],
            sessions: [...db.sessions.values()],
            attendances: [...db.attendances.values()],
        }, null, 2));
    }
    catch {
        // P0: bo qua loi ghi file
    }
}
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
            try {
                resolve((raw ? JSON.parse(raw) : {}));
            }
            catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
function sendJson(res, status, payload) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
}
function sendCsv(res, filename, csv) {
    res.writeHead(200, {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
    });
    res.end('\uFEFF' + csv);
}
function requireAuth(req, res) {
    if (isAuthorized(req.headers.authorization))
        return true;
    sendJson(res, 401, { code: 'INVALID_INPUT', message: 'Thieu token admin.', data: null });
    return false;
}
export function createApp() {
    return createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const path = url.pathname;
        if (req.method === 'GET' && path === '/health') {
            sendJson(res, 200, { ok: true });
            return;
        }
        if (req.method === 'POST' && path === '/api/auth/login') {
            const body = (await readJsonBody(req));
            const creds = getAdminCredentials();
            if (body.email === creds.email && body.password === creds.password) {
                sendJson(res, 200, {
                    code: 'SUCCESS',
                    message: 'Dang nhap thanh cong.',
                    data: { token: createAdminToken() },
                });
            }
            else {
                sendJson(res, 401, { code: 'INVALID_INPUT', message: 'Sai email/mat khau.', data: null });
            }
            return;
        }
        if (req.method === 'GET' && path === '/api/students') {
            if (!requireAuth(req, res))
                return;
            sendJson(res, 200, {
                code: 'SUCCESS',
                message: 'OK',
                data: listStudents(db, url.searchParams.get('q') ?? ''),
            });
            return;
        }
        if (req.method === 'POST' && path === '/api/students/import') {
            if (!requireAuth(req, res))
                return;
            const body = (await readJsonBody(req));
            const { imported, skipped } = parseStudentRows((body.rows ?? []));
            upsertStudents(db, imported);
            persist();
            sendJson(res, 200, {
                code: 'SUCCESS',
                message: `Nhap ${imported.length} SV, bo qua ${skipped.length} dong.`,
                data: { imported: imported.length, skipped },
            });
            return;
        }
        if (req.method === 'GET' && path === '/api/students/export') {
            if (!requireAuth(req, res))
                return;
            sendCsv(res, 'danh-sach-sinh-vien.csv', studentsToCsv(listStudents(db, '')));
            return;
        }
        if (req.method === 'POST' && path === '/api/sessions') {
            if (!requireAuth(req, res))
                return;
            try {
                const body = (await readJsonBody(req));
                const session = createSession(db, body);
                persist();
                const miniAppId = process.env.MINI_APP_ID ?? 'MINI_APP_ID';
                sendJson(res, 201, {
                    code: 'SUCCESS',
                    message: 'Tao phien thanh cong.',
                    data: { ...session, qrPayload: buildSessionDeepLink(miniAppId, session.id) },
                });
            }
            catch (error) {
                sendJson(res, 400, {
                    code: 'INVALID_INPUT',
                    message: error instanceof Error ? error.message : 'Du lieu phien khong hop le.',
                    data: null,
                });
            }
            return;
        }
        if (req.method === 'GET' && path === '/api/sessions') {
            if (!requireAuth(req, res))
                return;
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
            if (!requireAuth(req, res))
                return;
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
                    lines.push([
                        record.studentCode,
                        student?.fullName ?? '',
                        student?.className ?? '',
                        record.checkedAt,
                        String(record.distanceM),
                    ].join(','));
                }
                sendCsv(res, `diem-danh-${sessionId}.csv`, lines.join('\n'));
                return;
            }
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
        if (req.method === 'POST' && path === '/api/attend') {
            try {
                const body = (await readJsonBody(req));
                const result = checkIn(db, {
                    sessionId: body.sessionId ?? '',
                    studentCode: body.studentCode ?? '',
                    lat: Number(body.lat),
                    lng: Number(body.lng),
                });
                if (result.code === 'SUCCESS')
                    persist();
                const status = result.code === 'SUCCESS' || result.code === 'ALREADY_CHECKED' ? 200 : 400;
                sendJson(res, status, result);
            }
            catch {
                sendJson(res, 400, { code: 'INVALID_INPUT', message: 'Body phai la JSON hop le.', data: null });
            }
            return;
        }
        sendJson(res, 404, { code: 'INVALID_INPUT', message: 'Not found', data: null });
    });
}
