import { createServer } from 'node:http';
import { checkIn } from './services/attendance.service.js';
import { createMemoryDb, seedDemoData } from './store/memory.store.js';
export const db = createMemoryDb();
seedDemoData(db);
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
            try {
                resolve(raw ? JSON.parse(raw) : {});
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
export function createApp() {
    return createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (req.method === 'GET' && url.pathname === '/health') {
            sendJson(res, 200, { ok: true });
            return;
        }
        if (req.method === 'GET' && url.pathname.startsWith('/api/sessions/')) {
            const id = decodeURIComponent(url.pathname.replace('/api/sessions/', ''));
            const session = db.sessions.get(id);
            if (!session) {
                sendJson(res, 404, { code: 'SESSION_CLOSED', message: 'Session not found', data: null });
                return;
            }
            const { id: sid, title, subject, latCenter, lngCenter, radiusM, startsAt, endsAt, status } = session;
            sendJson(res, 200, {
                code: 'SUCCESS',
                message: 'OK',
                data: { id: sid, title, subject, latCenter, lngCenter, radiusM, startsAt, endsAt, status },
            });
            return;
        }
        if (req.method === 'POST' && url.pathname === '/api/attend') {
            try {
                const body = (await readJsonBody(req));
                const result = checkIn(db, {
                    sessionId: body.sessionId ?? '',
                    studentCode: body.studentCode ?? '',
                    lat: Number(body.lat),
                    lng: Number(body.lng),
                });
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
