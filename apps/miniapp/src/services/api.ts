import type { ApiResponse, AttendRequest, AttendSuccessData, CheckinSession } from '@checkin/shared';

export function apiBase(): string {
  // @ts-ignore
  return import.meta.env.VITE_API_URL || '';
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch (e) {
    throw new Error(`Parse JSON loi. HTTP ${res.status}. Text: ${text.slice(0, 100)}`);
  }
}

export async function getSessionPublic(sessionId: string): Promise<CheckinSession> {
  let res: Response;
  const url = `${apiBase()}/api/sessions/${encodeURIComponent(sessionId)}?action=public`;
  try {
    res = await fetch(url);
  } catch (e: any) {
    throw new Error(`Loi ket noi mang (CORS/Offline). URL: ${url}. Loi: ${e.message}`);
  }
  
  const body = await readJson<ApiResponse<CheckinSession>>(res);
  if (!res.ok) throw new Error(`Loi API (${res.status}): ` + (body.message || 'Khong tai duoc phien diem danh.'));
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
