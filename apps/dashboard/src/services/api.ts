import type { CheckinSession, Student } from '@checkin/shared';

const TOKEN_KEY = 'checkin-admin-token';

function apiBase(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  return (env?.['VITE_API_URL'] ?? 'http://localhost:3001').replace(/\/$/, '');
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  const body = (await res.json()) as { code: string; message: string; data: T };
  if (!res.ok) throw new Error(body.message || 'Lỗi server.');
  return body.data;
}

export function login(email: string, password: string): Promise<{ token: string }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function fetchStudents(query: string): Promise<Student[]> {
  return request(`/api/students?q=${encodeURIComponent(query)}`);
}

export function importStudents(
  rows: unknown[],
): Promise<{ imported: number; skipped: Array<{ row: number; reason: string }> }> {
  return request('/api/students/import', { method: 'POST', body: JSON.stringify({ rows }) });
}

export function studentsExportUrl(): string {
  return `${apiBase()}/api/students/export`;
}

export function fetchSessions(): Promise<CheckinSession[]> {
  return request('/api/sessions');
}

export interface CreatedSession extends CheckinSession {
  qrPayload: string;
}

export function createSession(input: {
  title: string;
  subject?: string;
  className?: string;
  latCenter: number;
  lngCenter: number;
  radiusM: number;
  startsAt: string;
  endsAt: string;
}): Promise<CreatedSession> {
  return request('/api/sessions', { method: 'POST', body: JSON.stringify(input) });
}

export function closeSession(sessionId: string): Promise<CheckinSession> {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/close`, { method: 'POST' });
}

export interface AttendanceListData {
  session: CheckinSession;
  total: number;
  records: Array<Record<string, string | number>>;
}

export function fetchAttendances(sessionId: string): Promise<AttendanceListData> {
  return request(`/api/sessions/${encodeURIComponent(sessionId)}/attendances`);
}

export function fetchAllAttendances(): Promise<Array<Record<string, string | number>>> {
  return request('/api/attendances');
}

export function downloadWithAuth(path: string, filename: string): void {
  void fetch(`${apiBase()}${path}`, {
    headers: getToken() ? { authorization: `Bearer ${getToken()}` } : {},
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Không tải được file.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch((error: Error) => alert(error.message));
}
