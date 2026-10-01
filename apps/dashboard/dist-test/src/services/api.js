const TOKEN_KEY = 'checkin-admin-token';
function apiBase() {
    const env = import.meta.env;
    return (env?.['VITE_API_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');
}
export function getToken() {
    return localStorage.getItem(TOKEN_KEY) ?? '';
}
export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}
async function request(path, init) {
    const res = await fetch(`${apiBase()}${path}`, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}),
            ...(init?.headers ?? {}),
        },
    });
    if (res.status === 401) {
        clearToken();
        throw new Error('Hết phiên đăng nhập. Hãy đăng nhập lại.');
    }
    const body = (await res.json());
    if (!res.ok)
        throw new Error(body.message || 'Lỗi server.');
    return body.data;
}
export function login(email, password) {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export function fetchStudents(query) {
    return request(`/api/students?q=${encodeURIComponent(query)}`);
}
export function importStudents(rows) {
    return request('/api/students/import', { method: 'POST', body: JSON.stringify({ rows }) });
}
export function studentsExportUrl() {
    return `${apiBase()}/api/students/export`;
}
export function fetchSessions() {
    return request('/api/sessions');
}
export function createSession(input) {
    return request('/api/sessions', { method: 'POST', body: JSON.stringify(input) });
}
export function closeSession(sessionId) {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}/close`, { method: 'POST' });
}
export function fetchAttendances(sessionId) {
    return request(`/api/sessions/${encodeURIComponent(sessionId)}/attendances`);
}
export function downloadWithAuth(path, filename) {
    void fetch(`${apiBase()}${path}`, {
        headers: getToken() ? { authorization: `Bearer ${getToken()}` } : {},
    })
        .then(async (res) => {
        if (!res.ok)
            throw new Error('Không tải được file.');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    })
        .catch((error) => alert(error.message));
}
