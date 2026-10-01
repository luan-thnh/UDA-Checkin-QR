function apiBase() {
    const fromEnv = import.meta.env?.['VITE_API_URL'];
    return (fromEnv ?? 'http://localhost:3001').replace(/\/$/, '');
}
async function readJson(res) {
    const text = await res.text();
    return (text ? JSON.parse(text) : {});
}
export async function getSessionPublic(sessionId) {
    const res = await fetch(`${apiBase()}/api/sessions/${encodeURIComponent(sessionId)}/public`);
    const body = await readJson(res);
    if (!res.ok)
        throw new Error(body.message || 'Không tải được phiên điểm danh.');
    return body.data;
}
export async function submitAttend(req) {
    const res = await fetch(`${apiBase()}/api/attend`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
    });
    return readJson(res);
}
export async function resolveZaloLocationToken(token) {
    const res = await fetch(`${apiBase()}/api/location/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    const body = await readJson(res);
    if (!res.ok)
        throw new Error(body.message || 'Không đổi được token vị trí Zalo.');
    return body.data;
}
