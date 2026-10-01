import type { ApiResponse, AttendRequest, AttendSuccessData, CheckinSession } from '@checkin/shared';

function apiBase(): string {
  const fromEnv = (import.meta as unknown as { env?: Record<string, string> }).env?.['VITE_API_URL'];
  return (fromEnv ?? 'http://localhost:3001').replace(/\/$/, '');
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function getSessionPublic(sessionId: string): Promise<CheckinSession> {
  const res = await fetch(`${apiBase()}/api/sessions/${encodeURIComponent(sessionId)}/public`);
  const body = await readJson<ApiResponse<CheckinSession>>(res);
  if (!res.ok) throw new Error(body.message || 'Không tải được phiên điểm danh.');
  return body.data;
}

export async function submitAttend(
  req: AttendRequest,
): Promise<ApiResponse<AttendSuccessData>> {
  const res = await fetch(`${apiBase()}/api/attend`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
  });
  return readJson<ApiResponse<AttendSuccessData>>(res);
}

export async function resolveZaloLocationToken(
  token: string,
  accessToken?: string,
): Promise<{ lat: number; lng: number }> {
  const res = await fetch(`${apiBase()}/api/location/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, accessToken: accessToken ?? '' }),
  });
  const body = await readJson<ApiResponse<{ lat: number; lng: number }>>(res);
  if (!res.ok) throw new Error(body.message || 'Không đổi được token vị trí Zalo.');
  return body.data;
}
